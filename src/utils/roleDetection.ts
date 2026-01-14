/**
 * Détection intelligente du rôle d'un joueur dans un match
 * Basé sur la position dans l'équipe et le champion
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
 * Détecte le rôle réel d'un joueur en analysant sa position dans l'équipe
 * et ses stats par rapport aux coéquipiers
 */
export function detectPlayerRole(
  player: TeamParticipant,
  teammates: TeamParticipant[]
): PlayerData['role'] {
  const allPlayers = [player, ...teammates];

  // Si on a les participantIds, on peut utiliser la position (1-5 = team, 6-10 = enemy team)
  if (player.participantId) {
    const teamStartId = player.participantId <= 5 ? 1 : 6;
    const positionInTeam = player.participantId - teamStartId;

    // Les positions suivent généralement: TOP, JUNGLE, MID, ADC, SUPPORT
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

  // Sinon, on utilise une détection basée sur les stats
  return detectRoleByStats(player, allPlayers);
}

/**
 * Détecte le rôle basé sur les statistiques du joueur
 */
function detectRoleByStats(
  player: TeamParticipant,
  allPlayers: TeamParticipant[]
): PlayerData['role'] {
  const cs = (player.totalMinionsKilled || 0);
  const neutralCs = (player.neutralMinionsKilled || 0);
  const visionScore = player.visionScore || 0;

  // Trier les joueurs par CS
  const playersByCsRank = allPlayers
    .map(p => ({
      player: p,
      cs: (p.totalMinionsKilled || 0),
      neutralCs: (p.neutralMinionsKilled || 0),
    }))
    .sort((a, b) => b.cs - a.cs);

  const playerCsRank = playersByCsRank.findIndex(p => p.player === player);

  // Jungle: Beaucoup de neutral minions, CS moyen-faible
  if (neutralCs > 50 && neutralCs > cs * 0.4) {
    return 'JUNGLE';
  }

  // Support: Faible CS, vision score élevé
  if (cs < 50 && visionScore > 30) {
    return 'SUPPORT';
  }

  // ADC/MID/TOP: Tous ont beaucoup de CS, on utilise le champion pour départager
  const championRole = inferRoleFromChampion(player.championName);

  // Si le joueur a beaucoup de CS et que le champion match, on garde le rôle du champion
  if (cs > 100) {
    return championRole;
  }

  // Sinon on utilise le rang de CS comme indicateur
  if (playerCsRank === 0) {
    // Le plus de CS -> probablement MID ou ADC
    return championRole === 'ADC' || championRole === 'MID' ? championRole : 'MID';
  }

  if (playerCsRank === 1) {
    // Deuxième plus de CS -> TOP ou MID/ADC
    return championRole === 'TOP' || championRole === 'MID' || championRole === 'ADC'
      ? championRole
      : 'TOP';
  }

  // Fallback sur le champion
  return championRole;
}

/**
 * Inférence du rôle basé sur le champion (fallback)
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
 * Détecte si un joueur est en autofill (pas sur son rôle principal)
 * En se basant sur son historique de matchs
 */
export function isPlayerAutofilled(
  currentRole: PlayerData['role'],
  recentMatchRoles: PlayerData['role'][]
): boolean {
  if (recentMatchRoles.length === 0) return false;

  // Compter les fois où le joueur a joué chaque rôle
  const roleCounts: { [key: string]: number } = {};
  recentMatchRoles.forEach(role => {
    roleCounts[role] = (roleCounts[role] || 0) + 1;
  });

  // Trouver le rôle le plus joué
  const mainRole = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0][0];

  // Si le rôle actuel est différent du rôle le plus joué et qu'il a joué au moins 5 games sur son main role
  return currentRole !== mainRole && roleCounts[mainRole] >= 5;
}
