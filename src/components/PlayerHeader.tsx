'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getChampionImageUrl } from '@/utils/ddragon';
import { NEXRA_API_URL, DDRAGON_CONFIG } from '@/config/api';

function getAuthHeaders(userId?: string, email?: string): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (userId && email) {
    headers['Authorization'] = `Bearer ${userId}:${email}`;
  }
  return headers;
}

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
  const [ddragonVersion, setDdragonVersion] = useState(DDRAGON_CONFIG.FALLBACK_VERSION);

  useEffect(() => {
    const fetchCurrentSeason = async () => {
      try {
        const response = await fetch(`${DDRAGON_CONFIG.BASE_URL}/api/versions.json`);
        const versions = await response.json();

        if (versions && versions.length > 0) {
          const currentVersion = versions[0];
          setDdragonVersion(currentVersion);
          const [major, minor] = currentVersion.split('.').map(Number);
          const seasonYear = 2010 + major;
          let split = 1;
          if (minor >= 9) split = 2;
          if (minor >= 17) split = 3;
          setCurrentSeason({ year: seasonYear, split });
        }
      } catch (error) {
        console.error('Error fetching season:', error);
        const year = new Date().getFullYear();
        setCurrentSeason({ year, split: 1 });
      }
    };

    fetchCurrentSeason();
  }, []);

  const regionLabels: { [key: string]: string } = {
    'euw1': 'EUW', 'eun1': 'EUNE', 'na1': 'NA', 'br1': 'BR', 'la1': 'LAN',
    'la2': 'LAS', 'oc1': 'OCE', 'ru': 'RU', 'tr1': 'TR', 'jp1': 'JP',
    'kr': 'KR', 'ph2': 'PH', 'sg2': 'SG', 'th2': 'TH', 'tw2': 'TW', 'vn2': 'VN',
  };

  const profileIconUrl = profileIconId
    ? `${DDRAGON_CONFIG.BASE_URL}/cdn/${ddragonVersion}/img/profileicon/${profileIconId}.png`
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
      'CHALLENGER': '#f59e0b', 'GRANDMASTER': '#ef4444', 'MASTER': '#a855f7',
      'DIAMOND': '#3b82f6', 'EMERALD': '#10b981', 'PLATINUM': '#06b6d4',
      'GOLD': '#eab308', 'SILVER': '#94a3b8', 'BRONZE': '#ea580c', 'IRON': '#71717a',
    };
    return colorMap[tier] || '#94a3b8';
  };

  const rankImageUrl = getRankImageUrl();
  const tierColor = getTierColor();
  const winRate = rank ? Math.round((rank.wins / (rank.wins + rank.losses)) * 100) : 0;
  const totalGames = rank ? rank.wins + rank.losses : 0;

  const handleUnlinkRiot = async () => {
    const user = session?.user as { id?: string; email?: string };
    if (!user?.id) return;

    setUnlinkingAccount(true);
    try {
      const response = await fetch(`${NEXRA_API_URL}/users/${user.id}/link-riot`, {
        method: 'DELETE',
        headers: getAuthHeaders(user.id, user.email),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to unlink account');
      }

      // Clear local storage
      localStorage.removeItem('nexra_riot_account');
      localStorage.setItem('nexra_riot_unlinked', 'true');

      // Redirect to link-riot page
      router.push('/link-riot');
    } catch (error) {
      console.error('Error unlinking Riot account:', error);
      alert('Failed to unlink Riot account. Please try again.');
    } finally {
      setUnlinkingAccount(false);
    }
  };

  // Inline styles
  const styles = {
    actionButtons: {
      position: 'absolute' as const,
      top: '0.75rem',
      right: '0.75rem',
      zIndex: 20,
      display: 'flex',
      alignItems: 'center',
      gap: '0.375rem',
    },
    actionButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0.4rem',
      borderRadius: '0.5rem',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    actionIcon: {
      width: '18px',
      height: '18px',
      color: 'rgba(255, 255, 255, 0.6)',
    },
    container: {
      padding: '1.5rem',
    },
    playerIdentity: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      marginBottom: '1.5rem',
    },
    profileIconWrapper: {
      position: 'relative' as const,
      flexShrink: 0,
    },
    profileIcon: {
      width: '72px',
      height: '72px',
      borderRadius: '0.75rem',
      border: '2px solid #06b6d4',
      overflow: 'hidden',
      background: 'linear-gradient(to bottom right, #111827, #000)',
    },
    levelBadge: {
      position: 'absolute' as const,
      bottom: '-4px',
      right: '-4px',
      backgroundColor: '#06b6d4',
      borderRadius: '0.375rem',
      padding: '2px 6px',
      border: '2px solid #06b6d4',
      boxShadow: '0 0 10px #06b6d4',
    },
    levelText: {
      fontSize: '11px',
      fontWeight: 700,
      color: 'white',
    },
    nameContainer: {
      flex: 1,
      minWidth: 0,
    },
    nameRow: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '0.5rem',
      marginBottom: '0.5rem',
    },
    gameName: {
      fontSize: '1.5rem',
      fontWeight: 700,
      color: 'white',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    },
    tagLine: {
      fontSize: '1rem',
      color: 'rgba(255, 255, 255, 0.5)',
      fontWeight: 500,
      flexShrink: 0,
    },
    badgesRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      flexWrap: 'wrap' as const,
    },
    regionBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.375rem',
      padding: '0.25rem 0.5rem',
      borderRadius: '0.25rem',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    regionDot: {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 255, 255, 0.6)',
    },
    regionText: {
      fontSize: '11px',
      fontWeight: 600,
      color: 'rgba(255, 255, 255, 0.6)',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    },
    seasonBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.375rem',
      padding: '0.25rem 0.5rem',
      borderRadius: '0.25rem',
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
      border: '1px solid rgba(139, 92, 246, 0.3)',
    },
    seasonIcon: {
      width: '12px',
      height: '12px',
      color: '#a78bfa',
    },
    seasonText: {
      fontSize: '11px',
      fontWeight: 700,
      color: '#a78bfa',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    },
    rankSection: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '1rem',
    },
    rankDisplay: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
    },
    rankEmblem: {
      flexShrink: 0,
      width: '100px',
      overflow: 'visible',
    },
    rankEmblemImg: {
      width: '100%',
      height: 'auto',
      transform: 'scale(2)',
      transformOrigin: 'center',
    },
    rankInfo: {
      minWidth: 0,
    },
    rankTier: {
      fontSize: '1.25rem',
      fontWeight: 700,
      marginBottom: '0.25rem',
    },
    rankSubtitle: {
      fontSize: '0.75rem',
      color: 'rgba(255, 255, 255, 0.5)',
      marginBottom: '0.5rem',
    },
    lpRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.375rem',
    },
    lpValue: {
      fontSize: '1.125rem',
      fontWeight: 700,
      color: 'white',
    },
    lpLabel: {
      fontSize: '0.75rem',
      color: 'rgba(255, 255, 255, 0.6)',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '0.75rem',
    },
    statCard: {
      textAlign: 'center' as const,
      borderRadius: '0.5rem',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '0.75rem',
    },
    statValue: {
      fontSize: '1.25rem',
      fontWeight: 700,
      color: 'white',
    },
    statLabel: {
      fontSize: '10px',
      color: 'rgba(255, 255, 255, 0.5)',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      fontWeight: 600,
      marginTop: '0.25rem',
    },
    wlRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
    },
    winValue: {
      fontSize: '1.125rem',
      fontWeight: 700,
      color: '#22c55e',
    },
    lossValue: {
      fontSize: '1.125rem',
      fontWeight: 700,
      color: '#ef4444',
    },
    wlDivider: {
      fontSize: '0.875rem',
      color: 'rgba(255, 255, 255, 0.4)',
    },
    unrankedContainer: {
      textAlign: 'center' as const,
      padding: '3rem 1rem',
    },
    unrankedIcon: {
      width: '128px',
      height: '128px',
      margin: '0 auto 1rem',
      borderRadius: '50%',
      background: 'linear-gradient(to bottom right, rgba(107, 114, 128, 0.2), rgba(75, 85, 99, 0.1))',
      border: '2px solid rgba(107, 114, 128, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    unrankedTitle: {
      fontSize: '1.5rem',
      fontWeight: 700,
      color: 'white',
      marginBottom: '0.5rem',
    },
    unrankedText: {
      fontSize: '0.875rem',
      color: '#9ca3af',
      maxWidth: '24rem',
      margin: '0 auto',
    },
  };

  return (
    <div className="glass-card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ padding: '1.5rem' }}>
        {/* Main horizontal layout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>

          {/* Left: Player Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '250px' }}>
            {/* Profile Icon */}
            <div style={styles.profileIconWrapper}>
              <div style={styles.profileIcon}>
                {profileIconUrl ? (
                  <img src={profileIconUrl} alt={`${gameName} profile`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: '40px', height: '40px', color: 'rgba(255, 255, 255, 0.3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              {summonerLevel && (
                <div style={styles.levelBadge}>
                  <span style={styles.levelText}>{summonerLevel}</span>
                </div>
              )}
            </div>

            {/* Name and Region */}
            <div>
              <div style={styles.nameRow}>
                <h1 style={styles.gameName}>{gameName}</h1>
                <span style={styles.tagLine}>#{tagLine}</span>
              </div>
              <div style={styles.badgesRow}>
                <div style={styles.regionBadge}>
                  <div style={styles.regionDot}></div>
                  <span style={styles.regionText}>{regionLabels[region] || region.toUpperCase()}</span>
                </div>
                {currentSeason && (
                  <div style={styles.seasonBadge}>
                    <svg style={styles.seasonIcon} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span style={styles.seasonText}>S{currentSeason.year} Split {currentSeason.split}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Separator */}
          <div style={{ width: '1px', height: '60px', backgroundColor: 'rgba(255, 255, 255, 0.1)', flexShrink: 0 }} className="hidden lg:block" />

          {/* Center: Rank Info */}
          {rank && rankImageUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '0 0 auto' }}>
              <div style={{ width: '70px', overflow: 'visible', flexShrink: 0 }}>
                <img src={rankImageUrl} alt={`${rank.tier} ${rank.rank}`} style={{ width: '100%', height: 'auto', transform: 'scale(1.8)', transformOrigin: 'center' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: tierColor, marginBottom: '0.125rem' }}>
                  {rank.tier.charAt(0) + rank.tier.slice(1).toLowerCase()} {rank.rank}
                </h2>
                <p style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.25rem' }}>Ranked Solo/Duo</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>{rank.leaguePoints}</span>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>LP</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem', background: 'rgba(107, 114, 128, 0.1)', borderRadius: '0.75rem', border: '1px solid rgba(107, 114, 128, 0.2)' }}>
              <svg style={{ width: '32px', height: '32px', color: 'rgba(156, 163, 175, 0.6)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>Unranked</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(156, 163, 175, 0.8)' }}>No ranked games yet</div>
              </div>
            </div>
          )}

          {/* Separator */}
          {rank && <div style={{ width: '1px', height: '60px', backgroundColor: 'rgba(255, 255, 255, 0.1)', flexShrink: 0 }} className="hidden lg:block" />}

          {/* Ranked Stats */}
          {rank && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }} className="hidden lg:flex">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>{totalGames}</div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Games</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: winRate >= 50 ? '#22c55e' : '#ef4444' }}>{winRate}%</div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Winrate</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#22c55e' }}>{rank.wins}</span>
                  <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.4)' }}>/</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444' }}>{rank.losses}</span>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>W / L</div>
              </div>
            </div>
          )}

          {/* Separator */}
          {playerStats && <div style={{ width: '1px', height: '60px', backgroundColor: 'rgba(255, 255, 255, 0.1)', flexShrink: 0 }} className="hidden xl:block" />}

          {/* Recent Performance */}
          {playerStats?.recentMatchResults && playerStats.recentMatchResults.length > 0 && (
            <div className="hidden xl:flex" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>
                Recent
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                {playerStats.recentMatchResults.slice(0, 10).map((isWin, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '9px',
                      fontWeight: 700,
                      backgroundColor: isWin ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      border: `1px solid ${isWin ? '#22c55e' : '#ef4444'}`,
                      color: isWin ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {isWin ? 'W' : 'L'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Separator */}
          {playerStats?.topChampions && <div style={{ width: '1px', height: '60px', backgroundColor: 'rgba(255, 255, 255, 0.1)', flexShrink: 0 }} className="hidden xl:block" />}

          {/* Top Champions */}
          {playerStats?.topChampions && playerStats.topChampions.length > 0 && (
            <div className="hidden xl:flex" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>
                Top Champions
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                {playerStats.topChampions.slice(0, 3).map((champion, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${champion.winrate >= 60 ? 'rgba(34, 197, 94, 0.3)' : champion.winrate >= 50 ? 'rgba(234, 179, 8, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    }}
                  >
                    <img
                      src={getChampionImageUrl(champion.championName, ddragonVersion)}
                      alt={champion.championName}
                      style={{ width: '24px', height: '24px', borderRadius: '4px' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: champion.winrate >= 60 ? '#22c55e' : champion.winrate >= 50 ? '#eab308' : '#ef4444' }}>
                        {champion.winrate}%
                      </span>
                      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>{champion.games}g</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons - Right side */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <button
              onClick={onRefresh}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 0.875rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: '#22d3ee',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
              title="Refresh data"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.1)';
              }}
            >
              <svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleUnlinkRiot}
              disabled={unlinkingAccount}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 0.875rem',
                borderRadius: '0.5rem',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                cursor: unlinkingAccount ? 'not-allowed' : 'pointer',
                opacity: unlinkingAccount ? 0.5 : 1,
                transition: 'all 0.2s',
                color: '#fb923c',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
              title="Change Riot account"
              onMouseEnter={(e) => {
                if (!unlinkingAccount) e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.1)';
              }}
            >
              <svg style={{ width: '14px', height: '14px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="hidden sm:inline">Change</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
