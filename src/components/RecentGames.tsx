'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import PlayerHeader from './PlayerHeader';
import NavigationTabs from './NavigationTabs';
import GameModeFilter from './GameModeFilter';
import MatchCard from './MatchCard';
import RankedStats from './RankedStats';
import AnimatedBackground from './AnimatedBackground';
import ChampionsStats from './ChampionsStats';
import AnalysisTab from './analysis/AnalysisTab';
import PlayerHeaderSkeleton from './skeletons/PlayerHeaderSkeleton';
import { MatchCardSkeletonList } from './skeletons/MatchCardSkeleton';
import StatsGridSkeleton from './skeletons/StatsGridSkeleton';
import NavigationTabsSkeleton from './skeletons/NavigationTabsSkeleton';
import NexraVisionStatus from './NexraVisionStatus';
import CreditsDisplay from './CreditsDisplay';

interface RiotAccount {
  gameName: string;
  tagLine: string;
  region: string;
}

interface Participant {
  championName: string;
  summonerName: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  totalDamageDealtToChampions?: number;
  goldEarned?: number;
  totalMinionsKilled?: number;
  visionScore?: number;
  champLevel?: number;
  rank?: number; // 1 = MVP, 10 = pire
}

interface Match {
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
  teammates?: Participant[];
  enemies?: Participant[];
  items?: number[];
  totalDamageDealtToChampions?: number;
  goldEarned?: number;
  totalMinionsKilled?: number;
  visionScore?: number;
  champLevel?: number;
  rank?: number; // 1 = MVP, 10 = pire
}

interface RecentGamesProps {
  riotAccount: RiotAccount;
}

export default function RecentGames({ riotAccount }: RecentGamesProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedMode, setSelectedMode] = useState('all');
  const [hasMoreMatches, setHasMoreMatches] = useState(true); // Pour savoir s'il y a encore des matchs
  const [championSortBy, setChampionSortBy] = useState<'games' | 'winrate' | 'kda'>('games');
  const [summonerData, setSummonerData] = useState<{
    profileIconId: number;
    summonerLevel: number;
    puuid: string;
    rank: {
      tier: string;
      rank: string;
      leaguePoints: number;
      wins: number;
      losses: number;
    } | null;
  } | null>(null);

  // Ref for infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAllData();
  }, [riotAccount]);

  // Store riot account info for Nexra Vision auto-config
  useEffect(() => {
    if (summonerData?.puuid && riotAccount) {
      // Store riot account in cookie for Vision to fetch
      fetch('/api/user/riot-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameName: riotAccount.gameName,
          tagLine: riotAccount.tagLine,
          region: riotAccount.region,
          puuid: summonerData.puuid,
        }),
      }).catch(console.error);
    }
  }, [summonerData?.puuid, riotAccount]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current || activeTab !== 'summary') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMoreMatches && !isLoadingMore && !isLoading) {
          loadMoreData();
        }
      },
      {
        root: null,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [hasMoreMatches, isLoadingMore, isLoading, activeTab]);

  const loadAllData = async (retryCount = 0) => {
    setIsLoading(true);
    setError('');

    try {
      // Récupérer d'abord les données du summoner
      const summonerResponse = await fetch(
        `/api/riot/summoner?gameName=${encodeURIComponent(riotAccount.gameName)}&tagLine=${encodeURIComponent(riotAccount.tagLine)}&region=${encodeURIComponent(riotAccount.region)}`
      );

      // Traiter les données du summoner immédiatement
      let puuid = '';
      if (summonerResponse.ok) {
        const data = await summonerResponse.json();
        puuid = data.puuid;
        setSummonerData({
          profileIconId: data.profileIconId,
          summonerLevel: data.summonerLevel,
          puuid: data.puuid,
          rank: data.rank || null,
        });
      } else {
        const errorData = await summonerResponse.json();
        throw new Error(errorData.error || 'Error retrieving profile');
      }

      // Délai pour éviter de surcharger l'API Riot (rate limit)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Ensuite récupérer les matches - Utiliser gameName/tagLine au lieu du PUUID
      // pour éviter tout problème de routing region
      const matchesResponse = await fetch(
        `/api/riot/matches?gameName=${encodeURIComponent(riotAccount.gameName)}&tagLine=${encodeURIComponent(riotAccount.tagLine)}&region=${encodeURIComponent(riotAccount.region)}&puuid=${encodeURIComponent(puuid)}`
      );

      // Traiter les matches
      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json();
        setMatches(matchesData);
        // Si on reçoit moins de 20 matchs, il n'y en a plus à charger
        if (matchesData.length < 20) {
          setHasMoreMatches(false);
        }
      } else {
        let errorData;
        try {
          errorData = await matchesResponse.json();
        } catch (e) {
          console.error('Erreur lors du parsing de la réponse d\'erreur:', e);
          throw new Error(`Erreur HTTP ${matchesResponse.status}`);
        }

        console.error('Erreur API matches:', errorData);

        // Si c'est une erreur 429 (rate limit) et qu'on n'a pas encore réessayé, on réessaie après 2 secondes
        if (matchesResponse.status === 429 && retryCount < 1) {
          setError('Too many requests, retrying in 2 seconds...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          return loadAllData(retryCount + 1);
        }

        throw new Error(errorData.error || 'Error retrieving matches');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to retrieve recent games');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentGames = async () => {
    await loadAllData();
  };

  const loadMoreData = async () => {
    if (!summonerData?.puuid || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      // Récupérer 10 matchs supplémentaires
      const matchesResponse = await fetch(
        `/api/riot/matches?gameName=${encodeURIComponent(riotAccount.gameName)}&tagLine=${encodeURIComponent(riotAccount.tagLine)}&region=${encodeURIComponent(riotAccount.region)}&puuid=${encodeURIComponent(summonerData.puuid)}&start=${matches.length}&count=10`
      );

      if (matchesResponse.ok) {
        const newMatches = await matchesResponse.json();
        if (newMatches.length === 0 || newMatches.length < 10) {
          setHasMoreMatches(false);
        }
        setMatches(prev => [...prev, ...newMatches]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement de matchs supplémentaires:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const filteredMatches = matches.filter((match) => {
    if (selectedMode === 'all') return true;
    return match.queueId.toString() === selectedMode;
  });

  const totalGames = filteredMatches.length;
  const wins = filteredMatches.filter((m) => m.win).length;
  const losses = totalGames - wins;
  const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(0) : '0';

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <AnimatedBackground />

        <div className="relative z-10 flex justify-center" style={{ paddingTop: '3rem' }}>
          <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Player Header Skeleton */}
            <div className="flex justify-center">
              <div className="w-full max-w-6xl">
                <PlayerHeaderSkeleton />
              </div>
            </div>

            {/* Main content with sidebar skeleton */}
            <div className="flex justify-center">
              <div className="w-full max-w-6xl">
                <div style={{ display: 'flex', gap: '2rem' }}>
                  {/* Sidebar Navigation Skeleton - Desktop only */}
                  <aside className="hidden lg:block" style={{ width: '240px', flexShrink: 0 }}>
                    <NavigationTabsSkeleton />
                    {/* Vision Status Skeleton */}
                    <div className="glass-card" style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="skeleton-pulse" style={{ width: '40px', height: '40px', borderRadius: '0.5rem' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                          <div className="skeleton-pulse" style={{ width: '100px', height: '0.875rem' }} />
                          <div className="skeleton-pulse" style={{ width: '70px', height: '0.75rem' }} />
                        </div>
                      </div>
                    </div>
                  </aside>

                  {/* Stats Grid Skeleton */}
                  <div className="flex-1">
                    <StatsGridSkeleton />
                  </div>
                </div>
              </div>
            </div>

            {/* Match History Skeleton */}
            <div className="flex justify-center">
              <div className="w-full max-w-6xl">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <div className="skeleton-pulse" style={{ width: '180px', height: '2rem', borderRadius: '0.5rem' }} />
                  <div className="skeleton-pulse" style={{ width: '200px', height: '2.5rem', borderRadius: '0.5rem' }} />
                </div>
                <MatchCardSkeletonList count={5} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <AnimatedBackground />

        <div className="relative z-10 flex justify-center" style={{ paddingTop: '3rem' }}>
          <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="flex justify-center">
              <div className="w-full max-w-6xl">
                <PlayerHeader
                  gameName={riotAccount.gameName}
                  tagLine={riotAccount.tagLine}
                  region={riotAccount.region}
                  profileIconId={summonerData?.profileIconId}
                  summonerLevel={summonerData?.summonerLevel}
                  puuid={summonerData?.puuid}
                  rank={summonerData?.rank}
                />
              </div>
            </div>
            <div className="flex justify-center">
              <div className="glass-card border-red-500/20 animate-fadeInScale w-full max-w-3xl" style={{ padding: '2.5rem' }}>
                <div className="text-center" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="w-16 h-16 mx-auto rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p className="text-red-400 font-semibold text-lg">An error occurred</p>
                    <p className="text-[var(--text-secondary)] text-sm">{error}</p>
                  </div>
                  <button
                    onClick={fetchRecentGames}
                    className="accent-button"
                    style={{ maxWidth: '12rem', margin: '0 auto' }}
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Fond animé avec étoiles */}
      <AnimatedBackground />

      {/* Contenu principal */}
      <div className="relative z-10 flex justify-center" style={{ paddingTop: '3rem' }}>
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Player Header */}
          <div className="flex justify-center animate-fadeIn">
            <div className="w-full max-w-6xl">
              <PlayerHeader
                gameName={riotAccount.gameName}
                tagLine={riotAccount.tagLine}
                region={riotAccount.region}
                profileIconId={summonerData?.profileIconId}
                summonerLevel={summonerData?.summonerLevel}
                puuid={summonerData?.puuid}
                rank={summonerData?.rank}
              />
            </div>
          </div>

          {/* Main content avec sidebar */}
          <div className="flex justify-center">
            <div className="w-full max-w-6xl" key={activeTab}>
          {activeTab === 'summary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Stats Section avec Menu Vertical */}
              <div style={{ display: 'flex', gap: '2rem' }} className="animate-fadeIn">
                {/* Sidebar Navigation - Desktop only */}
                <aside className="hidden lg:block" style={{ width: '240px', flexShrink: 0 }}>
                  <div style={{ position: 'sticky', top: '2rem' }}>
                    <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
                    <NexraVisionStatus puuid={summonerData?.puuid} />
                    <CreditsDisplay />
                  </div>
                </aside>

                {/* Stats Overview - Grid Layout */}
                <div className="flex-1">
                  {/* Mobile Navigation - Horizontal */}
                  <div className="lg:hidden w-full" style={{ marginBottom: '2rem' }}>
                    <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
                  </div>

                  <div className="glass-card" style={{ padding: '3rem' }}>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: '1.5rem', marginBottom: '2.5rem' }}>
                    {/* Total Games */}
                    <div className="rounded-xl bg-glass-ultra border border-glass-border text-center hover:bg-glass-subtle transition-colors" style={{ padding: '1.5rem' }}>
                      <div className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-widest" style={{ marginBottom: '1rem' }}>
                        Total Games
                      </div>
                      <div className="text-5xl font-bold text-white font-['Rajdhani']">{totalGames}</div>
                    </div>

                    {/* Victories */}
                    <div className="rounded-xl bg-glass-ultra border border-glass-border text-center hover:bg-glass-subtle transition-colors" style={{ padding: '1.5rem' }}>
                      <div className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-widest" style={{ marginBottom: '1rem' }}>
                        Victories
                      </div>
                      <div className="text-5xl font-bold text-gradient-victory font-['Rajdhani']">{wins}</div>
                    </div>

                    {/* Defeats */}
                    <div className="rounded-xl bg-glass-ultra border border-glass-border text-center hover:bg-glass-subtle transition-colors" style={{ padding: '1.5rem' }}>
                      <div className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-widest" style={{ marginBottom: '1rem' }}>
                        Defeats
                      </div>
                      <div className="text-5xl font-bold text-gradient-defeat font-['Rajdhani']">{losses}</div>
                    </div>

                    {/* Win Rate */}
                    <div className="rounded-xl bg-glass-ultra border border-glass-border text-center hover:bg-glass-subtle transition-colors" style={{ padding: '1.5rem' }}>
                      <div className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-widest" style={{ marginBottom: '1rem' }}>
                        Win Rate
                      </div>
                      <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-['Rajdhani']">
                        {winRate}%
                      </div>
                    </div>
                  </div>

                  {/* Win Rate Progress Bar */}
                  <div className="rounded-xl bg-glass-ultra border border-glass-border" style={{ padding: '1.5rem' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: '1rem' }}>
                      <span className="text-sm font-semibold text-[var(--text-secondary)]">Progression Win Rate</span>
                      <span className="text-xl font-bold text-cyan-400 font-['Rajdhani']">{wins}/{totalGames}</span>
                    </div>
                    <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${winRate}%`,
                          boxShadow: '0 0 16px rgba(0, 212, 255, 0.4)'
                        }}
                      ></div>
                    </div>
                  </div>
                  </div>
                </div>
              </div>

              {/* Match History Header & Filter - Full width */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between flex-wrap" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 className="text-3xl font-bold text-white font-['Rajdhani'] tracking-tight">Match History</h3>
                <GameModeFilter selectedMode={selectedMode} onModeChange={setSelectedMode} />
              </div>

              {/* Match List - Pleine largeur */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {filteredMatches.map((match, index) => (
                  <div
                    key={match.matchId}
                    className="animate-fadeIn"
                    style={{ animationDelay: `${50 + index * 30}ms` }}
                  >
                    <MatchCard match={match} />
                  </div>
                ))}
              </div>

              {/* Infinite Scroll Sentinel & Loading Indicator */}
              {filteredMatches.length > 0 && (
                <div style={{ marginTop: '1.5rem', marginBottom: '4rem' }}>
                  {hasMoreMatches ? (
                    <>
                      {/* Loading indicator */}
                      {isLoadingMore && (
                        <div className="flex justify-center" style={{ padding: '1.5rem' }}>
                          <div className="flex items-center" style={{ gap: '0.75rem' }}>
                            <div className="w-5 h-5 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                            <span className="text-[var(--text-tertiary)] text-sm">Loading more matches...</span>
                          </div>
                        </div>
                      )}
                      {/* Sentinel element for IntersectionObserver */}
                      <div ref={sentinelRef} style={{ height: '1px', width: '100%' }} />
                    </>
                  ) : (
                    /* End of matches message */
                    <div className="flex justify-center" style={{ padding: '1.5rem' }}>
                      <div className="flex items-center" style={{ gap: '0.5rem' }}>
                        <svg className="w-4 h-4 text-[var(--text-quaternary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[var(--text-quaternary)] text-sm">All matches loaded</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Empty State */}
              {filteredMatches.length === 0 && (
                <div className="glass-card animate-fadeInScale" style={{ padding: '3rem' }}>
                  <div className="text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-cyan-500/10 flex items-center justify-center">
                      <svg className="w-7 h-7 text-cyan-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-[var(--text-secondary)] font-medium text-sm">
                      No matches found for this filter
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'champions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fadeIn">
              {/* Section avec Menu Vertical */}
              <div style={{ display: 'flex', gap: '2rem' }}>
                {/* Sidebar Navigation - Desktop only */}
                <aside className="hidden lg:block" style={{ width: '240px', flexShrink: 0 }}>
                  <div style={{ position: 'sticky', top: '2rem' }}>
                    <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
                    <NexraVisionStatus puuid={summonerData?.puuid} />
                    <CreditsDisplay />
                  </div>
                </aside>

                {/* Header with sort filters */}
                <div className="flex-1">
                  {/* Mobile Navigation - Horizontal */}
                  <div className="lg:hidden w-full" style={{ marginBottom: '2rem' }}>
                    <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
                  </div>

                  <div className="glass-card" style={{ padding: '2rem' }}>
                    {/* Header section */}
                    <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div>
                        <h2 className="text-2xl font-bold text-white font-['Rajdhani'] tracking-tight">
                          Champion Statistics
                        </h2>
                        <p className="text-xs text-[var(--text-tertiary)] mt-1">
                          Last 30 matches • 11 champions
                        </p>
                      </div>

                      {/* Sort filters */}
                      <div className="flex items-center" style={{ gap: '0.75rem' }}>
                        <span className="text-sm text-[var(--text-tertiary)] font-medium">Sort by:</span>
                        <div className="flex items-center rounded-lg border border-white/10 bg-white/5" style={{ padding: '0.25rem', gap: '0.25rem' }}>
                          <button
                            onClick={() => setChampionSortBy('games')}
                            className={`text-xs font-semibold rounded-md transition-all duration-200 ${
                              championSortBy === 'games'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'text-[var(--text-tertiary)] hover:text-white'
                            }`}
                            style={{ padding: '0.5rem 0.875rem' }}
                          >
                            Games
                          </button>
                          <button
                            onClick={() => setChampionSortBy('winrate')}
                            className={`text-xs font-semibold rounded-md transition-all duration-200 ${
                              championSortBy === 'winrate'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'text-[var(--text-tertiary)] hover:text-white'
                            }`}
                            style={{ padding: '0.5rem 0.875rem' }}
                          >
                            Winrate
                          </button>
                          <button
                            onClick={() => setChampionSortBy('kda')}
                            className={`text-xs font-semibold rounded-md transition-all duration-200 ${
                              championSortBy === 'kda'
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'text-[var(--text-tertiary)] hover:text-white'
                            }`}
                            style={{ padding: '0.5rem 0.875rem' }}
                          >
                            KDA
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats - Horizontal layout */}
                    <div className="flex flex-wrap items-center" style={{ gap: '2.5rem' }}>
                      <div>
                        <div className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Most Played</div>
                        <div className="flex items-center" style={{ gap: '0.625rem' }}>
                          <span className="text-lg font-bold text-white font-['Rajdhani']">Naafiri</span>
                          <span className="text-xs text-[var(--text-tertiary)]">9 games</span>
                        </div>
                      </div>

                      <div style={{ width: '1px', height: '2.5rem', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}></div>

                      <div>
                        <div className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Best Winrate</div>
                        <div className="flex items-center" style={{ gap: '0.625rem' }}>
                          <span className="text-lg font-bold text-white font-['Rajdhani']">Yorick</span>
                          <span className="text-xs font-semibold text-green-400">100%</span>
                        </div>
                      </div>

                      <div style={{ width: '1px', height: '2.5rem', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}></div>

                      <div>
                        <div className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Highest KDA</div>
                        <div className="flex items-center" style={{ gap: '0.625rem' }}>
                          <span className="text-lg font-bold text-white font-['Rajdhani']">MissFortune</span>
                          <span className="text-xs font-semibold text-cyan-400">3.50</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Champion List - Pleine largeur comme les match cards */}
              {summonerData?.puuid && (
                <ChampionsStats
                  puuid={summonerData.puuid}
                  region={riotAccount.region}
                  sortBy={championSortBy}
                />
              )}
            </div>
          )}

          {activeTab === 'analysis' && summonerData?.puuid && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} className="animate-fadeIn">
              {/* Section avec Menu Vertical */}
              <div style={{ display: 'flex', gap: '2rem' }}>
                {/* Sidebar Navigation - Desktop only */}
                <aside className="hidden lg:block" style={{ width: '240px', flexShrink: 0 }}>
                  <div style={{ position: 'sticky', top: '2rem' }}>
                    <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
                    <NexraVisionStatus puuid={summonerData?.puuid} />
                    <CreditsDisplay />
                  </div>
                </aside>

                {/* Analysis Content */}
                <div className="flex-1">
                  {/* Mobile Navigation - Horizontal */}
                  <div className="lg:hidden w-full" style={{ marginBottom: '2rem' }}>
                    <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
                  </div>

                  <AnalysisTab
                    puuid={summonerData.puuid}
                    region={riotAccount.region}
                    gameName={riotAccount.gameName}
                    tagLine={riotAccount.tagLine}
                    profileIconId={summonerData.profileIconId}
                  />
                </div>
              </div>
            </div>
          )}

                      </div>
          </div>
        </div>
      </div>
    </div>
  );
}
