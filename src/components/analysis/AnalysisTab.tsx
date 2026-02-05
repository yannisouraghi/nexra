'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { MatchForAnalysis, AnalysisStatus } from '@/types/analysis';
import AnalysisOverview from './AnalysisOverview';
import GameAnalysisCard from './GameAnalysisCard';
import AnalysisModal from './AnalysisModal';
import { NEXRA_API_URL } from '@/config/api';

// Generate auth header from session
function getAuthHeaders(userId?: string, email?: string): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (userId && email) {
    headers['Authorization'] = `Bearer ${userId}:${email}`;
  }
  return headers;
}

interface AnalysisTabProps {
  puuid: string;
  region: string;
  gameName?: string;
  tagLine?: string;
  onInsufficientCredits?: () => void;
}

type FilterType = 'all' | 'ready' | 'processing' | 'completed';
type AnalysisLanguage = 'en' | 'fr' | 'es' | 'de' | 'pt';

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

export default function AnalysisTab({ puuid, region, gameName, tagLine, onInsufficientCredits }: AnalysisTabProps) {
  const { data: session, update: updateSession } = useSession();
  const [matches, setMatches] = useState<MatchForAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [analyzedCache, setAnalyzedCache] = useState<Map<string, any>>(new Map());
  const [selectedMatch, setSelectedMatch] = useState<MatchForAnalysis | null>(null);
  const [creditError, setCreditError] = useState<string | null>(null);
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null);
  // Ref for cache to avoid stale closures in callbacks, state for re-renders
  const analyzedCacheRef = useRef<Map<string, any>>(new Map());
  const hasLoadedRef = useRef(false);
  const pollingIntervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // Fetch user registration date (only once on mount)
  const userCreatedAtFetchedRef = useRef(false);
  useEffect(() => {
    const fetchUserCreatedAt = async () => {
      const user = session?.user as { id?: string; email?: string };
      if (!user?.id || userCreatedAtFetchedRef.current) return;

      userCreatedAtFetchedRef.current = true;

      try {
        const response = await fetch(`${NEXRA_API_URL}/users/${user.id}`, {
          headers: getAuthHeaders(user.id, user.email),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.createdAt) {
            setUserCreatedAt(data.data.createdAt);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserCreatedAt();
  }, [session]);

  // Load recent matches
  const loadMatches = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
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

      // Filter only Ranked Solo/Duo games (queueId: 420) played AFTER user registration
      // Exclude remakes and short games (less than 15 minutes / 900 seconds)
      const registrationTime = userCreatedAt ? new Date(userCreatedAt).getTime() : 0;
      const MIN_GAME_DURATION = 900; // 15 minutes in seconds
      const rankedMatches = recentMatches.filter(match => {
        const isRankedSolo = match.queueId === 420;
        const isAfterRegistration = registrationTime === 0 || match.timestamp >= registrationTime;
        const isNotRemake = match.gameDuration >= MIN_GAME_DURATION;
        return isRankedSolo && isAfterRegistration && isNotRemake;
      });

      // Transform to MatchForAnalysis format (use ref to avoid re-renders)
      const cache = analyzedCacheRef.current;
      const transformedMatches: MatchForAnalysis[] = rankedMatches.map(match => {
        const cached = cache.get(match.matchId);
        const cachedStatus = cached?.status;
        let analysisStatus: AnalysisStatus = 'not_started';
        if (cachedStatus === 'completed') analysisStatus = 'completed';
        else if (cachedStatus === 'processing') analysisStatus = 'processing';
        else if (cachedStatus === 'failed') analysisStatus = 'failed';
        else if (cached) analysisStatus = 'completed';

        return {
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
          analysisId: cached?.id || null,
          analysisStatus,
          overallScore: cached?.stats?.overallScore || 0,
          errorsCount: cached?.errors?.length || 0,
          progress: cached?.progress ?? undefined,
          progressMessage: cached?.progressMessage ?? undefined,
        };
      });

      // Add previously analyzed games that are no longer in the recent matches
      const recentMatchIds = new Set(transformedMatches.map(m => m.matchId));
      cache.forEach((analysis, matchId) => {
        if (!recentMatchIds.has(matchId) && analysis.status === 'completed') {
          transformedMatches.push({
            matchId,
            puuid,
            region,
            champion: analysis.champion || 'Unknown',
            result: (analysis.result as 'win' | 'loss') || 'loss',
            gameDuration: analysis.duration || 0,
            gameMode: analysis.gameMode || 'CLASSIC',
            queueId: 420,
            kills: analysis.kills || 0,
            deaths: analysis.deaths || 0,
            assists: analysis.assists || 0,
            role: analysis.role || 'UNKNOWN',
            timestamp: analysis.createdAt ? new Date(analysis.createdAt).getTime() : 0,
            analysisId: analysis.id,
            analysisStatus: 'completed',
            overallScore: analysis.stats?.overallScore || 0,
            errorsCount: analysis.errors?.length || 0,
          });
        }
      });

      // Sort by timestamp descending (most recent first)
      transformedMatches.sort((a, b) => b.timestamp - a.timestamp);

      // Limit "ready to analyze" games to the 10 most recent
      const MAX_READY_GAMES = 10;
      let readyCount = 0;
      const finalMatches = transformedMatches.filter(m => {
        if (m.analysisStatus === 'not_started') {
          readyCount++;
          return readyCount <= MAX_READY_GAMES;
        }
        return true; // always keep analyzed/processing games
      });

      setMatches(finalMatches);
    } catch (error) {
      console.error('Failed to load matches:', error);
      setMatches([]);
    }
    setLoading(false);
  }, [puuid, region, gameName, tagLine, userCreatedAt]);

  // Poll a specific analysis for progress updates
  const startPolling = useCallback((analysisId: string, matchId: string) => {
    // Don't create duplicate intervals
    if (pollingIntervalsRef.current.has(matchId)) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/analysis/${analysisId}`);
        if (!response.ok) return;

        const data = await response.json();
        if (!data.success || !data.data) return;

        const analysis = data.data;
        const serverProgress = analysis.progress ?? 0;
        const serverMessage = analysis.progressMessage ?? '';

        if (analysis.status === 'completed') {
          // Stop polling
          clearInterval(interval);
          pollingIntervalsRef.current.delete(matchId);

          // Cache the completed analysis
          analyzedCacheRef.current.set(matchId, analysis);
          setAnalyzedCache(prev => new Map(prev).set(matchId, analysis));

          // Update match state
          setMatches(prev => prev.map(m =>
            m.matchId === matchId
              ? {
                  ...m,
                  analysisStatus: 'completed' as AnalysisStatus,
                  analysisId: analysis.id,
                  overallScore: analysis.stats?.overallScore || 0,
                  errorsCount: analysis.errors?.length || 0,
                  progress: 100,
                  progressMessage: 'Analysis complete',
                }
              : m
          ));

          setAnalyzingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(matchId);
            return newSet;
          });
        } else if (analysis.status === 'failed') {
          // Stop polling
          clearInterval(interval);
          pollingIntervalsRef.current.delete(matchId);

          setMatches(prev => prev.map(m =>
            m.matchId === matchId
              ? { ...m, analysisStatus: 'failed' as AnalysisStatus, progress: 0, progressMessage: 'Analysis failed' }
              : m
          ));

          setAnalyzingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(matchId);
            return newSet;
          });
        } else {
          // Update progress (only forward - never backwards)
          setMatches(prev => prev.map(m =>
            m.matchId === matchId
              ? {
                  ...m,
                  progress: Math.max(m.progress || 0, serverProgress),
                  progressMessage: serverMessage || m.progressMessage,
                }
              : m
          ));
        }
      } catch (error) {
        console.error('Polling error for', matchId, error);
      }
    }, 2500);

    pollingIntervalsRef.current.set(matchId, interval);
  }, []);

  // Cleanup all polling intervals on unmount
  useEffect(() => {
    return () => {
      pollingIntervalsRef.current.forEach(interval => clearInterval(interval));
      pollingIntervalsRef.current.clear();
    };
  }, []);

  // Fetch existing analyses from backend
  const fetchExistingAnalyses = useCallback(async () => {
    try {
      const response = await fetch(`/api/analysis/games?puuid=${encodeURIComponent(puuid)}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        if (data.games && Array.isArray(data.games)) {
          // Cache analyses and track processing ones
          const processingGames: Array<{ id: string; matchId: string }> = [];

          data.games.forEach((game: any) => {
            if (game.matchId && game.status === 'completed') {
              analyzedCacheRef.current.set(game.matchId, game);
            } else if (game.matchId && game.status === 'processing' && game.id) {
              processingGames.push({ id: game.id, matchId: game.matchId });
            }
          });
          // Also update the state cache
          setAnalyzedCache(new Map(analyzedCacheRef.current));

          // Auto-start polling for any in-progress analyses (refresh resilience)
          processingGames.forEach(({ id, matchId }) => {
            startPolling(id, matchId);
          });
        }
      }
    } catch (error) {
      console.error('Error fetching existing analyses:', error);
    }
  }, [puuid, startPolling]);

  // Initial load - wait for userCreatedAt to be fetched first
  useEffect(() => {
    const initializeData = async () => {
      if (!hasLoadedRef.current && (userCreatedAt || !session?.user)) {
        hasLoadedRef.current = true;
        // First fetch existing analyses to populate cache
        await fetchExistingAnalyses();
        // Then load matches (which will use the cache)
        await loadMatches();
      }
    };
    initializeData();
  }, [loadMatches, userCreatedAt, session, fetchExistingAnalyses]);

  // Start analysis for a match
  const handleStartAnalysis = useCallback(async (matchId: string, language: AnalysisLanguage = 'en') => {
    setCreditError(null);

    const user = session?.user as { id?: string; email?: string; credits?: number };
    const userId = user?.id;

    if (!userId) {
      setCreditError('You must be logged in to analyze games.');
      return;
    }

    // Check if user has credits
    const currentCredits = user?.credits ?? 0;
    if (currentCredits <= 0) {
      setCreditError('You need credits to analyze games.');
      onInsufficientCredits?.();
      return;
    }

    setAnalyzingIds(prev => new Set(prev).add(matchId));

    // Update match status to processing
    setMatches(prev => prev.map(m =>
      m.matchId === matchId
        ? { ...m, analysisStatus: 'processing' as AnalysisStatus }
        : m
    ));

    try {
      // First, consume a credit
      const creditResponse = await fetch(`${NEXRA_API_URL}/users/${userId}/use-credit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userId}:${user?.email || ''}`,
        },
      });

      const creditData = await creditResponse.json();

      if (!creditResponse.ok) {
        if (creditResponse.status === 402) {
          setCreditError('Insufficient credits. Purchase more to continue.');
          onInsufficientCredits?.();
          // Reset match status
          setMatches(prev => prev.map(m =>
            m.matchId === matchId
              ? { ...m, analysisStatus: 'not_started' as AnalysisStatus }
              : m
          ));
          setAnalyzingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(matchId);
            return newSet;
          });
          return;
        }
        throw new Error(creditData.error || 'Failed to use credit');
      }

      // Now start the analysis (returns 202 with analysis ID for async processing)
      const response = await fetch('/api/analysis/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchId, puuid, region, language }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const analysisData = data.data;

        if (analysisData.status === 'completed' || analysisData.existing) {
          // Analysis already existed and is complete
          analyzedCacheRef.current.set(matchId, analysisData);
          setAnalyzedCache(prev => new Map(prev).set(matchId, analysisData));

          setMatches(prev => prev.map(m =>
            m.matchId === matchId
              ? {
                  ...m,
                  analysisStatus: 'completed' as AnalysisStatus,
                  analysisId: analysisData.id,
                  overallScore: analysisData.stats?.overallScore || 0,
                  errorsCount: analysisData.errors?.length || 0,
                  progress: 100,
                }
              : m
          ));

          setAnalyzingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(matchId);
            return newSet;
          });
        } else {
          // 202 - Analysis started in background, start polling
          setMatches(prev => prev.map(m =>
            m.matchId === matchId
              ? {
                  ...m,
                  analysisStatus: 'processing' as AnalysisStatus,
                  analysisId: analysisData.id,
                  progress: analysisData.progress || 10,
                  progressMessage: analysisData.progressMessage || 'Starting analysis...',
                }
              : m
          ));

          // Start polling for progress
          if (analysisData.id) {
            startPolling(analysisData.id, matchId);
          }
        }
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Failed to analyze match:', error);
      setMatches(prev => prev.map(m =>
        m.matchId === matchId
          ? { ...m, analysisStatus: 'failed' as AnalysisStatus, progress: 0 }
          : m
      ));
      setAnalyzingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(matchId);
        return newSet;
      });
    }
  }, [puuid, region, session, onInsufficientCredits, startPolling]);

  // Handle card click - open modal and fetch full analysis if cache is incomplete
  const handleCardClick = useCallback(async (match: MatchForAnalysis) => {
    setSelectedMatch(match);

    // Check if cache has complete data (with performanceSummary)
    const cachedData = analyzedCacheRef.current.get(match.matchId);
    const hasCompleteData = cachedData?.stats?.performanceSummary;

    // If completed but cache is incomplete, fetch full analysis
    if (match.analysisStatus === 'completed' && !hasCompleteData) {
      const fetchId = match.analysisId || cachedData?.id;

      if (fetchId) {
        try {
          const response = await fetch(`/api/analysis/${fetchId}`);
          const data = await response.json();

          if (response.ok && data.success && data.data) {
            analyzedCacheRef.current.set(match.matchId, data.data);
            setAnalyzedCache(prev => new Map(prev).set(match.matchId, data.data));
          }
        } catch (error) {
          console.error('Error fetching full analysis:', error);
        }
      }
    }
  }, []);

  // Close modal
  const handleCloseModal = useCallback(() => {
    setSelectedMatch(null);
  }, []);

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
      {/* Credit Error Banner */}
      {creditError && (
        <div style={styles.creditErrorCard}>
          <div style={styles.creditErrorContent}>
            <div style={styles.creditErrorIconWrapper}>
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div style={styles.creditErrorTextWrapper}>
              <h3 style={styles.creditErrorTitle}>Out of Credits</h3>
              <p style={styles.creditErrorText}>
                You need credits to analyze your games. Each AI analysis costs <strong style={{ color: '#ffd700' }}>1 credit</strong> and provides detailed insights on deaths, positioning, and improvement areas.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setCreditError(null);
              onInsufficientCredits?.();
            }}
            style={styles.getCreditsButton}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ marginRight: 6 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Get Credits
          </button>
        </div>
      )}

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
            Your <strong style={{ color: '#00d4ff' }}>Ranked Solo/Duo</strong> games played since you joined Nexra. Click <strong>"Analyze"</strong> on any match to get detailed insights about your deaths, CS, vision, and objectives. <strong style={{ color: '#ffd700' }}>1 credit per analysis.</strong>
          </p>
        </div>
      </div>

      {/* Ready games limit notice */}
      {statusCounts.ready > 0 && (
        <p style={styles.readyLimitNotice}>
          Only your 10 most recent unanalyzed games are shown. All analyzed games are saved to your account.
        </p>
      )}

      {/* Overview Section - Always show */}
      <AnalysisOverview stats={overallStats} />

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
            {filter === 'all' ? 'No games to analyze yet' :
              filter === 'ready' ? 'No games to analyze' :
                filter === 'processing' ? 'No analysis in progress' :
                  'No completed analyses'}
          </h3>
          <p style={styles.emptyText}>
            {filter === 'all'
              ? 'Play Ranked Solo/Duo games and they will appear here for analysis. Only games played since you joined Nexra are shown.'
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
                onCardClick={handleCardClick}
                isStarting={analyzingIds.has(match.matchId)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Analysis Modal */}
      {selectedMatch && (
        <AnalysisModal
          match={selectedMatch}
          analysisData={analyzedCache.get(selectedMatch.matchId) || null}
          isAnalyzing={analyzingIds.has(selectedMatch.matchId)}
          onClose={handleCloseModal}
        />
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
  creditErrorCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    padding: 20,
    borderRadius: 16,
    background: 'linear-gradient(135deg, rgba(255, 183, 77, 0.1) 0%, rgba(255, 107, 107, 0.1) 100%)',
    border: '1px solid rgba(255, 183, 77, 0.3)',
  },
  creditErrorContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
  },
  creditErrorIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: 'linear-gradient(135deg, rgba(255, 183, 77, 0.2), rgba(255, 215, 0, 0.2))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffd700',
    flexShrink: 0,
  },
  creditErrorTextWrapper: {
    flex: 1,
  },
  creditErrorTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#ffd700',
    margin: '0 0 6px 0',
  },
  creditErrorText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    margin: 0,
    lineHeight: 1.5,
  },
  getCreditsButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 24px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #ffd700, #ff9500)',
    color: '#000',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
    alignSelf: 'flex-start',
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
  gamesGridCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 20,
    paddingBottom: 60,
  },
  readyLimitNotice: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center' as const,
    margin: '-8px 0 0 0',
    padding: '0 16px',
    fontStyle: 'italic',
  },
};
