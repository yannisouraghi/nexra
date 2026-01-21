/**
 * MATCH DATA ADAPTER
 * Transforms raw match data into the format expected by the probability calculator
 */

import { PlayerData, TeamData } from './winProbabilityCalculator';

// ==========================================
// TYPES FOR EXISTING DATA
// ==========================================

interface RawParticipant {
  championName: string;
  summonerName: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  totalDamageDealtToChampions?: number;
  goldEarned?: number;
  totalMinionsKilled?: number;
  neutralMinionsKilled?: number;
  visionScore?: number;
  champLevel?: number;
  rank?: number;
  tier?: string;
  division?: string;
}

interface RawMatch {
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
  teammates?: RawParticipant[];
  enemies?: RawParticipant[];
  tier?: string;
  division?: string;
}

// ==========================================
// ADAPTATION FUNCTION
// ==========================================

/**
 * Adapts match data for probability calculation
 *
 * IMPORTANT: This function uses default values for missing data.
 * In a real implementation, you should:
 * 1. Enrich data via additional API calls
 * 2. Store player stats history
 * 3. Calculate actual values instead of using estimates
 */
export function adaptMatchDataForProbability(
  match: RawMatch,
  recentMatches: RawMatch[] = [],
  playerPuuid: string
): { yourTeam: TeamData; opponentTeam: TeamData } | null {
  if (!match.teammates || !match.enemies) {
    return null;
  }

  // Create main player data
  const mainPlayer = createPlayerData(
    match.champion,
    'You',
    true, // isMainRole - to be determined via API
    false, // isAutofill - to be determined via API
    match.tier || 'UNRANKED',
    match.division || null,
    0, // LP - to be fetched
    recentMatches
  );

  // Create teammates data
  const teammates = match.teammates.map(teammate =>
    createPlayerData(
      teammate.championName,
      teammate.summonerName || 'Unknown',
      true, // To be determined
      false, // To be determined
      teammate.tier || 'UNRANKED',
      teammate.division || null,
      0,
      []
    )
  );

  // Create enemies data
  const enemies = match.enemies.map(enemy =>
    createPlayerData(
      enemy.championName,
      enemy.summonerName || 'Unknown',
      true,
      false,
      enemy.tier || 'UNRANKED',
      enemy.division || null,
      0,
      []
    )
  );

  const yourTeam: TeamData = {
    players: [mainPlayer, ...teammates],
  };

  const opponentTeam: TeamData = {
    players: enemies,
  };

  return { yourTeam, opponentTeam };
}

// ==========================================
// HELPER - CREATE PLAYERDATA
// ==========================================

function createPlayerData(
  championName: string,
  summonerName: string,
  isMainRole: boolean,
  isAutofill: boolean,
  tier: string,
  division: string | null,
  leaguePoints: number,
  recentMatches: RawMatch[]
): PlayerData {
  // Determine role (simplified - to be improved with Riot API)
  const role = inferRoleFromChampion(championName);

  // Calculate recent stats
  const recentStats = calculateRecentStats(recentMatches, championName);

  // Estimate champion mastery (to be replaced with real data)
  const championMastery = estimateChampionMastery(recentMatches, championName);

  return {
    summonerName,
    role,
    tier: (tier as any) || 'UNRANKED',
    division: (division as any) || null,
    leaguePoints,
    championName,
    championMastery,
    gamesOnChampion: recentStats.gamesOnChampion,
    winrateOnChampion: recentStats.winrateOnChampion,
    kdaOnChampion: recentStats.kdaOnChampion,
    globalWinrate: recentStats.globalWinrate,
    totalGames: recentMatches.length,
    isMainRole,
    isAutofill,
    recentWins: recentStats.recentWins,
    recentGames: Math.min(10, recentMatches.length),
    currentStreak: calculateStreak(recentMatches),
    daysSinceLastGame: calculateDaysSinceLastGame(recentMatches),
  };
}

// ==========================================
// HELPERS - STATS CALCULATIONS
// ==========================================

function calculateRecentStats(matches: RawMatch[], championName: string) {
  if (matches.length === 0) {
    return {
      gamesOnChampion: 0,
      winrateOnChampion: 50,
      kdaOnChampion: 2.0,
      globalWinrate: 50,
      recentWins: 0,
    };
  }

  // Stats sur le champion spécifique
  const championMatches = matches.filter(m => m.champion === championName);
  const championWins = championMatches.filter(m => m.win).length;
  const winrateOnChampion = championMatches.length > 0
    ? (championWins / championMatches.length) * 100
    : 50;

  // KDA moyen sur le champion
  const kdaOnChampion = championMatches.length > 0
    ? championMatches.reduce((sum, m) => {
        const deaths = m.deaths || 1;
        return sum + ((m.kills + m.assists) / deaths);
      }, 0) / championMatches.length
    : 2.0;

  // Winrate global
  const totalWins = matches.filter(m => m.win).length;
  const globalWinrate = (totalWins / matches.length) * 100;

  // Stats récentes (10 dernières games)
  const recentGames = matches.slice(0, 10);
  const recentWins = recentGames.filter(m => m.win).length;

  return {
    gamesOnChampion: championMatches.length,
    winrateOnChampion: Math.round(winrateOnChampion),
    kdaOnChampion: Math.round(kdaOnChampion * 100) / 100,
    globalWinrate: Math.round(globalWinrate),
    recentWins,
  };
}

function calculateStreak(matches: RawMatch[]): number {
  if (matches.length === 0) return 0;

  let streak = 0;
  const lastResult = matches[0].win;

  for (const match of matches) {
    if (match.win === lastResult) {
      streak += lastResult ? 1 : -1;
    } else {
      break;
    }
  }

  return streak;
}

function calculateDaysSinceLastGame(matches: RawMatch[]): number {
  if (matches.length === 0) return 999;

  const lastGameTimestamp = matches[0].timestamp;
  const now = Date.now();
  const daysDiff = (now - lastGameTimestamp) / (1000 * 60 * 60 * 24);

  return Math.floor(daysDiff);
}

function estimateChampionMastery(matches: RawMatch[], championName: string): number {
  const championMatches = matches.filter(m => m.champion === championName);
  const gamesCount = championMatches.length;

  // Basic estimation based on number of games
  if (gamesCount >= 100) return 7;
  if (gamesCount >= 50) return 6;
  if (gamesCount >= 30) return 5;
  if (gamesCount >= 15) return 4;
  if (gamesCount >= 5) return 3;
  if (gamesCount >= 1) return 2;
  return 1;
}

// ==========================================
// HELPER - ROLE INFERENCE
// ==========================================

function inferRoleFromChampion(championName: string): PlayerData['role'] {
  // Simplified mapping - to be replaced with real DB or API
  const roleMap: { [key: string]: PlayerData['role'] } = {
    // Top laners
    'Aatrox': 'TOP', 'Darius': 'TOP', 'Garen': 'TOP', 'Fiora': 'TOP', 'Camille': 'TOP',
    'Sett': 'TOP', 'Mordekaiser': 'TOP', 'Malphite': 'TOP', 'Shen': 'TOP', 'Ornn': 'TOP',
    'Gwen': 'TOP', 'Jax': 'TOP', 'Illaoi': 'TOP', 'Nasus': 'TOP', 'Renekton': 'TOP',

    // Junglers
    'LeeSin': 'JUNGLE', 'Elise': 'JUNGLE', 'KhaZix': 'JUNGLE', 'Kindred': 'JUNGLE',
    'Graves': 'JUNGLE', 'Ekko': 'JUNGLE', 'Nidalee': 'JUNGLE', 'Sejuani': 'JUNGLE',
    'Amumu': 'JUNGLE', 'Udyr': 'JUNGLE', 'Warwick': 'JUNGLE', 'Shaco': 'JUNGLE',
    'Viego': 'JUNGLE', 'Belveth': 'JUNGLE', 'Briar': 'JUNGLE',

    // Mid laners
    'Ahri': 'MID', 'Zed': 'MID', 'Yasuo': 'MID', 'Katarina': 'MID', 'Syndra': 'MID',
    'Orianna': 'MID', 'LeBlanc': 'MID', 'Viktor': 'MID', 'Azir': 'MID', 'Sylas': 'MID',
    'Akali': 'MID', 'Yone': 'MID', 'Vex': 'MID', 'Aurora': 'MID',

    // ADC
    'Jinx': 'ADC', 'Caitlyn': 'ADC', 'Vayne': 'ADC', 'Ezreal': 'ADC', 'Jhin': 'ADC',
    'Ashe': 'ADC', 'Lucian': 'ADC', 'Tristana': 'ADC', 'KaiSa': 'ADC', 'Xayah': 'ADC',
    'Aphelios': 'ADC', 'Samira': 'ADC', 'Zeri': 'ADC', 'Nilah': 'ADC', 'Smolder': 'ADC',

    // Support
    'Thresh': 'SUPPORT', 'Blitzcrank': 'SUPPORT', 'Leona': 'SUPPORT', 'Lulu': 'SUPPORT',
    'Janna': 'SUPPORT', 'Soraka': 'SUPPORT', 'Nami': 'SUPPORT', 'Braum': 'SUPPORT',
    'Rakan': 'SUPPORT', 'Yuumi': 'SUPPORT', 'Nautilus': 'SUPPORT', 'Pyke': 'SUPPORT',
    'Senna': 'SUPPORT', 'Milio': 'SUPPORT', 'Renata': 'SUPPORT',
  };

  return roleMap[championName] || 'MID'; // Default to MID
}

// ==========================================
// USAGE EXAMPLE
// ==========================================

/*
INTEGRATION EXAMPLE IN MatchCard.tsx:

import { calculateMatchWinProbability } from '@/utils/winProbabilityCalculator';
import { adaptMatchDataForProbability } from '@/utils/matchDataAdapter';
import WinProbabilityBadge from '@/components/WinProbabilityBadge';

// In the MatchCard component
const matchData = adaptMatchDataForProbability(match, recentMatches, playerPuuid);

let winProbabilityResult = null;
if (matchData) {
  winProbabilityResult = calculateMatchWinProbability(
    matchData.yourTeam,
    matchData.opponentTeam
  );
}

// Display
{winProbabilityResult && (
  <WinProbabilityBadge
    probability={winProbabilityResult.winProbability}
    confidence={winProbabilityResult.confidence}
    showBar={true}
    size="medium"
  />
)}
*/
