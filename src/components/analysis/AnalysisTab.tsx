'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MatchForAnalysis, AnalysisStatus } from '@/types/analysis';
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

interface RecentMatch {
  matchId: string;
  champion: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  gameMode: string;
  queueId: number;
  gameDuration: number;
  timestamp: number;
  role?: string;
  teamPosition?: string;
}

export default function AnalysisTab({ puuid, region, gameName, tagLine, profileIconId }: AnalysisTabProps) {
  const [matches, setMatches] = useState<MatchForAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [analyzedCache, setAnalyzedCache] = useState<Map<string, any>>(new Map());
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent matches
  const loadMatches = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch recent matches from Riot API
      const response = await fetch(
        `/api/riot/matches?gameName=${encodeURIComponent(gameName || '')}&tagLine=${encodeURIComponent(tagLine || '')}&region=${encodeURIComponent(region)}&puuid=${encodeURIComponent(puuid)}&count=10`
      );

      if (!response.ok) {
        let errorMessage = `Error ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // Ignore JSON parse errors
        }
        throw new Error(errorMessage);
      }

      const recentMatches: RecentMatch[] = await response.json();

      // Filter only Ranked Solo/Duo games (queueId: 420)
      const rankedMatches = recentMatches.filter(match =>
        match.queueId === 420
      );

      // Transform to MatchForAnalysis format
      const transformedMatches: MatchForAnalysis[] = rankedMatches.map(match => ({
        matchId: match.matchId,
        puuid,
        region,
        champion: match.champion,
        result: match.win ? 'win' : 'loss',
        gameDuration: match.gameDuration,
        gameMode: match.gameMode,
        queueId: match.queueId,
        kills: match.kills,
        deaths: match.deaths,
        assists: match.assists,
        role: match.teamPosition || match.role || 'UNKNOWN',
        timestamp: match.timestamp,
        analysisId: analyzedCache.get(match.matchId)?.id || null,
        analysisStatus: analyzedCache.get(match.matchId) ? 'completed' : 'not_started',
        overallScore: analyzedCache.get(match.matchId)?.stats?.overallScore || 0,
        errorsCount: analyzedCache.get(match.matchId)?.errors?.length || 0,
      }));

      setMatches(transformedMatches);
    } catch (error) {
      console.error('Failed to load matches:', error);
      setMatches([]);
    }
    setLoading(false);
  }, [puuid, region, gameName, tagLine, analyzedCache]);

  // Initial load
  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // Start analysis for a match
  const handleStartAnalysis = useCallback(async (matchId: string) => {
    setAnalyzingIds(prev => new Set(prev).add(matchId));

    // Update match status to processing
    setMatches(prev => prev.map(m =>
      m.matchId === matchId
        ? { ...m, analysisStatus: 'processing' as AnalysisStatus }
        : m
    ));

    try {
      const response = await fetch('/api/analysis/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchId, puuid, region }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        // Cache the analysis result
        setAnalyzedCache(prev => new Map(prev).set(matchId, data.data));

        // Update match with analysis results
        setMatches(prev => prev.map(m =>
          m.matchId === matchId
            ? {
                ...m,
                analysisStatus: 'completed' as AnalysisStatus,
                analysisId: data.data.id,
                overallScore: data.data.stats?.overallScore || 0,
                errorsCount: data.data.errors?.length || 0,
              }
            : m
        ));
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Failed to analyze match:', error);
      // Update match status to failed
      setMatches(prev => prev.map(m =>
        m.matchId === matchId
          ? { ...m, analysisStatus: 'failed' as AnalysisStatus }
          : m
      ));
    } finally {
      setAnalyzingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(matchId);
        return newSet;
      });
    }
  }, [puuid, region]);

  // Calculate stats from completed analyses
  const completedMatches = matches.filter(m => m.analysisStatus === 'completed');
  const totalCompleted = completedMatches.length;
  const totalErrors = completedMatches.reduce((sum, m) => sum + m.errorsCount, 0);

  const overallStats = {
    totalGames: totalCompleted,
    avgScore: totalCompleted > 0
      ? Math.round(completedMatches.reduce((sum, m) => sum + m.overallScore, 0) / totalCompleted)
      : 0,
    winRate: totalCompleted > 0
      ? Math.round((completedMatches.filter(m => m.result === 'win').length / totalCompleted) * 100)
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

  // Filter matches
  const filteredMatches = matches.filter(match => {
    if (filter === 'ready') return match.analysisStatus === 'not_started';
    if (filter === 'processing') return match.analysisStatus === 'processing';
    if (filter === 'completed') return match.analysisStatus === 'completed';
    return true;
  });

  // Count by status
  const statusCounts = {
    all: matches.length,
    ready: matches.filter(m => m.analysisStatus === 'not_started').length,
    processing: matches.filter(m => m.analysisStatus === 'processing').length,
    completed: matches.filter(m => m.analysisStatus === 'completed').length,
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading recent matches...</p>
      </div>
    );
  }

  const filterOptions: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: statusCounts.all },
    { key: 'ready', label: 'Ready', count: statusCounts.ready },
    { key: 'processing', label: 'Processing', count: statusCounts.processing },
    { key: 'completed', label: 'Completed', count: statusCounts.completed },
  ];

  return (
    <div style={styles.container}>
      {/* Info Banner */}
      <div style={styles.infoBanner}>
        <div style={styles.infoIcon}>
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 style={styles.infoTitle}>AI Analysis</h3>
          <p style={styles.infoText}>
            Analyze your recent <strong style={{ color: '#00d4ff' }}>Ranked Solo/Duo</strong> games. Click "Analyze" on any match to get detailed insights about your deaths, CS, vision, and objectives.
          </p>
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
          Recent Games
          {statusCounts.processing > 0 && (
            <span style={styles.processingBadge}>
              <span style={styles.processingDot} />
              {statusCounts.processing} analyzing
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
      {filteredMatches.length === 0 ? (
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>
            <svg width="40" height="40" fill="none" stroke="rgba(255,255,255,0.4)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 style={styles.emptyTitle}>
            {filter === 'all' ? 'No recent games found' :
              filter === 'ready' ? 'No games to analyze' :
                filter === 'processing' ? 'No analysis in progress' :
                  'No completed analyses'}
          </h3>
          <p style={styles.emptyText}>
            {filter === 'all'
              ? 'Play some games and come back to analyze them!'
              : 'No games match this filter.'}
          </p>
        </div>
      ) : (
        <div style={styles.gamesGridCards}>
          {filteredMatches.map((match, index) => (
            <div
              key={match.matchId}
              style={{
                animation: `fadeInUp 0.3s ease-out ${index * 50}ms forwards`,
                opacity: 0,
              }}
            >
              <GameAnalysisCard
                match={match}
                onStartAnalysis={handleStartAnalysis}
                isStarting={analyzingIds.has(match.matchId)}
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
  infoBanner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
    border: '1px solid rgba(0, 212, 255, 0.2)',
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: 'rgba(0, 212, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#00d4ff',
    flexShrink: 0,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: 'white',
    margin: '0 0 4px 0',
  },
  infoText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    margin: 0,
    lineHeight: 1.5,
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
    flexDirection: 'column',
    gap: 12,
  },
  listTitle: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    fontSize: 16,
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
    gap: 6,
    flexWrap: 'wrap',
  },
  filterButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: 'none',
    whiteSpace: 'nowrap',
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
    flexDirection: 'column',
    gap: 12,
    paddingBottom: 60,
  },
  gamesGridCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 16,
    paddingBottom: 60,
  },
};
