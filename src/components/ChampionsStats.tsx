'use client';

import { useState, useEffect } from 'react';
import { getLatestDDragonVersion, getChampionImageUrl } from '@/utils/ddragon';
import { ChampionCardSkeletonList } from './skeletons/ChampionCardSkeleton';

interface Matchup {
  championName: string;
  games: number;
  wins: number;
  winrate: number;
}

interface ChampionDetail {
  championName: string;
  games: number;
  wins: number;
  losses: number;
  winrate: number;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  averageKills: number;
  averageDeaths: number;
  averageAssists: number;
  averageCs: number;
  averageVisionScore: number;
  averageGold: number;
  averageDamage: number;
  damagePerMinute: number;
  totalPlayTime: number;
  bestMatchups: Matchup[];
  worstMatchups: Matchup[];
}

interface ChampionsStatsProps {
  puuid: string;
  region: string;
  sortBy?: 'games' | 'winrate' | 'kda';
  onSortChange?: (sort: 'games' | 'winrate' | 'kda') => void;
}

export default function ChampionsStats({ puuid, region, sortBy = 'games', onSortChange }: ChampionsStatsProps) {
  const [champions, setChampions] = useState<ChampionDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [expandedChampions, setExpandedChampions] = useState<Set<string>>(new Set());
  const [ddragonVersion, setDdragonVersion] = useState('15.1.1');

  useEffect(() => {
    // Récupérer la dernière version de Data Dragon
    getLatestDDragonVersion().then(version => {
      setDdragonVersion(version);
    });

    // Ajouter un petit délai avant de charger pour laisser les autres endpoints se terminer
    const timer = setTimeout(() => {
      if (!hasAttemptedLoad) {
        fetchChampionData();
        setHasAttemptedLoad(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [puuid, region, hasAttemptedLoad]);

  const fetchChampionData = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Convertir la région platform en région routing
      const regionMap: { [key: string]: string } = {
        'euw1': 'europe',
        'eun1': 'europe',
        'na1': 'americas',
        'br1': 'americas',
        'la1': 'americas',
        'la2': 'americas',
        'oc1': 'sea',
        'ru': 'europe',
        'tr1': 'europe',
        'jp1': 'asia',
        'kr': 'asia',
        'ph2': 'sea',
        'sg2': 'sea',
        'th2': 'sea',
        'tw2': 'sea',
        'vn2': 'sea',
      };
      const routingRegion = regionMap[region] || 'europe';

      const response = await fetch(
        `/api/riot/champion-details?puuid=${encodeURIComponent(puuid)}&region=${routingRegion}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Champions data loaded:', data.champions);
        setChampions(data.champions);
      } else if (response.status === 429) {
        throw new Error('Too many requests to Riot API. Please wait 1-2 minutes and try again.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error fetching data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };


  const sortedChampions = [...champions].sort((a, b) => {
    switch (sortBy) {
      case 'winrate':
        return b.winrate - a.winrate;
      case 'kda':
        return b.kda - a.kda;
      case 'games':
      default:
        return b.games - a.games;
    }
  });

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
  };

  const toggleChampion = (championName: string) => {
    setExpandedChampions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(championName)) {
        newSet.delete(championName);
      } else {
        newSet.add(championName);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Loading message */}
        <div className="text-center" style={{ marginBottom: '0.5rem' }}>
          <p className="text-[var(--text-tertiary)] text-sm">Analyzing your last 30 matches...</p>
        </div>
        {/* Skeleton cards */}
        <ChampionCardSkeletonList count={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card border-red-500/20" style={{ padding: '2.5rem' }}>
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
            onClick={fetchChampionData}
            className="accent-button mx-auto"
            style={{ maxWidth: '12rem' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {sortedChampions.map((champion, index) => (
          <div
            key={champion.championName}
            className="glass-card hover:border-cyan-500/30 transition-all duration-300 animate-fadeIn"
            style={{
              padding: '2rem',
              animationDelay: `${index * 30}ms`,
            }}
          >
            {/* En-tête avec image et infos principales */}
            <div className="flex flex-col lg:flex-row" style={{ gap: '2rem' }}>
              {/* Section gauche: Champion info */}
              <div className="flex items-start" style={{ gap: '1.5rem', minWidth: '300px' }}>
                <div className="relative flex-shrink-0">
                  <img
                    src={getChampionImageUrl(champion.championName, ddragonVersion)}
                    alt={champion.championName}
                    className="rounded-xl"
                    style={{ width: '96px', height: '96px' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  {/* Badge winrate */}
                  <div
                    className="absolute -bottom-2 -right-2 rounded-lg text-sm font-bold shadow-lg"
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: champion.winrate >= 60 ? 'rgba(34, 197, 94, 0.9)' : champion.winrate >= 50 ? 'rgba(234, 179, 8, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                      color: 'white',
                    }}
                  >
                    {champion.winrate}%
                  </div>
                  {/* Badge de classement */}
                  <div className="absolute -top-2 -left-2 bg-gradient-to-br from-cyan-500 to-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center" style={{ width: '24px', height: '24px', boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>
                    #{index + 1}
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white font-['Rajdhani']" style={{ marginBottom: '0.75rem' }}>
                    {champion.championName}
                  </h3>
                  <div className="flex items-center flex-wrap" style={{ gap: '1rem', marginBottom: '1rem' }}>
                    <div className="flex items-center" style={{ gap: '0.5rem' }}>
                      <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                      <span className="text-sm text-[var(--text-tertiary)]">
                        {champion.games} games
                      </span>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: champion.winrate >= 50 ? '#22c55e' : '#ef4444' }}>
                      {champion.wins}W - {champion.losses}L
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      {formatTime(champion.totalPlayTime)} played
                    </span>
                  </div>

                  {/* KDA Badge */}
                  <div className="inline-flex items-center rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20" style={{ padding: '0.625rem 0.875rem', gap: '0.5rem' }}>
                    <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">KDA</span>
                    <span className="text-lg font-bold text-cyan-400 font-['Rajdhani']">
                      {champion.kda}
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      ({champion.averageKills} / {champion.averageDeaths} / {champion.averageAssists})
                    </span>
                  </div>
                </div>
              </div>

              {/* Section droite: Stats grid */}
              <div className="flex-1">
                <div className="grid grid-cols-5" style={{ gap: '0.75rem' }}>
                  {/* CS/min */}
                  <div className="text-center rounded-lg bg-white/5 border border-white/10" style={{ padding: '1rem' }}>
                    <div className="text-xl font-bold text-white font-['Rajdhani']">
                      {champion.averageCs}
                    </div>
                    <div className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mt-1.5">
                      CS / Game
                    </div>
                  </div>

                  {/* Gold */}
                  <div className="text-center rounded-lg bg-white/5 border border-white/10" style={{ padding: '1rem' }}>
                    <div className="text-xl font-bold text-yellow-400 font-['Rajdhani']">
                      {(champion.averageGold / 1000).toFixed(1)}k
                    </div>
                    <div className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mt-1.5">
                      Gold / Game
                    </div>
                  </div>

                  {/* Dégâts */}
                  <div className="text-center rounded-lg bg-white/5 border border-white/10" style={{ padding: '1rem' }}>
                    <div className="text-xl font-bold text-red-400 font-['Rajdhani']">
                      {(champion.averageDamage / 1000).toFixed(1)}k
                    </div>
                    <div className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mt-1.5">
                      Dmg / Game
                    </div>
                  </div>

                  {/* DPM */}
                  <div className="text-center rounded-lg bg-white/5 border border-white/10" style={{ padding: '1rem' }}>
                    <div className="text-xl font-bold text-orange-400 font-['Rajdhani']">
                      {(champion.damagePerMinute / 1000).toFixed(1)}k
                    </div>
                    <div className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mt-1.5">
                      Dmg / Min
                    </div>
                  </div>

                  {/* Vision */}
                  <div className="text-center rounded-lg bg-white/5 border border-white/10" style={{ padding: '1rem' }}>
                    <div className="text-xl font-bold text-purple-400 font-['Rajdhani']">
                      {champion.averageVisionScore}
                    </div>
                    <div className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mt-1.5">
                      Vision
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Expand/Collapse Button */}
            {(champion.bestMatchups.length > 0 || champion.worstMatchups.length > 0) && (
              <button
                onClick={() => toggleChampion(champion.championName)}
                className="w-full flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-200"
                style={{ gap: '0.625rem', padding: '0.875rem 1.25rem', marginTop: '2rem' }}
              >
                <span className="text-sm font-semibold text-[var(--text-tertiary)]">
                  {expandedChampions.has(champion.championName) ? 'Hide Details' : 'Show Matchups'}
                </span>
                <svg
                  className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200 ${
                    expandedChampions.has(champion.championName) ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}

            {/* Matchups - Collapsible */}
            {expandedChampions.has(champion.championName) && (champion.bestMatchups.length > 0 || champion.worstMatchups.length > 0) && (
              <div className="mt-4 pt-4 border-t border-white/10 animate-fadeIn">
                <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '2rem' }}>
                  {/* Best Matchups */}
                  {champion.bestMatchups.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3 flex items-center" style={{ gap: '0.5rem' }}>
                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                        </svg>
                        Best Matchups
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {champion.bestMatchups.map((matchup, index) => (
                          <div key={matchup.championName} className="flex items-center rounded-lg bg-green-500/5 border border-green-500/20" style={{ padding: '0.875rem 1rem', gap: '0.875rem' }}>
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={getChampionImageUrl(matchup.championName, ddragonVersion)}
                                alt={matchup.championName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <div className="absolute -top-1 -left-1 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center" style={{ width: '18px', height: '18px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-white truncate">
                                  {matchup.championName}
                                </span>
                                <span className="text-xs font-bold text-green-400" style={{ marginLeft: '0.75rem' }}>
                                  {matchup.winrate}%
                                </span>
                              </div>
                              <div className="text-[11px] text-[var(--text-tertiary)] mt-1">
                                {matchup.wins}W - {matchup.games - matchup.wins}L ({matchup.games} games)
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Worst Matchups */}
                  {champion.worstMatchups.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3 flex items-center" style={{ gap: '0.5rem' }}>
                        <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                        </svg>
                        Worst Matchups
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {champion.worstMatchups.map((matchup, index) => (
                          <div key={matchup.championName} className="flex items-center rounded-lg bg-red-500/5 border border-red-500/20" style={{ padding: '0.875rem 1rem', gap: '0.875rem' }}>
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={getChampionImageUrl(matchup.championName, ddragonVersion)}
                                alt={matchup.championName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <div className="absolute -top-1 -left-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center" style={{ width: '18px', height: '18px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                                {index + 1}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-white truncate">
                                  {matchup.championName}
                                </span>
                                <span className="text-xs font-bold text-red-400" style={{ marginLeft: '0.75rem' }}>
                                  {matchup.winrate}%
                                </span>
                              </div>
                              <div className="text-[11px] text-[var(--text-tertiary)] mt-1">
                                {matchup.wins}W - {matchup.games - matchup.wins}L ({matchup.games} games)
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

      {/* Empty state */}
      {champions.length === 0 && (
        <div className="glass-card" style={{ padding: '3rem' }}>
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-cyan-500/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-cyan-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-[var(--text-secondary)] font-medium text-sm">
              No champion data available
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
