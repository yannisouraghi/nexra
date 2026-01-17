'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getChampionImageUrl } from '@/utils/ddragon';

const NEXRA_API_URL = process.env.NEXT_PUBLIC_NEXRA_API_URL || 'https://nexra-api.nexra-api.workers.dev';

interface ChampionStats {
  championName: string;
  games: number;
  wins: number;
  losses: number;
  winrate: number;
}

interface PlayerStats {
  topChampions: ChampionStats[];
  recentMatchResults: boolean[];
  mainRole: string;
  totalGames: number;
}

interface PlayerHeaderProps {
  gameName: string;
  tagLine: string;
  region: string;
  profileIconId?: number;
  summonerLevel?: number;
  puuid?: string;
  rank?: {
    tier: string;
    rank: string;
    leaguePoints: number;
    wins: number;
    losses: number;
  } | null;
  playerStats?: PlayerStats | null;
  onRefresh?: () => void;
}

export default function PlayerHeader({ gameName, tagLine, region, profileIconId, summonerLevel, puuid, rank, playerStats, onRefresh }: PlayerHeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [currentSeason, setCurrentSeason] = useState<{ year: number; split: number } | null>(null);
  const [unlinkingAccount, setUnlinkingAccount] = useState(false);
  const [ddragonVersion, setDdragonVersion] = useState('15.1.1');

  useEffect(() => {
    // Récupérer la version actuelle depuis Data Dragon
    const fetchCurrentSeason = async () => {
      try {
        const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        const versions = await response.json();

        if (versions && versions.length > 0) {
          // La première version est la plus récente (ex: "15.1.1")
          const currentVersion = versions[0];
          setDdragonVersion(currentVersion);
          const [major, minor] = currentVersion.split('.').map(Number);

          // La version majeure correspond à la saison (15 = 2025)
          // Season mapping: version 15 = 2025, version 14 = 2024, etc.
          const seasonYear = 2010 + major;

          // Le numéro mineur indique le split (1-8 pour split 1, 9-16 pour split 2, 17-24 pour split 3)
          let split = 1;
          if (minor >= 9) split = 2;
          if (minor >= 17) split = 3;

          setCurrentSeason({ year: seasonYear, split });
        }
      } catch (error) {
        console.error('Error fetching season:', error);
        // Fallback: utiliser l'année en cours
        const year = new Date().getFullYear();
        setCurrentSeason({ year, split: 1 });
      }
    };

    fetchCurrentSeason();
  }, []);
  const regionLabels: { [key: string]: string } = {
    'euw1': 'EUW',
    'eun1': 'EUNE',
    'na1': 'NA',
    'br1': 'BR',
    'la1': 'LAN',
    'la2': 'LAS',
    'oc1': 'OCE',
    'ru': 'RU',
    'tr1': 'TR',
    'jp1': 'JP',
    'kr': 'KR',
    'ph2': 'PH',
    'sg2': 'SG',
    'th2': 'TH',
    'tw2': 'TW',
    'vn2': 'VN',
  };

  const profileIconUrl = profileIconId
    ? `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/profileicon/${profileIconId}.png`
    : null;

  const getRankImageUrl = () => {
    if (!rank) return null;
    const tier = rank.tier.toLowerCase();
    return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/ranked-emblem/emblem-${tier}.png`;
  };

  const getTierColor = () => {
    if (!rank) return '#94a3b8';
    const tier = rank.tier.toUpperCase();

    const colorMap: { [key: string]: string } = {
      'CHALLENGER': '#f59e0b',
      'GRANDMASTER': '#ef4444',
      'MASTER': '#a855f7',
      'DIAMOND': '#3b82f6',
      'EMERALD': '#10b981',
      'PLATINUM': '#06b6d4',
      'GOLD': '#eab308',
      'SILVER': '#94a3b8',
      'BRONZE': '#ea580c',
      'IRON': '#71717a',
    };

    return colorMap[tier] || '#94a3b8';
  };

  const rankImageUrl = getRankImageUrl();
  const tierColor = getTierColor();
  const winRate = rank ? Math.round((rank.wins / (rank.wins + rank.losses)) * 100) : 0;
  const totalGames = rank ? rank.wins + rank.losses : 0;

  const handleUnlinkRiot = async () => {
    const userId = session?.user?.id;
    if (!userId) return;

    setUnlinkingAccount(true);
    try {
      // Delete from database
      const response = await fetch(`${NEXRA_API_URL}/users/${userId}/link-riot`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to unlink account');
      }

      // Clear localStorage and set unlink flag
      localStorage.removeItem('nexra_riot_account');
      localStorage.setItem('nexra_riot_unlinked', 'true');

      // Redirect to link-riot page
      router.push('/link-riot');
    } catch (error) {
      console.error('Error unlinking Riot account:', error);
      setUnlinkingAccount(false);
    }
  };

  return (
    <div className="glass-card relative overflow-hidden">
      {/* Action Buttons - Only Refresh and Change Account */}
      <div className="absolute z-20 flex items-center" style={{ top: '0.75rem', right: '0.75rem', gap: '0.375rem' }}>
        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          className="group flex items-center justify-center rounded-lg border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/10 transition-all duration-300"
          style={{ padding: '0.4rem', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          title="Refresh data"
        >
          <svg
            className="group-hover:text-cyan-400 transition-all group-hover:rotate-180 duration-500 w-4 h-4 sm:w-[18px] sm:h-[18px]"
            style={{ color: 'rgba(255, 255, 255, 0.6)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        {/* Change Account Button */}
        <button
          onClick={handleUnlinkRiot}
          disabled={unlinkingAccount}
          className="group flex items-center justify-center rounded-lg border border-white/10 hover:border-orange-500/30 hover:bg-orange-500/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ padding: '0.4rem', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          title="Change Riot account"
        >
          <svg
            className="group-hover:text-orange-400 transition-all duration-300 w-4 h-4 sm:w-[18px] sm:h-[18px]"
            style={{ color: 'rgba(255, 255, 255, 0.6)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Player Identity */}
        <div className="flex items-center gap-3 sm:gap-5 mb-4 sm:mb-6">
          {/* Profile Icon */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl border-2 overflow-hidden bg-gradient-to-br from-gray-900 to-black" style={{ borderColor: '#06b6d4' }}>
              {profileIconUrl ? (
                <img src={profileIconUrl} alt={`${gameName} profile`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-7 h-7 sm:w-10 sm:h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            {summonerLevel && (
              <div className="absolute -bottom-1 -right-1 sm:-bottom-1.5 sm:-right-1.5 rounded-md sm:rounded-lg px-1.5 sm:px-2 py-0.5 border-2" style={{ backgroundColor: '#06b6d4', borderColor: '#06b6d4', boxShadow: '0 0 10px #06b6d4' }}>
                <span className="text-[10px] sm:text-xs font-bold text-white">{summonerLevel}</span>
              </div>
            )}
          </div>

          {/* Name and Region */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1 sm:gap-2 mb-1 sm:mb-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">{gameName}</h1>
              <span className="text-sm sm:text-base lg:text-lg text-white/50 font-medium flex-shrink-0">#{tagLine}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Region Badge */}
              <div className="inline-flex items-center rounded bg-white/5 border border-white/10 gap-1 sm:gap-1.5 px-2 py-0.5 sm:py-1">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white/60"></div>
                <span className="text-[10px] sm:text-xs font-semibold text-white/60 uppercase tracking-wide">
                  {regionLabels[region] || region.toUpperCase()}
                </span>
              </div>

              {/* Season Badge */}
              {currentSeason && (
                <div className="inline-flex items-center rounded border gap-1 sm:gap-1.5 px-2 py-0.5 sm:py-1" style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
                  borderColor: 'rgba(139, 92, 246, 0.3)',
                }}>
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" style={{ color: '#a78bfa' }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide" style={{ color: '#a78bfa' }}>
                    S{currentSeason.year} Split {currentSeason.split}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rank Section */}
        {rank && rankImageUrl ? (
          <div>
            {/* Rank Display - Responsive layout */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8 mb-4 lg:mb-6">
              {/* Rank Emblem + Info Group */}
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Rank Emblem - Responsive size */}
                <div className="flex-shrink-0 w-[80px] sm:w-[120px] lg:w-[150px] overflow-visible">
                  <img
                    src={rankImageUrl}
                    alt={`${rank.tier} ${rank.rank}`}
                    className="w-full h-auto scale-[1.8] sm:scale-[2] lg:scale-[2.2] origin-center"
                  />
                </div>

                {/* Rank Info */}
                <div className="min-w-0">
                  <div className="mb-1 sm:mb-2">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold" style={{ color: tierColor }}>
                      {rank.tier.charAt(0) + rank.tier.slice(1).toLowerCase()} {rank.rank}
                    </h2>
                    <p className="text-xs sm:text-sm text-white/50">Ranked Solo/Duo</p>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-base sm:text-lg lg:text-xl font-bold text-white">{rank.leaguePoints}</span>
                    <span className="text-xs sm:text-sm text-white/60">LP</span>
                  </div>
                </div>
              </div>

              {/* Stats additionnelles - Hidden on mobile, shown on larger screens */}
              {playerStats && (
                <div className="hidden md:flex items-center gap-6 lg:gap-8 flex-1">
                  {/* Recent Performance */}
                  {playerStats.recentMatchResults.length > 0 && (
                    <div className="flex flex-col items-start">
                      <div className="text-[10px] sm:text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                        Recent
                      </div>
                      <div className="flex items-center gap-1">
                        {playerStats.recentMatchResults.slice(0, 5).map((isWin, idx) => (
                          <div
                            key={idx}
                            className="w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center text-[10px] lg:text-xs font-bold"
                            style={{
                              backgroundColor: isWin ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              border: `2px solid ${isWin ? '#22c55e' : '#ef4444'}`,
                              color: isWin ? '#22c55e' : '#ef4444',
                            }}
                          >
                            {isWin ? 'W' : 'L'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Champions - Compact on tablet, full on desktop */}
                  {playerStats.topChampions.length > 0 && (
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <div className="text-[10px] sm:text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">
                        Top Champions
                      </div>
                      <div className="flex items-center gap-2">
                        {playerStats.topChampions.slice(0, 3).map((champion, idx) => (
                          <div
                            key={idx}
                            className="flex items-center rounded-lg border p-1.5 lg:p-2 gap-1.5 lg:gap-2"
                            style={{
                              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                              borderColor: champion.winrate >= 60 ? 'rgba(34, 197, 94, 0.3)' : champion.winrate >= 50 ? 'rgba(234, 179, 8, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                            }}
                          >
                            <img
                              src={getChampionImageUrl(champion.championName, ddragonVersion)}
                              alt={champion.championName}
                              className="w-7 h-7 lg:w-9 lg:h-9 rounded"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            <div className="hidden lg:flex flex-col min-w-[50px]">
                              <div className="text-[10px] font-bold text-white truncate max-w-[60px]">
                                {champion.championName}
                              </div>
                              <span className="text-[10px] font-bold" style={{ color: champion.winrate >= 60 ? '#22c55e' : champion.winrate >= 50 ? '#eab308' : '#ef4444' }}>
                                {champion.winrate}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stats Grid - Responsive */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
              {/* Total Games */}
              <div className="text-center rounded-lg bg-white/5 border border-white/10 p-2 sm:p-3 lg:p-4">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{totalGames}</div>
                <div className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider font-semibold mt-0.5">
                  Games
                </div>
              </div>

              {/* Win Rate */}
              <div className="text-center rounded-lg bg-white/5 border border-white/10 p-2 sm:p-3 lg:p-4">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{winRate}%</div>
                <div className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider font-semibold mt-0.5">
                  Winrate
                </div>
              </div>

              {/* W/L */}
              <div className="text-center rounded-lg bg-white/5 border border-white/10 p-2 sm:p-3 lg:p-4">
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <span className="text-lg font-bold text-green-400">{rank.wins}</span>
                  <span className="text-sm text-white/40">/</span>
                  <span className="text-lg font-bold text-red-400">{rank.losses}</span>
                </div>
                <div className="text-xs text-white/50 uppercase tracking-wider font-semibold" style={{ marginTop: '0.25rem' }}>
                  W / L
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center" style={{ padding: '3rem 1rem' }}>
            <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-500/20 to-gray-600/10 border-2 border-gray-500/20 flex items-center justify-center">
              <svg className="w-16 h-16 text-gray-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Unranked</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              This player hasn't played any ranked games this season yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
