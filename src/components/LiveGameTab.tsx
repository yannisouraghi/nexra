'use client';

import { useState, useEffect, useCallback } from 'react';
import { Radio, RefreshCw, Clock, Swords, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface RankInfo {
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  winrate: number;
}

interface Participant {
  puuid: string;
  summonerId: string;
  championId: number;
  teamId: number;
  spell1Id: number;
  spell2Id: number;
  gameName?: string;
  tagLine?: string;
  rankInfo?: RankInfo | null;
  // Enriched data
  championMastery?: number;
  championPoints?: number;
  gamesOnChampion?: number;
  winrateOnChampion?: number;
  kdaOnChampion?: number;
  recentWinrate?: number;
  currentStreak?: number;
  mainRole?: string;
  currentRole?: string;
  isAutofill?: boolean;
  recentForm?: boolean[];
  perks?: {
    perkIds: number[];
    perkStyle: number;
    perkSubStyle: number;
  };
}

interface GameData {
  gameId: number;
  gameType: string;
  gameStartTime: number;
  mapId: number;
  gameLength: number;
  gameMode: string;
  gameQueueConfigId: number;
  bannedChampions: { championId: number; teamId: number; pickTurn: number }[];
  participants: Participant[];
}

interface LiveGameTabProps {
  puuid: string;
  region: string;
  gameName: string;
  tagLine: string;
  onGameStatusChange?: (inGame: boolean) => void;
}

// Champion ID to name mapping (simplified - you might want to fetch this from Data Dragon)
const QUEUE_NAMES: { [key: number]: string } = {
  420: 'Ranked Solo/Duo',
  440: 'Ranked Flex',
  400: 'Normal Draft',
  430: 'Normal Blind',
  450: 'ARAM',
  900: 'URF',
  1020: 'One for All',
  1300: 'Nexus Blitz',
  1400: 'Ultimate Spellbook',
};

const TIER_ORDER = ['CHALLENGER', 'GRANDMASTER', 'MASTER', 'DIAMOND', 'EMERALD', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'IRON'];

const getTierColor = (tier: string): string => {
  const colors: { [key: string]: string } = {
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
  return colors[tier] || '#94a3b8';
};

const formatGameTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function LiveGameTab({ puuid, region, gameName, tagLine, onGameStatusChange }: LiveGameTabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inGame, setInGame] = useState(false);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [gameTime, setGameTime] = useState(0);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [ddragonVersion, setDdragonVersion] = useState('15.1.1');
  const [championData, setChampionData] = useState<{ [key: number]: string }>({});

  // Fetch Data Dragon version and champion data
  useEffect(() => {
    const fetchDDragon = async () => {
      try {
        const versionsResponse = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        const versions = await versionsResponse.json();
        const latestVersion = versions[0];
        setDdragonVersion(latestVersion);

        // Fetch champion data
        const champResponse = await fetch(
          `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`
        );
        const champData = await champResponse.json();

        // Create a map of championId to championName
        const champMap: { [key: number]: string } = {};
        Object.values(champData.data).forEach((champ: any) => {
          champMap[parseInt(champ.key)] = champ.id;
        });
        setChampionData(champMap);
      } catch (e) {
        console.error('Error fetching DDragon data:', e);
      }
    };
    fetchDDragon();
  }, []);

  const fetchLiveGame = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/riot/live-game?puuid=${encodeURIComponent(puuid)}&region=${encodeURIComponent(region)}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch live game');
      }

      const data = await response.json();
      setInGame(data.inGame);
      setGameData(data.gameData);
      setLastCheck(new Date());

      if (data.inGame && data.gameData) {
        // Calculate current game time
        const startTime = data.gameData.gameStartTime;
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setGameTime(elapsed > 0 ? elapsed : data.gameData.gameLength);
      }

      // Notify parent of game status
      onGameStatusChange?.(data.inGame);
    } catch (e) {
      console.error('Error fetching live game:', e);
      setError(e instanceof Error ? e.message : 'Failed to check game status');
      setInGame(false);
      onGameStatusChange?.(false);
    } finally {
      setLoading(false);
    }
  }, [puuid, region, onGameStatusChange]);

  // Initial fetch and polling
  useEffect(() => {
    fetchLiveGame();

    // Poll every 30 seconds when not in game, every 60 seconds when in game
    const interval = setInterval(() => {
      fetchLiveGame();
    }, inGame ? 60000 : 30000);

    return () => clearInterval(interval);
  }, [fetchLiveGame, inGame]);

  // Update game time every second when in game
  useEffect(() => {
    if (!inGame || !gameData) return;

    const interval = setInterval(() => {
      setGameTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [inGame, gameData]);

  const getChampionImageUrl = (championId: number): string => {
    const championName = championData[championId] || 'Unknown';
    return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${championName}.png`;
  };

  const getSummonerSpellUrl = (spellId: number): string => {
    const spellMap: { [key: number]: string } = {
      1: 'SummonerBoost',      // Cleanse
      3: 'SummonerExhaust',    // Exhaust
      4: 'SummonerFlash',      // Flash
      6: 'SummonerHaste',      // Ghost
      7: 'SummonerHeal',       // Heal
      11: 'SummonerSmite',     // Smite
      12: 'SummonerTeleport',  // Teleport
      13: 'SummonerMana',      // Clarity
      14: 'SummonerDot',       // Ignite
      21: 'SummonerBarrier',   // Barrier
      32: 'SummonerSnowball',  // Mark (ARAM)
    };
    const spellName = spellMap[spellId] || 'SummonerFlash';
    return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/spell/${spellName}.png`;
  };

  // Split participants by team
  const blueTeam = gameData?.participants.filter(p => p.teamId === 100) || [];
  const redTeam = gameData?.participants.filter(p => p.teamId === 200) || [];

  // Calculate team average rank
  const calculateTeamAvgRank = (team: Participant[]): string => {
    const rankedPlayers = team.filter(p => p.rankInfo);
    if (rankedPlayers.length === 0) return 'Unranked';

    const avgTierIndex = rankedPlayers.reduce((sum, p) => {
      const tierIndex = TIER_ORDER.indexOf(p.rankInfo!.tier);
      return sum + (tierIndex >= 0 ? tierIndex : TIER_ORDER.length);
    }, 0) / rankedPlayers.length;

    return TIER_ORDER[Math.round(avgTierIndex)] || 'Unknown';
  };

  const calculateTeamWinrate = (team: Participant[]): number => {
    const rankedPlayers = team.filter(p => p.rankInfo);
    if (rankedPlayers.length === 0) return 50;

    const avgWinrate = rankedPlayers.reduce((sum, p) => sum + (p.rankInfo?.winrate || 50), 0) / rankedPlayers.length;
    return Math.round(avgWinrate);
  };

  const renderParticipant = (participant: Participant, isCurrentPlayer: boolean) => {
    const rankInfo = participant.rankInfo;
    const tierColor = rankInfo ? getTierColor(rankInfo.tier) : '#94a3b8';
    const winrate = rankInfo?.winrate || 0;
    const isAutofill = participant.isAutofill;
    const streak = participant.currentStreak || 0;
    const gamesOnChamp = participant.gamesOnChampion || 0;
    const champWinrate = participant.winrateOnChampion || 50;
    const champMastery = participant.championMastery || 0;
    const recentForm = participant.recentForm || [];

    return (
      <div
        key={participant.puuid}
        className={`rounded-xl border transition-all duration-200 ${
          isCurrentPlayer
            ? 'bg-cyan-500/10 border-cyan-500/40'
            : isAutofill
              ? 'bg-orange-500/5 border-orange-500/30'
              : 'bg-white/5 border-white/10 hover:bg-white/10'
        }`}
        style={{ padding: '0.75rem' }}
      >
        <div className="flex items-center" style={{ gap: '0.75rem' }}>
          {/* Champion Icon */}
          <div className="relative flex-shrink-0">
            <img
              src={getChampionImageUrl(participant.championId)}
              alt="Champion"
              className="rounded-lg"
              style={{ width: '52px', height: '52px' }}
              onError={(e) => {
                e.currentTarget.src = `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/Unknown.png`;
              }}
            />
            {/* Champion Mastery Badge */}
            {champMastery > 0 && (
              <div
                className="absolute -top-1 -left-1 rounded-full text-xs font-bold flex items-center justify-center"
                style={{
                  width: '18px',
                  height: '18px',
                  backgroundColor: champMastery >= 7 ? '#a855f7' : champMastery >= 5 ? '#ef4444' : '#3b82f6',
                  fontSize: '10px',
                  color: 'white',
                  border: '2px solid rgba(0,0,0,0.5)',
                }}
              >
                {champMastery}
              </div>
            )}
            {/* Summoner Spells */}
            <div className="absolute -bottom-1 -right-1 flex" style={{ gap: '1px' }}>
              <img
                src={getSummonerSpellUrl(participant.spell1Id)}
                alt="Spell 1"
                className="rounded"
                style={{ width: '16px', height: '16px' }}
              />
              <img
                src={getSummonerSpellUrl(participant.spell2Id)}
                alt="Spell 2"
                className="rounded"
                style={{ width: '16px', height: '16px' }}
              />
            </div>
          </div>

          {/* Player Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap" style={{ gap: '0.375rem' }}>
              <span className={`font-semibold text-sm truncate ${isCurrentPlayer ? 'text-cyan-300' : 'text-white'}`}>
                {participant.gameName || 'Unknown'}
              </span>
              {isCurrentPlayer && (
                <span className="text-xs bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded font-bold">
                  YOU
                </span>
              )}
              {isAutofill && (
                <span className="text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-bold">
                  AUTOFILL
                </span>
              )}
            </div>

            {/* Rank + Role */}
            <div className="flex items-center flex-wrap" style={{ gap: '0.5rem', marginTop: '0.25rem' }}>
              {rankInfo ? (
                <>
                  <span className="text-xs font-bold" style={{ color: tierColor }}>
                    {rankInfo.tier} {rankInfo.rank}
                  </span>
                  <span className="text-xs text-white/40">{rankInfo.leaguePoints} LP</span>
                </>
              ) : (
                <span className="text-xs text-white/40">Unranked</span>
              )}
              {participant.currentRole && participant.currentRole !== 'UNKNOWN' && (
                <>
                  <span className="text-white/20">•</span>
                  <span className="text-xs text-white/50">{participant.currentRole}</span>
                </>
              )}
            </div>

            {/* Champion Stats */}
            <div className="flex items-center flex-wrap" style={{ gap: '0.5rem', marginTop: '0.375rem' }}>
              {gamesOnChamp > 0 ? (
                <>
                  <span className={`text-xs font-semibold ${champWinrate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                    {champWinrate}% WR
                  </span>
                  <span className="text-xs text-white/40">
                    ({gamesOnChamp} game{gamesOnChamp > 1 ? 's' : ''})
                  </span>
                </>
              ) : (
                <span className="text-xs text-yellow-500/80 font-medium">
                  First time!
                </span>
              )}
              {participant.kdaOnChampion !== undefined && participant.kdaOnChampion > 0 && (
                <>
                  <span className="text-white/20">•</span>
                  <span className={`text-xs ${participant.kdaOnChampion >= 3 ? 'text-green-400' : participant.kdaOnChampion >= 2 ? 'text-white/60' : 'text-red-400'}`}>
                    {participant.kdaOnChampion} KDA
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right Side Stats */}
          <div className="flex flex-col items-end flex-shrink-0" style={{ gap: '0.375rem' }}>
            {/* Overall Winrate */}
            {rankInfo && (
              <div className="text-right">
                <div className={`text-sm font-bold ${winrate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                  {winrate}%
                </div>
                <div className="text-xs text-white/40">
                  {rankInfo.wins}W {rankInfo.losses}L
                </div>
              </div>
            )}

            {/* Recent Form + Streak */}
            <div className="flex items-center" style={{ gap: '0.375rem' }}>
              {/* Recent Form Dots */}
              {recentForm.length > 0 && (
                <div className="flex items-center" style={{ gap: '2px' }}>
                  {recentForm.slice(0, 5).map((win, i) => (
                    <div
                      key={i}
                      className="rounded-full"
                      style={{
                        width: '6px',
                        height: '6px',
                        backgroundColor: win ? '#22c55e' : '#ef4444',
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Streak */}
              {streak !== 0 && (
                <div
                  className={`flex items-center text-xs font-bold rounded px-1.5 py-0.5 ${
                    streak > 0
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                  style={{ gap: '0.125rem' }}
                >
                  {streak > 0 ? (
                    <>
                      <TrendingUp className="w-3 h-3" />
                      {streak}W
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-3 h-3" />
                      {Math.abs(streak)}L
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTeam = (team: Participant[], teamName: string, teamColor: string, borderColor: string) => {
    const avgRank = calculateTeamAvgRank(team);
    const avgWinrate = calculateTeamWinrate(team);
    const autofillCount = team.filter(p => p.isAutofill).length;
    const loseStreakCount = team.filter(p => (p.currentStreak || 0) < -2).length;
    const firstTimeCount = team.filter(p => (p.gamesOnChampion || 0) === 0).length;

    return (
      <div className="flex-1">
        {/* Team Header */}
        <div
          className="flex items-center justify-between rounded-t-xl border-b"
          style={{
            padding: '1rem',
            background: `linear-gradient(135deg, ${teamColor}15 0%, ${teamColor}05 100%)`,
            borderColor: `${borderColor}30`,
          }}
        >
          <div className="flex items-center" style={{ gap: '0.75rem' }}>
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: teamColor }}
            />
            <span className="font-bold text-white">{teamName}</span>
            {/* Warning badges */}
            <div className="flex items-center" style={{ gap: '0.375rem' }}>
              {autofillCount > 0 && (
                <span className="text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded font-bold">
                  {autofillCount} AF
                </span>
              )}
              {firstTimeCount > 0 && (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-bold">
                  {firstTimeCount} 1st
                </span>
              )}
              {loseStreakCount > 0 && (
                <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold">
                  {loseStreakCount} tilt
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center" style={{ gap: '1rem' }}>
            <div className="text-right">
              <div className="text-xs text-white/50">Avg Rank</div>
              <div className="text-sm font-bold" style={{ color: getTierColor(avgRank) }}>
                {avgRank}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/50">Avg WR</div>
              <div className={`text-sm font-bold ${avgWinrate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                {avgWinrate}%
              </div>
            </div>
          </div>
        </div>

        {/* Team Players */}
        <div
          className="rounded-b-xl border border-t-0"
          style={{
            padding: '0.75rem',
            borderColor: `${borderColor}20`,
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {team.map(participant => renderParticipant(participant, participant.puuid === puuid))}
          </div>
        </div>
      </div>
    );
  };

  // Not in game state
  if (!loading && !inGame) {
    return (
      <div className="glass-card" style={{ padding: '3rem' }}>
        <div className="flex flex-col items-center text-center" style={{ gap: '1.5rem' }}>
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Radio className="w-10 h-10 text-white/30" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-white" style={{ marginBottom: '0.5rem' }}>
              Not Currently In Game
            </h3>
            <p className="text-sm text-white/50">
              Start a match and come back here to see live stats for all players
            </p>
          </div>

          <button
            onClick={fetchLiveGame}
            disabled={loading}
            className="flex items-center rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105"
            style={{
              padding: '0.875rem 1.5rem',
              gap: '0.5rem',
              background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2) 0%, rgba(0, 102, 255, 0.2) 100%)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
            }}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Check Again
          </button>

          {lastCheck && (
            <p className="text-xs text-white/30">
              Last checked: {lastCheck.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && !gameData) {
    return (
      <div className="glass-card" style={{ padding: '3rem' }}>
        <div className="flex flex-col items-center text-center" style={{ gap: '1.5rem' }}>
          <div className="relative">
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
              }}
            >
              <Radio className="w-10 h-10 text-green-400 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-white" style={{ marginBottom: '0.5rem' }}>
              Checking Game Status...
            </h3>
            <p className="text-sm text-white/50">
              Looking for an active game
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="glass-card" style={{ padding: '3rem' }}>
        <div className="flex flex-col items-center text-center" style={{ gap: '1.5rem' }}>
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-white" style={{ marginBottom: '0.5rem' }}>
              Error Checking Game
            </h3>
            <p className="text-sm text-red-400">{error}</p>
          </div>

          <button
            onClick={fetchLiveGame}
            className="flex items-center rounded-xl font-semibold text-white transition-all duration-300"
            style={{
              padding: '0.875rem 1.5rem',
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // In game state
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Game Info Header */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div className="flex items-center justify-between flex-wrap" style={{ gap: '1rem' }}>
          <div className="flex items-center" style={{ gap: '1rem' }}>
            <div
              className="rounded-xl flex items-center justify-center"
              style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
              }}
            >
              <Radio className="w-7 h-7 text-green-400" />
            </div>
            <div>
              <div className="flex items-center" style={{ gap: '0.5rem' }}>
                <h3 className="text-lg font-bold text-white">
                  {QUEUE_NAMES[gameData?.gameQueueConfigId || 0] || gameData?.gameMode || 'Custom Game'}
                </h3>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold animate-pulse">
                  LIVE
                </span>
              </div>
              <p className="text-sm text-white/50">
                {gameName}#{tagLine} is currently in game
              </p>
            </div>
          </div>

          <div className="flex items-center" style={{ gap: '1.5rem' }}>
            {/* Game Time */}
            <div className="text-center">
              <div className="flex items-center" style={{ gap: '0.5rem' }}>
                <Clock className="w-4 h-4 text-white/50" />
                <span className="text-2xl font-bold text-white font-mono">
                  {formatGameTime(gameTime)}
                </span>
              </div>
              <span className="text-xs text-white/40">Game Time</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchLiveGame}
              disabled={loading}
              className="rounded-xl transition-all duration-300 hover:bg-white/10"
              style={{
                padding: '0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-white/70 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Teams */}
      <div className="flex flex-col lg:flex-row" style={{ gap: '1.5rem' }}>
        {renderTeam(blueTeam, 'Blue Team', '#3b82f6', '#3b82f6')}

        {/* VS Divider */}
        <div className="hidden lg:flex items-center justify-center" style={{ width: '60px' }}>
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <Swords className="w-6 h-6 text-white/60" />
          </div>
        </div>

        {renderTeam(redTeam, 'Red Team', '#ef4444', '#ef4444')}
      </div>

      {/* Banned Champions */}
      {gameData?.bannedChampions && gameData.bannedChampions.length > 0 && (
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h4 className="text-sm font-bold text-white/70 uppercase tracking-wider" style={{ marginBottom: '1rem' }}>
            Banned Champions
          </h4>
          <div className="flex items-center justify-center flex-wrap" style={{ gap: '1rem' }}>
            {/* Blue Team Bans */}
            <div className="flex items-center" style={{ gap: '0.5rem' }}>
              {gameData.bannedChampions
                .filter(b => b.teamId === 100 && b.championId !== -1)
                .map((ban, i) => (
                  <div key={i} className="relative">
                    <img
                      src={getChampionImageUrl(ban.championId)}
                      alt="Banned"
                      className="rounded-lg opacity-50 grayscale"
                      style={{ width: '36px', height: '36px' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-red-500 rotate-45" />
                    </div>
                  </div>
                ))}
            </div>

            <div className="w-px h-8 bg-white/10" />

            {/* Red Team Bans */}
            <div className="flex items-center" style={{ gap: '0.5rem' }}>
              {gameData.bannedChampions
                .filter(b => b.teamId === 200 && b.championId !== -1)
                .map((ban, i) => (
                  <div key={i} className="relative">
                    <img
                      src={getChampionImageUrl(ban.championId)}
                      alt="Banned"
                      className="rounded-lg opacity-50 grayscale"
                      style={{ width: '36px', height: '36px' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-red-500 rotate-45" />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
