/**
 * Intelligent role detection for a player in a match
 * Based on team position and champion
 */

import { PlayerData } from './winProbabilityCalculator';

interface TeamParticipant {
  championName: string;
  summonerName: string;
  totalMinionsKilled?: number;
  neutralMinionsKilled?: number;
  visionScore?: number;
  participantId?: number;
}

/**
 * Detects the actual role of a player by analyzing their position in the team
 * and their stats compared to teammates
 */
export function detectPlayerRole(
  player: TeamParticipant,
  teammates: TeamParticipant[]
): PlayerData['role'] {
  const allPlayers = [player, ...teammates];

  // If we have participantIds, we can use the position (1-5 = team, 6-10 = enemy team)
  if (player.participantId) {
    const teamStartId = player.participantId <= 5 ? 1 : 6;
    const positionInTeam = player.participantId - teamStartId;

    // Positions generally follow: TOP, JUNGLE, MID, ADC, SUPPORT
    switch (positionInTeam) {
      case 0:
        return 'TOP';
      case 1:
        return 'JUNGLE';
      case 2:
        return 'MID';
      case 3:
        return 'ADC';
      case 4:
        return 'SUPPORT';
    }
  }

  // Otherwise, use stats-based detection
  return detectRoleByStats(player, allPlayers);
}

/**
 * Detects role based on player statistics
 */
function detectRoleByStats(
  player: TeamParticipant,
  allPlayers: TeamParticipant[]
): PlayerData['role'] {
  const cs = (player.totalMinionsKilled || 0);
  const neutralCs = (player.neutralMinionsKilled || 0);
  const visionScore = player.visionScore || 0;

  // Sort players by CS
  const playersByCsRank = allPlayers
    .map(p => ({
      player: p,
      cs: (p.totalMinionsKilled || 0),
      neutralCs: (p.neutralMinionsKilled || 0),
    }))
    .sort((a, b) => b.cs - a.cs);

  const playerCsRank = playersByCsRank.findIndex(p => p.player === player);

  // Jungle: High neutral minions, low-medium CS
  if (neutralCs > 50 && neutralCs > cs * 0.4) {
    return 'JUNGLE';
  }

  // Support: Low CS, high vision score
  if (cs < 50 && visionScore > 30) {
    return 'SUPPORT';
  }

  // ADC/MID/TOP: All have high CS, use champion to differentiate
  const championRole = inferRoleFromChampion(player.championName);

  // If player has high CS and champion matches, keep champion role
  if (cs > 100) {
    return championRole;
  }

  // Otherwise use CS rank as indicator
  if (playerCsRank === 0) {
    // Highest CS -> probably MID or ADC
    return championRole === 'ADC' || championRole === 'MID' ? championRole : 'MID';
  }

  if (playerCsRank === 1) {
    // Second highest CS -> TOP or MID/ADC
    return championRole === 'TOP' || championRole === 'MID' || championRole === 'ADC'
      ? championRole
      : 'TOP';
  }

  // Fallback to champion
  return championRole;
}

/**
 * Role inference based on champion (fallback)
 */
function inferRoleFromChampion(championName: string): PlayerData['role'] {
  const roleMap: { [key: string]: PlayerData['role'] } = {
    // Top laners
    'Aatrox': 'TOP', 'Darius': 'TOP', 'Garen': 'TOP', 'Fiora': 'TOP', 'Camille': 'TOP',
    'Sett': 'TOP', 'Mordekaiser': 'TOP', 'Malphite': 'TOP', 'Shen': 'TOP', 'Ornn': 'TOP',
    'Gwen': 'TOP', 'Jax': 'TOP', 'Illaoi': 'TOP', 'Nasus': 'TOP', 'Renekton': 'TOP',
    'Riven': 'TOP', 'Irelia': 'TOP', 'Gangplank': 'TOP', 'Teemo': 'TOP', 'Yorick': 'TOP',
    'Tryndamere': 'TOP', 'Volibear': 'TOP', 'Singed': 'TOP', 'Kled': 'TOP', 'Urgot': 'TOP',

    // Junglers
    'LeeSin': 'JUNGLE', 'Elise': 'JUNGLE', 'KhaZix': 'JUNGLE', 'Kindred': 'JUNGLE',
    'Graves': 'JUNGLE', 'Ekko': 'JUNGLE', 'Nidalee': 'JUNGLE', 'Sejuani': 'JUNGLE',
    'Amumu': 'JUNGLE', 'Udyr': 'JUNGLE', 'Warwick': 'JUNGLE', 'Shaco': 'JUNGLE',
    'Viego': 'JUNGLE', 'Belveth': 'JUNGLE', 'Briar': 'JUNGLE', 'Hecarim': 'JUNGLE',
    'Jarvan IV': 'JUNGLE', 'Nocturne': 'JUNGLE', 'Master Yi': 'JUNGLE', 'Rengar': 'JUNGLE',
    'Evelynn': 'JUNGLE', 'Kayn': 'JUNGLE', 'Fiddlesticks': 'JUNGLE', 'Zac': 'JUNGLE',

    // Mid laners
    'Ahri': 'MID', 'Zed': 'MID', 'Yasuo': 'MID', 'Katarina': 'MID', 'Syndra': 'MID',
    'Orianna': 'MID', 'LeBlanc': 'MID', 'Viktor': 'MID', 'Azir': 'MID', 'Sylas': 'MID',
    'Akali': 'MID', 'Yone': 'MID', 'Vex': 'MID', 'Aurora': 'MID', 'Cassiopeia': 'MID',
    'Lux': 'MID', 'Twisted Fate': 'MID', 'Ryze': 'MID', 'Anivia': 'MID', 'Fizz': 'MID',
    'Talon': 'MID', 'Diana': 'MID', 'Galio': 'MID', 'Malzahar': 'MID', 'Veigar': 'MID',

    // ADC
    'Jinx': 'ADC', 'Caitlyn': 'ADC', 'Vayne': 'ADC', 'Ezreal': 'ADC', 'Jhin': 'ADC',
    'Ashe': 'ADC', 'Lucian': 'ADC', 'Tristana': 'ADC', 'KaiSa': 'ADC', 'Xayah': 'ADC',
    'Aphelios': 'ADC', 'Samira': 'ADC', 'Zeri': 'ADC', 'Nilah': 'ADC', 'Smolder': 'ADC',
    'Miss Fortune': 'ADC', 'Draven': 'ADC', 'Twitch': 'ADC', 'Kog\'Maw': 'ADC', 'Sivir': 'ADC',
    'Kalista': 'ADC', 'Varus': 'ADC',

    // Support
    'Thresh': 'SUPPORT', 'Blitzcrank': 'SUPPORT', 'Leona': 'SUPPORT', 'Lulu': 'SUPPORT',
    'Janna': 'SUPPORT', 'Soraka': 'SUPPORT', 'Nami': 'SUPPORT', 'Braum': 'SUPPORT',
    'Rakan': 'SUPPORT', 'Yuumi': 'SUPPORT', 'Nautilus': 'SUPPORT', 'Pyke': 'SUPPORT',
    'Senna': 'SUPPORT', 'Milio': 'SUPPORT', 'Renata Glasc': 'SUPPORT', 'Alistar': 'SUPPORT',
    'Bard': 'SUPPORT', 'Morgana': 'SUPPORT', 'Sona': 'SUPPORT', 'Karma': 'SUPPORT',
    'Zilean': 'SUPPORT', 'Taric': 'SUPPORT', 'Rell': 'SUPPORT',
  };

  return roleMap[championName] || 'MID';
}

/**
 * Detects if a player is autofilled (not on their main role)
 * Based on their match history
 */
export function isPlayerAutofilled(
  currentRole: PlayerData['role'],
  recentMatchRoles: PlayerData['role'][]
): boolean {
  if (recentMatchRoles.length === 0) return false;

  // Count how many times the player played each role
  const roleCounts: { [key: string]: number } = {};
  recentMatchRoles.forEach(role => {
    roleCounts[role] = (roleCounts[role] || 0) + 1;
  });

  // Find the most played role
  const mainRole = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0][0];

  // If current role is different from most played role and they have at least 5 games on main role
  return currentRole !== mainRole && roleCounts[mainRole] >= 5;
}
