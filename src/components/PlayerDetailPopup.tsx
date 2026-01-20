'use client';

import { useState, useEffect, useCallback } from 'react';
import { getChampionImageUrl, getLatestDDragonVersion } from '@/utils/ddragon';

interface Participant {
  puuid?: string;
  championName: string;
  summonerName: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  rank?: number;
  tier?: string;
  division?: string;
}

interface PlayerMatch {
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
  rank?: number;
  teamPosition?: string;
  individualPosition?: string;
}

interface PlayerData {
  gameName: string;
  tagLine: string;
  puuid: string;
  profileIconId: number;
  summonerLevel: number;
  rank: {
    tier: string;
    rank: string;
    leaguePoints: number;
    wins: number;
    losses: number;
  } | null;
}

interface PlayerStats {
  topChampions: Array<{
    championName: string;
    games: number;
    wins: number;
    losses: number;
    winrate: number;
  }>;
  recentMatchResults: boolean[];
  mainRole: string;
  totalGames: number;
}

interface PlayerDetailPopupProps {
  isOpen: boolean;
  onClose: () => void;
  players: Participant[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  region: string;
  ddragonVersion: string;
  matchChampion: string;
}

// Map platform region codes to routing values
const getRoutingValue = (platformRegion: string): string => {
  const regionMap: { [key: string]: string } = {
    'euw1': 'europe',
    'eun1': 'europe',
    'tr1': 'europe',
    'ru': 'europe',
    'na1': 'americas',
    'br1': 'americas',
    'la1': 'americas',
    'la2': 'americas',
    'kr': 'asia',
    'jp1': 'asia',
    'oc1': 'sea',
    'ph2': 'sea',
    'sg2': 'sea',
    'th2': 'sea',
    'tw2': 'sea',
    'vn2': 'sea',
  };
  return regionMap[platformRegion] || 'europe';
};

// Queue ID to game mode name
const getGameModeName = (queueId: number): string => {
  const queueMap: { [key: number]: string } = {
    420: 'Ranked Solo',
    440: 'Ranked Flex',
    400: 'Normal Draft',
    430: 'Normal Blind',
    450: 'ARAM',
    900: 'URF',
    1020: 'One for All',
    1300: 'Nexus Blitz',
    1400: 'Ultimate Spellbook',
    720: 'ARAM Clash',
    700: 'Clash',
    830: 'Co-op vs AI',
    840: 'Co-op vs AI',
    850: 'Co-op vs AI',
  };
  return queueMap[queueId] || 'Normal';
};

// Get role icon
const getRoleIcon = (role: string): string => {
  const roleIcons: { [key: string]: string } = {
    'TOP': 'M3 3h18v18H3V3zm2 2v14h14V5H5z',
    'JUNGLE': 'M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.5L18 8v8l-6 3.5L6 16V8l6-3.5z',
    'MIDDLE': 'M12 2L2 12l10 10 10-10L12 2zm0 3.5L18.5 12 12 18.5 5.5 12 12 5.5z',
    'BOTTOM': 'M3 3h18v18H3V3zm2 16h14V5H5v14z',
    'UTILITY': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  };
  return roleIcons[role] || roleIcons['MIDDLE'];
};

// Get rank badge info
const getRankBadge = (rank: number) => {
  if (rank === 1) {
    return { label: 'MVP', bgColor: 'bg-yellow-500/20', textColor: 'text-yellow-400', borderColor: 'border-yellow-500/40' };
  } else if (rank === 2) {
    return { label: '#2', bgColor: 'bg-gray-400/20', textColor: 'text-gray-300', borderColor: 'border-gray-400/40' };
  } else if (rank === 3) {
    return { label: '#3', bgColor: 'bg-amber-600/20', textColor: 'text-amber-500', borderColor: 'border-amber-600/40' };
  } else {
    return { label: `#${rank}`, bgColor: 'bg-gray-600/20', textColor: 'text-gray-400', borderColor: 'border-gray-600/40' };
  }
};

// Format duration
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  return `${mins}m`;
};

// Cache key for player data
const getCacheKey = (gameName: string, tagLine: string, region: string) => {
  return `nexra_player_popup_${gameName}_${tagLine}_${region}`;
};

export default function PlayerDetailPopup({
  isOpen,
  onClose,
  players,
  currentIndex,
  onNavigate,
  region,
  ddragonVersion,
  matchChampion,
}: PlayerDetailPopupProps) {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [recentMatches, setRecentMatches] = useState<PlayerMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPlayer = players[currentIndex];

  // Parse summoner name to extract gameName and tagLine
  const parseSummonerName = useCallback((summonerName: string) => {
    // Handle formats like "Name#TAG" or just "Name"
    if (summonerName.includes('#')) {
      const [gameName, tagLine] = summonerName.split('#');
      return { gameName, tagLine };
    }
    // If no tag, assume default tagLine based on region
    return { gameName: summonerName, tagLine: region.toUpperCase().replace(/[0-9]/g, '') || 'EUW' };
  }, [region]);

  // Fetch player data when popup opens or player changes
  const fetchPlayerData = useCallback(async () => {
    if (!currentPlayer) return;

    const { gameName, tagLine } = parseSummonerName(currentPlayer.summonerName);
    const cacheKey = getCacheKey(gameName, tagLine, region);

    // Check session storage cache
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        const isExpired = Date.now() - cachedData.timestamp > 5 * 60 * 1000; // 5 minutes
        if (!isExpired) {
          setPlayerData(cachedData.playerData);
          setPlayerStats(cachedData.playerStats);
          setRecentMatches(cachedData.recentMatches);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        sessionStorage.removeItem(cacheKey);
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Get summoner data (includes PUUID and rank)
      const summonerResponse = await fetch(
        `/api/riot/summoner?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}&region=${encodeURIComponent(region)}`
      );

      if (!summonerResponse.ok) {
        if (summonerResponse.status === 404) {
          throw new Error('Player not found');
        }
        if (summonerResponse.status === 429) {
          throw new Error('Rate limited. Please wait a moment.');
        }
        throw new Error('Failed to fetch player data');
      }

      const summonerData = await summonerResponse.json();
      const puuid = summonerData.puuid;

      setPlayerData({
        gameName,
        tagLine,
        puuid,
        profileIconId: summonerData.profileIconId,
        summonerLevel: summonerData.summonerLevel,
        rank: summonerData.rank,
      });

      // 2. Fetch matches and player stats in parallel
      const routingRegion = getRoutingValue(region);

      const [matchesResponse, statsResponse] = await Promise.all([
        fetch(
          `/api/riot/matches?puuid=${encodeURIComponent(puuid)}&region=${encodeURIComponent(region)}&count=10`
        ),
        fetch(
          `/api/riot/player-stats?puuid=${encodeURIComponent(puuid)}&region=${routingRegion}`
        ),
      ]);

      // Handle matches
      let matches: PlayerMatch[] = [];
      if (matchesResponse.ok) {
        matches = await matchesResponse.json();
        setRecentMatches(matches);
      }

      // Handle player stats
      let stats: PlayerStats | null = null;
      if (statsResponse.ok) {
        stats = await statsResponse.json();
        setPlayerStats(stats);
      }

      // Cache the data
      const cacheData = {
        playerData: {
          gameName,
          tagLine,
          puuid,
          profileIconId: summonerData.profileIconId,
          summonerLevel: summonerData.summonerLevel,
          rank: summonerData.rank,
        },
        playerStats: stats,
        recentMatches: matches,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [currentPlayer, region, parseSummonerName]);

  // Fetch data when popup opens or player changes
  useEffect(() => {
    if (isOpen && currentPlayer) {
      // Reset state for new player
      setPlayerData(null);
      setPlayerStats(null);
      setRecentMatches([]);
      fetchPlayerData();
    }
  }, [isOpen, currentIndex, fetchPlayerData, currentPlayer]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          onNavigate(currentIndex - 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < players.length - 1) {
          onNavigate(currentIndex + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, players.length, onNavigate, onClose]);

  if (!isOpen) return null;

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < players.length - 1;

  // Calculate stats from recent matches if playerStats is not available
  const calculatedWinrate = recentMatches.length > 0
    ? Math.round((recentMatches.filter(m => m.win).length / recentMatches.length) * 100)
    : 0;

  const calculatedKDA = recentMatches.length > 0
    ? (() => {
        const totals = recentMatches.reduce((acc, m) => ({
          kills: acc.kills + m.kills,
          deaths: acc.deaths + m.deaths,
          assists: acc.assists + m.assists,
        }), { kills: 0, deaths: 0, assists: 0 });
        return totals.deaths === 0
          ? (totals.kills + totals.assists).toFixed(1)
          : ((totals.kills + totals.assists) / totals.deaths).toFixed(2);
      })()
    : '0';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '32rem',
          maxHeight: '85vh',
          overflow: 'hidden',
          borderRadius: '1rem',
          background: 'linear-gradient(to bottom right, rgba(15, 15, 25, 0.98), rgba(10, 10, 20, 0.98))',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 212, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
        }}
        className="animate-fadeInScale"
      >
        {/* Header with Navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(0, 0, 0, 0.3)',
        }}>
          {/* Prev Button */}
          <button
            onClick={() => canGoPrev && onNavigate(currentIndex - 1)}
            disabled={!canGoPrev}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: canGoPrev ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              cursor: canGoPrev ? 'pointer' : 'not-allowed',
              opacity: canGoPrev ? 1 : 0.4,
              transition: 'all 0.2s',
            }}
          >
            <svg style={{ width: '1.25rem', height: '1.25rem', color: canGoPrev ? 'rgb(0, 212, 255)' : 'rgba(255, 255, 255, 0.4)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Player Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, justifyContent: 'center' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '0.5rem',
              overflow: 'hidden',
              border: '2px solid rgba(0, 212, 255, 0.4)',
            }}>
              <img
                src={getChampionImageUrl(matchChampion || currentPlayer?.championName || 'Aatrox', ddragonVersion)}
                alt={currentPlayer?.championName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'white', fontWeight: 600, fontSize: '1rem', fontFamily: 'Rajdhani, sans-serif' }}>
                {currentPlayer?.summonerName || 'Unknown'}
              </div>
              {playerData?.rank && (
                <div style={{ color: 'rgba(0, 212, 255, 0.8)', fontSize: '0.75rem', fontWeight: 500 }}>
                  {playerData.rank.tier} {playerData.rank.rank} - {playerData.rank.leaguePoints} LP
                </div>
              )}
              {!playerData?.rank && !isLoading && (
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
                  Unranked
                </div>
              )}
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={() => canGoNext && onNavigate(currentIndex + 1)}
            disabled={!canGoNext}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: canGoNext ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              cursor: canGoNext ? 'pointer' : 'not-allowed',
              opacity: canGoNext ? 1 : 0.4,
              transition: 'all 0.2s',
            }}
          >
            <svg style={{ width: '1.25rem', height: '1.25rem', color: canGoNext ? 'rgb(0, 212, 255)' : 'rgba(255, 255, 255, 0.4)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginLeft: '0.5rem',
            }}
          >
            <svg style={{ width: '1.25rem', height: '1.25rem', color: 'rgba(255, 255, 255, 0.6)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {/* Loading State */}
          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Stats skeleton */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ padding: '1rem', borderRadius: '0.75rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div className="skeleton-pulse" style={{ width: '60%', height: '0.75rem', marginBottom: '0.5rem', borderRadius: '0.25rem' }} />
                    <div className="skeleton-pulse" style={{ width: '40%', height: '1.5rem', borderRadius: '0.25rem' }} />
                  </div>
                ))}
              </div>
              {/* Matches skeleton */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div className="skeleton-pulse" style={{ width: '100%', height: '2rem', borderRadius: '0.25rem' }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}>
              <svg style={{ width: '3rem', height: '3rem', color: 'rgb(248, 113, 113)', margin: '0 auto 1rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p style={{ color: 'rgb(248, 113, 113)', fontWeight: 500, marginBottom: '0.5rem' }}>{error}</p>
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>
                This player may have a private profile or be on a different region.
              </p>
            </div>
          )}

          {/* Player Data */}
          {!isLoading && !error && (
            <>
              {/* Stats Overview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(0, 212, 255, 0.05)',
                  border: '1px solid rgba(0, 212, 255, 0.1)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Winrate
                  </div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    fontFamily: 'Rajdhani, sans-serif',
                    color: calculatedWinrate >= 50 ? 'rgb(74, 222, 128)' : 'rgb(248, 113, 113)',
                  }}>
                    {calculatedWinrate}%
                  </div>
                </div>

                <div style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(0, 212, 255, 0.05)',
                  border: '1px solid rgba(0, 212, 255, 0.1)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    KDA
                  </div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    fontFamily: 'Rajdhani, sans-serif',
                    color: parseFloat(calculatedKDA) >= 3 ? 'rgb(74, 222, 128)' : parseFloat(calculatedKDA) >= 2 ? 'rgb(250, 204, 21)' : 'rgb(248, 113, 113)',
                  }}>
                    {calculatedKDA}
                  </div>
                </div>

                <div style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(0, 212, 255, 0.05)',
                  border: '1px solid rgba(0, 212, 255, 0.1)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                    Games
                  </div>
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    fontFamily: 'Rajdhani, sans-serif',
                    color: 'rgb(0, 212, 255)',
                  }}>
                    {playerStats?.totalGames || recentMatches.length}
                  </div>
                </div>
              </div>

              {/* Recent Games */}
              <div>
                <h3 style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'white',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}>
                  <svg style={{ width: '1rem', height: '1rem', color: 'rgba(0, 212, 255, 0.8)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Recent Games
                </h3>

                {recentMatches.length === 0 && (
                  <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '0.75rem',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}>
                    <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>
                      No recent games found
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {recentMatches.map((match, index) => {
                    const rankBadge = getRankBadge(match.rank || 10);
                    const kda = match.deaths === 0
                      ? 'Perfect'
                      : ((match.kills + match.assists) / match.deaths).toFixed(1);
                    const role = match.teamPosition || match.individualPosition || 'MID';

                    return (
                      <div
                        key={match.matchId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.625rem 0.75rem',
                          borderRadius: '0.5rem',
                          background: match.win
                            ? 'linear-gradient(to right, rgba(34, 197, 94, 0.1), transparent)'
                            : 'linear-gradient(to right, rgba(239, 68, 68, 0.1), transparent)',
                          border: match.win
                            ? '1px solid rgba(34, 197, 94, 0.2)'
                            : '1px solid rgba(239, 68, 68, 0.2)',
                        }}
                      >
                        {/* Champion Icon */}
                        <div style={{
                          width: '2rem',
                          height: '2rem',
                          borderRadius: '0.375rem',
                          overflow: 'hidden',
                          flexShrink: 0,
                          border: match.win ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                        }}>
                          <img
                            src={getChampionImageUrl(match.champion, ddragonVersion)}
                            alt={match.champion}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>

                        {/* Champion Name & Role */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            color: 'white',
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {match.champion}
                          </div>
                          <div style={{
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontSize: '0.6875rem',
                            textTransform: 'uppercase',
                          }}>
                            {role}
                          </div>
                        </div>

                        {/* Rank Badge */}
                        <div style={{
                          padding: '0.125rem 0.375rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                        }} className={`${rankBadge.bgColor} ${rankBadge.textColor} border ${rankBadge.borderColor}`}>
                          {rankBadge.label}
                        </div>

                        {/* KDA */}
                        <div style={{
                          textAlign: 'right',
                          minWidth: '4rem',
                        }}>
                          <div style={{
                            color: 'white',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            fontFamily: 'Rajdhani, sans-serif',
                          }}>
                            {match.kills}/{match.deaths}/{match.assists}
                          </div>
                          <div style={{
                            fontSize: '0.6875rem',
                            color: kda === 'Perfect' ? 'rgb(250, 204, 21)' : parseFloat(kda) >= 3 ? 'rgb(74, 222, 128)' : 'rgba(255, 255, 255, 0.5)',
                          }}>
                            {kda} KDA
                          </div>
                        </div>

                        {/* Win/Loss */}
                        <div style={{
                          width: '1.5rem',
                          height: '1.5rem',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          background: match.win ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: match.win ? 'rgb(74, 222, 128)' : 'rgb(248, 113, 113)',
                          flexShrink: 0,
                        }}>
                          {match.win ? 'W' : 'L'}
                        </div>

                        {/* Game Mode & Duration */}
                        <div style={{
                          textAlign: 'right',
                          minWidth: '4.5rem',
                        }}>
                          <div style={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: '0.6875rem',
                          }}>
                            {getGameModeName(match.queueId)}
                          </div>
                          <div style={{
                            color: 'rgba(255, 255, 255, 0.4)',
                            fontSize: '0.625rem',
                          }}>
                            {formatDuration(match.gameDuration)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer with Player Index */}
        <div style={{
          padding: '0.75rem 1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.25rem',
        }}>
          {players.map((_, index) => (
            <button
              key={index}
              onClick={() => onNavigate(index)}
              style={{
                width: index === currentIndex ? '1.5rem' : '0.5rem',
                height: '0.5rem',
                borderRadius: '0.25rem',
                border: 'none',
                background: index === currentIndex ? 'rgb(0, 212, 255)' : 'rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
