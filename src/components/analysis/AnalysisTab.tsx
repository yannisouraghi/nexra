'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RecordingWithAnalysis } from '@/types/analysis';
import { getUserRecordings, getUserAnalyses, createAndStartAnalysis } from '@/utils/nexraApi';
import AnalysisOverview from './AnalysisOverview';
import GameAnalysisCard from './GameAnalysisCard';

interface AnalysisTabProps {
  puuid: string;
  region: string;
  gameName?: string;
  tagLine?: string;
  profileIconId?: number;
}

type FilterType = 'all' | 'ready' | 'processing' | 'completed';

export default function AnalysisTab({ puuid, region, gameName, tagLine, profileIconId }: AnalysisTabProps) {
  const [recordings, setRecordings] = useState<RecordingWithAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [startingIds, setStartingIds] = useState<Set<string>>(new Set());
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [visionStatus, setVisionStatus] = useState<{
    running: boolean;
    linked: boolean;
    account: string | null;
    checking: boolean;
    linking: boolean;
    error: string | null;
  }>({
    running: false,
    linked: false,
    account: null,
    checking: true,
    linking: false,
    error: null,
  });

  // Check Nexra Vision status
  const checkVisionStatus = useCallback(async () => {
    setVisionStatus(prev => ({ ...prev, checking: true, error: null }));
    try {
      const response = await fetch('/api/vision/link');
      const data = await response.json();
      setVisionStatus(prev => ({
        ...prev,
        running: data.running ?? false,
        linked: data.linked ?? false,
        account: data.account ?? null,
        checking: false,
      }));
    } catch {
      setVisionStatus(prev => ({
        ...prev,
        running: false,
        checking: false,
      }));
    }
  }, []);

  // Link account to Nexra Vision
  const linkToVision = useCallback(async () => {
    if (!gameName || !tagLine || !puuid) return;

    setVisionStatus(prev => ({ ...prev, linking: true, error: null }));
    try {
      const response = await fetch('/api/vision/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puuid, gameName, tagLine, region, profileIconId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setVisionStatus(prev => ({
          ...prev,
          linked: true,
          account: `${gameName}#${tagLine}`,
          linking: false,
        }));
      } else {
        setVisionStatus(prev => ({
          ...prev,
          linking: false,
          error: data.error || 'Failed to link account',
        }));
      }
    } catch {
      setVisionStatus(prev => ({
        ...prev,
        linking: false,
        error: 'Could not connect to Nexra Vision',
      }));
    }
  }, [puuid, gameName, tagLine, region, profileIconId]);

  // Check Vision status on mount with fast polling
  useEffect(() => {
    checkVisionStatus();
    const interval = setInterval(checkVisionStatus, 5000);
    return () => clearInterval(interval);
  }, [checkVisionStatus]);

  // Load recordings with analysis status + existing analyses (for backwards compatibility)
  const loadRecordings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Fetch recordings AND existing analyses for both real puuid and 'local-user'
      const [userRecordings, localRecordings, userAnalyses, localAnalyses] = await Promise.all([
        getUserRecordings(puuid),
        getUserRecordings('local-user'),
        getUserAnalyses(puuid),
        getUserAnalyses('local-user'),
      ]);

      // Combine recordings
      const allRecordings = [...userRecordings, ...localRecordings];

      // Convert existing analyses to RecordingWithAnalysis format (for backwards compatibility)
      const allAnalyses = [...userAnalyses, ...localAnalyses];
      const analysesAsRecordings: RecordingWithAnalysis[] = allAnalyses
        .filter(a => a.status === 'completed') // Only show completed analyses without recordings
        .map(analysis => ({
          recordingId: `analysis-${analysis.id}`,
          matchId: analysis.matchId,
          puuid: analysis.puuid,
          region: analysis.region,
          videoKey: '',
          recordingDuration: null,
          fileSize: null,
          recordingCreatedAt: analysis.createdAt,
          uploadedAt: null,
          analysisId: analysis.id,
          analysisStatus: analysis.status as RecordingWithAnalysis['analysisStatus'],
          progress: 100, // Completed analyses are 100%
          progressMessage: null,
          champion: analysis.champion || null,
          result: analysis.result || null,
          gameDuration: analysis.duration || null,
          gameMode: analysis.gameMode || null,
          kills: analysis.kills || 0,
          deaths: analysis.deaths || 0,
          assists: analysis.assists || 0,
          role: analysis.role || null,
          overallScore: analysis.stats?.overallScore || 0,
          errorsCount: analysis.stats?.errorsFound || analysis.errors?.length || 0,
          analysisCreatedAt: analysis.createdAt,
          completedAt: analysis.completedAt || null,
          errorMessage: analysis.errorMessage || null,
        }));

      // Merge: recordings take priority, then add analyses that don't have recordings
      const recordingMatchIds = new Set(allRecordings.map(r => r.matchId));
      const uniqueAnalyses = analysesAsRecordings.filter(a => !recordingMatchIds.has(a.matchId));

      const combined = [...allRecordings, ...uniqueAnalyses];

      // Deduplicate by matchId (keep first occurrence)
      const uniqueRecordings = combined.filter((rec, index, self) =>
        index === self.findIndex(r => r.matchId === rec.matchId)
      );

      // Sort by date (newest first)
      uniqueRecordings.sort((a, b) => {
        const dateA = a.recordingCreatedAt ? new Date(a.recordingCreatedAt.replace(' ', 'T') + 'Z').getTime() : 0;
        const dateB = b.recordingCreatedAt ? new Date(b.recordingCreatedAt.replace(' ', 'T') + 'Z').getTime() : 0;
        return dateB - dateA;
      });

      setRecordings(uniqueRecordings);
    } catch (error) {
      console.error('Failed to load recordings:', error);
      setRecordings([]);
    }
    if (!silent) setLoading(false);
  }, [puuid]);

  // Initial load
  useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);

  // Polling for processing analyses
  useEffect(() => {
    const hasProcessing = recordings.some(r => r.analysisStatus === 'processing' || r.analysisStatus === 'pending');

    if (hasProcessing) {
      // Start polling every 3 seconds when there are processing analyses
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => {
          loadRecordings(true); // Silent refresh
        }, 3000);
      }
    } else {
      // Stop polling when no processing analyses
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [recordings, loadRecordings]);

  // Start analysis for a recording
  const handleStartAnalysis = useCallback(async (recordingId: string, matchId: string) => {
    setStartingIds(prev => new Set(prev).add(recordingId));
    try {
      await createAndStartAnalysis(matchId, puuid, region, true);
      // Refresh to get updated status
      await loadRecordings(true);
    } catch (error) {
      console.error('Failed to start analysis:', error);
    } finally {
      setStartingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(recordingId);
        return newSet;
      });
    }
  }, [puuid, region, loadRecordings]);

  // Calculate stats
  const completedRecordings = recordings.filter(r => r.analysisStatus === 'completed');
  const totalCompleted = completedRecordings.length;
  const totalErrors = completedRecordings.reduce((sum, r) => sum + r.errorsCount, 0);

  const overallStats = {
    totalGames: totalCompleted,
    avgScore: totalCompleted > 0
      ? Math.round(completedRecordings.reduce((sum, r) => sum + r.overallScore, 0) / totalCompleted)
      : 0,
    winRate: totalCompleted > 0
      ? Math.round((completedRecordings.filter(r => r.result === 'win').length / totalCompleted) * 100)
      : 0,
    totalErrors,
    avgErrorsPerGame: totalCompleted > 0 ? Math.round((totalErrors / totalCompleted) * 10) / 10 : 0,
    mostCommonErrors: [
      { type: 'positioning' as const, count: Math.ceil(totalErrors * 0.3) },
      { type: 'cs-missing' as const, count: Math.ceil(totalErrors * 0.25) },
      { type: 'vision' as const, count: Math.ceil(totalErrors * 0.2) },
      { type: 'map-awareness' as const, count: Math.ceil(totalErrors * 0.15) },
    ],
  };

  // Filter recordings
  const filteredRecordings = recordings.filter(rec => {
    if (filter === 'ready') return rec.analysisStatus === 'not_started' || rec.analysisStatus === 'pending';
    if (filter === 'processing') return rec.analysisStatus === 'processing';
    if (filter === 'completed') return rec.analysisStatus === 'completed';
    return true;
  });

  // Count by status
  const statusCounts = {
    all: recordings.length,
    ready: recordings.filter(r => r.analysisStatus === 'not_started' || r.analysisStatus === 'pending').length,
    processing: recordings.filter(r => r.analysisStatus === 'processing').length,
    completed: recordings.filter(r => r.analysisStatus === 'completed').length,
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Chargement des enregistrements...</p>
      </div>
    );
  }

  const filterOptions: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'Toutes', count: statusCounts.all },
    { key: 'ready', label: 'Prêtes', count: statusCounts.ready },
    { key: 'processing', label: 'En cours', count: statusCounts.processing },
    { key: 'completed', label: 'Terminées', count: statusCounts.completed },
  ];

  return (
    <div style={styles.container}>
      {/* Nexra Vision Connection Status */}
      <div style={{
        ...styles.visionCard,
        borderColor: visionStatus.running && visionStatus.linked
          ? 'rgba(34, 197, 94, 0.3)'
          : visionStatus.running
            ? 'rgba(234, 179, 8, 0.3)'
            : 'rgba(168, 85, 247, 0.2)',
      }}>
        <div style={styles.visionHeader}>
          <div style={styles.visionInfo}>
            <div style={{
              ...styles.visionIcon,
              background: visionStatus.running && visionStatus.linked
                ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(16, 185, 129, 0.3) 100%)'
                : visionStatus.running
                  ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.3) 0%, rgba(245, 158, 11, 0.3) 100%)'
                  : 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(0, 212, 255, 0.3) 100%)',
              color: visionStatus.running && visionStatus.linked ? '#22c55e' : visionStatus.running ? '#eab308' : '#a855f7',
            }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 style={styles.visionTitle}>Nexra Vision</h3>
              <p style={{
                ...styles.visionSubtitle,
                color: visionStatus.running && visionStatus.linked
                  ? 'rgba(34, 197, 94, 0.8)'
                  : 'rgba(255,255,255,0.5)',
              }}>
                {visionStatus.checking
                  ? 'Detecting...'
                  : visionStatus.running
                    ? visionStatus.linked
                      ? `Connected: ${visionStatus.account}`
                      : 'Detected - Not linked'
                    : 'Not detected - Launch Nexra Vision'}
              </p>
            </div>
          </div>

          {/* Status Indicator */}
          <div style={styles.statusWrapper}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {visionStatus.running && visionStatus.linked && (
                <div
                  style={{
                    position: 'absolute',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: '#22c55e',
                    opacity: 0.3,
                    animation: 'pulse-ring 2s ease-out infinite',
                  }}
                />
              )}
              <div
                style={{
                  ...styles.statusDot,
                  backgroundColor: visionStatus.checking
                    ? '#6b7280'
                    : visionStatus.running
                      ? visionStatus.linked
                        ? '#22c55e'
                        : '#eab308'
                      : '#ef4444',
                  boxShadow: visionStatus.running
                    ? visionStatus.linked
                      ? '0 0 12px #22c55e'
                      : '0 0 10px #eab308'
                    : '0 0 10px #ef4444',
                  animation: visionStatus.checking ? 'pulse 1.5s ease-in-out infinite' : 'none',
                }}
              />
            </div>
            <span style={{
              ...styles.statusText,
              color: visionStatus.checking
                ? '#6b7280'
                : visionStatus.running
                  ? visionStatus.linked ? '#22c55e' : '#eab308'
                  : '#ef4444',
            }}>
              {visionStatus.checking
                ? 'Detecting...'
                : visionStatus.running
                  ? visionStatus.linked ? 'Connected' : 'Detected'
                  : 'Offline'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={styles.visionActions}>
          {visionStatus.running && !visionStatus.linked && gameName && tagLine && (
            <button
              onClick={linkToVision}
              disabled={visionStatus.linking}
              style={{
                ...styles.linkButton,
                opacity: visionStatus.linking ? 0.6 : 1,
              }}
            >
              {visionStatus.linking ? (
                <>
                  <span style={styles.miniSpinner} />
                  Linking...
                </>
              ) : (
                <>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Link Account
                </>
              )}
            </button>
          )}

          {!visionStatus.running && !visionStatus.checking && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <div style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#00d4ff',
                animation: 'pulse 2s ease-in-out infinite',
              }} />
              <p style={styles.visionHelp}>
                Auto-detecting... Launch Nexra Vision to connect.
              </p>
            </div>
          )}

          {visionStatus.error && (
            <p style={styles.visionError}>{visionStatus.error}</p>
          )}

          <button onClick={checkVisionStatus} style={styles.refreshButton}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Overview Section - Only show if has completed analyses */}
      {totalCompleted > 0 && <AnalysisOverview stats={overallStats} />}

      {/* Games List Header */}
      <div style={styles.listHeader}>
        <h2 style={styles.listTitle}>
          <svg width="20" height="20" fill="none" stroke="#00d4ff" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Mes Parties
          {statusCounts.processing > 0 && (
            <span style={styles.processingBadge}>
              <span style={styles.processingDot} />
              {statusCounts.processing} en cours
            </span>
          )}
        </h2>

        {/* Filter Buttons */}
        <div style={styles.filterButtons}>
          {filterOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              style={{
                ...styles.filterButton,
                backgroundColor: filter === opt.key ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.05)',
                color: filter === opt.key ? '#00d4ff' : 'rgba(255,255,255,0.6)',
                borderColor: filter === opt.key ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.1)',
              }}
            >
              {opt.label}
              {opt.count > 0 && (
                <span style={{
                  ...styles.filterCount,
                  backgroundColor: filter === opt.key ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.1)',
                }}>
                  {opt.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Games Grid */}
      {filteredRecordings.length === 0 ? (
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>
            <svg width="40" height="40" fill="none" stroke="rgba(255,255,255,0.4)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 style={styles.emptyTitle}>
            {filter === 'all' ? 'Aucune partie enregistrée' :
              filter === 'ready' ? 'Aucune partie en attente' :
                filter === 'processing' ? 'Aucune analyse en cours' :
                  'Aucune analyse terminée'}
          </h3>
          <p style={styles.emptyText}>
            {filter === 'all'
              ? 'Utilise Nexra Vision pour enregistrer tes parties. Après chaque match, tu pourras lancer l\'analyse IA.'
              : 'Aucune partie ne correspond à ce filtre.'}
          </p>
        </div>
      ) : (
        <div style={styles.gamesGrid}>
          {filteredRecordings.map((recording, index) => (
            <div
              key={recording.recordingId}
              style={{
                animation: `fadeInUp 0.3s ease-out ${index * 50}ms forwards`,
                opacity: 0,
              }}
            >
              <GameAnalysisCard
                recording={recording}
                onStartAnalysis={handleStartAnalysis}
                isStarting={startingIds.has(recording.recordingId)}
              />
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 0.4;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  visionCard: {
    padding: '16px 20px',
    borderRadius: 12,
    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(0, 212, 255, 0.1) 100%)',
    border: '1px solid rgba(168, 85, 247, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  visionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  visionInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  visionIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(0, 212, 255, 0.3) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#a855f7',
  },
  visionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: 'white',
    margin: 0,
  },
  visionSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    margin: 0,
  },
  statusWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
  },
  statusText: {
    fontSize: 13,
    fontWeight: 600,
  },
  visionActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  linkButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 18px',
    borderRadius: 8,
    background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
    border: 'none',
    color: 'white',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  miniSpinner: {
    width: 14,
    height: 14,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  visionHelp: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    margin: 0,
    flex: 1,
  },
  visionError: {
    fontSize: 13,
    color: '#ef4444',
    margin: 0,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginLeft: 'auto',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    gap: 16,
  },
  spinner: {
    width: 48,
    height: 48,
    border: '4px solid rgba(0,212,255,0.2)',
    borderTopColor: '#00d4ff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    margin: 0,
  },
  listHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
  },
  listTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 20,
    fontWeight: 700,
    color: 'white',
    margin: 0,
  },
  processingBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginLeft: 12,
    padding: '4px 12px',
    borderRadius: 12,
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    color: '#00d4ff',
    fontSize: 12,
    fontWeight: 600,
  },
  processingDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: '#00d4ff',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  filterButtons: {
    display: 'flex',
    gap: 8,
  },
  filterButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: 'none',
  },
  filterCount: {
    padding: '2px 8px',
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 600,
  },
  emptyCard: {
    padding: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    textAlign: 'center',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    margin: '0 auto 16px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(0,212,255,0.2))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: 'white',
    marginBottom: 8,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    maxWidth: 400,
    margin: '0 auto',
    lineHeight: 1.6,
  },
  gamesGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
    paddingBottom: 60,
  },
};
