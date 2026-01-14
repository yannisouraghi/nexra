/**
 * WIN PROBABILITY CALCULATOR
 * Algorithme déterministe pour calculer la probabilité de victoire d'une équipe
 * Basé sur des scores pondérés et des facteurs contextuels
 */

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface PlayerData {
  // Identité
  summonerName: string;
  role: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';

  // Rank & MMR
  tier: 'IRON' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'EMERALD' | 'DIAMOND' | 'MASTER' | 'GRANDMASTER' | 'CHALLENGER' | 'UNRANKED';
  division: 'I' | 'II' | 'III' | 'IV' | null;
  leaguePoints: number;

  // Champion
  championName: string;
  championMastery: number; // Niveau 0-7
  gamesOnChampion: number;
  winrateOnChampion: number; // 0-100
  kdaOnChampion: number;

  // Performance globale
  globalWinrate: number; // 0-100
  totalGames: number;

  // Contexte
  isMainRole: boolean; // true si c'est son rôle principal
  isAutofill: boolean; // true si autofill

  // Performance récente (optionnel)
  recentWins?: number; // Sur les 5-10 dernières games
  recentGames?: number;
  currentStreak?: number; // Positif = win streak, négatif = lose streak
  daysSinceLastGame?: number;
}

export interface TeamData {
  players: PlayerData[];

  // Données d'équipe (optionnel - calculé automatiquement si non fourni)
  averageElo?: number;
  teamSynergy?: number; // 0-100
  earlyGamePower?: number; // 0-100
  lateGamePower?: number; // 0-100
  adApBalance?: number; // 0-100 (50 = parfait équilibre)
}

export interface WinProbabilityResult {
  winProbability: number; // 0-100
  teamScore: number;
  opponentScore: number;
  breakdown: {
    playerScores: number[];
    teamBonuses: number;
    compositionScore: number;
    synergy: number;
  };
  confidence: 'LOW' | 'MEDIUM' | 'HIGH'; // Basé sur la quantité de données
}

// ==========================================
// CONFIGURATION DES POIDS (AJUSTABLES)
// ==========================================

export const WEIGHTS = {
  // PlayerScore components (total = 100)
  ELO_WEIGHT: 35,
  CHAMPION_MASTERY_WEIGHT: 20,
  RECENT_PERFORMANCE_WEIGHT: 15,
  ROLE_FIT_WEIGHT: 15,
  ACTIVITY_WEIGHT: 10,
  STREAK_WEIGHT: 5,

  // Role importance multipliers
  ROLE_MULTIPLIERS: {
    'JUNGLE': 1.15,    // Jungle a le plus d'impact
    'SUPPORT': 1.10,   // Support crucial pour la vision/engage
    'MID': 1.05,       // Mid contrôle la map
    'ADC': 1.00,       // Baseline
    'TOP': 0.95,       // Impact un peu plus faible early
  },

  // Team bonuses
  TEAM_SYNERGY_BONUS: 10,
  COMPOSITION_BONUS: 8,

  // Pénalités
  AUTOFILL_PENALTY: 15,
  OFF_ROLE_PENALTY: 10,
  INACTIVITY_PENALTY_PER_DAY: 0.5, // Max 7 jours

  // Bonus
  WIN_STREAK_BONUS_PER_WIN: 1, // Max 5
  MASTERY_7_BONUS: 3,
  HIGH_GAMES_BONUS: 2, // Si 50+ games sur champion
};

// ==========================================
// CONVERSION ELO → SCORE
// ==========================================

const ELO_VALUES: { [key: string]: number } = {
  'IRON': 400,
  'BRONZE': 700,
  'SILVER': 1000,
  'GOLD': 1300,
  'PLATINUM': 1600,
  'EMERALD': 1900,
  'DIAMOND': 2200,
  'MASTER': 2500,
  'GRANDMASTER': 2800,
  'CHALLENGER': 3100,
  'UNRANKED': 1000, // Considéré comme Silver par défaut
};

const DIVISION_VALUES: { [key: string]: number } = {
  'IV': 0,
  'III': 75,
  'II': 150,
  'I': 225,
};

function getPlayerElo(player: PlayerData): number {
  const baseElo = ELO_VALUES[player.tier] || 1000;
  const divisionBonus = player.division ? DIVISION_VALUES[player.division] : 0;
  const lpBonus = player.leaguePoints || 0;

  // Master+ n'a pas de divisions
  if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(player.tier)) {
    return baseElo + lpBonus;
  }

  return baseElo + divisionBonus + lpBonus;
}

// Normaliser l'ELO en score 0-35
function normalizeEloScore(elo: number): number {
  // ELO range: 400 (Iron IV) → 3500 (Challenger high LP)
  const minElo = 400;
  const maxElo = 3500;
  const normalized = (elo - minElo) / (maxElo - minElo);
  return Math.max(0, Math.min(WEIGHTS.ELO_WEIGHT, normalized * WEIGHTS.ELO_WEIGHT));
}

// ==========================================
// CALCUL DU PLAYER SCORE (0-100)
// ==========================================

function calculatePlayerScore(player: PlayerData): number {
  let score = 0;

  // 1. ELO SCORE (0-35)
  const elo = getPlayerElo(player);
  score += normalizeEloScore(elo);

  // 2. CHAMPION MASTERY (0-20)
  let masteryScore = 0;

  // Base mastery (niveau)
  masteryScore += (player.championMastery / 7) * 12;

  // Winrate sur champion
  if (player.gamesOnChampion >= 5) {
    masteryScore += (player.winrateOnChampion / 100) * 5;
  }

  // KDA bonus
  if (player.kdaOnChampion >= 3) {
    masteryScore += 2;
  } else if (player.kdaOnChampion >= 2) {
    masteryScore += 1;
  }

  // Bonus si beaucoup de games
  if (player.gamesOnChampion >= 50) {
    masteryScore += WEIGHTS.HIGH_GAMES_BONUS;
  }

  // Bonus mastery 7
  if (player.championMastery === 7) {
    masteryScore += WEIGHTS.MASTERY_7_BONUS;
  }

  score += Math.min(WEIGHTS.CHAMPION_MASTERY_WEIGHT, masteryScore);

  // 3. RECENT PERFORMANCE (0-15)
  let recentScore = 0;
  if (player.recentGames && player.recentGames > 0 && player.recentWins !== undefined) {
    const recentWinrate = (player.recentWins / player.recentGames) * 100;
    recentScore = (recentWinrate / 100) * WEIGHTS.RECENT_PERFORMANCE_WEIGHT;
  } else {
    // Si pas de données récentes, utiliser le winrate global
    recentScore = (player.globalWinrate / 100) * WEIGHTS.RECENT_PERFORMANCE_WEIGHT;
  }
  score += recentScore;

  // 4. ROLE FIT (0-15)
  let roleFitScore = WEIGHTS.ROLE_FIT_WEIGHT;
  if (player.isAutofill) {
    roleFitScore -= WEIGHTS.AUTOFILL_PENALTY;
  } else if (!player.isMainRole) {
    roleFitScore -= WEIGHTS.OFF_ROLE_PENALTY;
  }
  score += Math.max(0, roleFitScore);

  // 5. ACTIVITY (0-10)
  let activityScore = WEIGHTS.ACTIVITY_WEIGHT;
  if (player.daysSinceLastGame !== undefined) {
    const inactivityPenalty = Math.min(
      player.daysSinceLastGame * WEIGHTS.INACTIVITY_PENALTY_PER_DAY,
      7 * WEIGHTS.INACTIVITY_PENALTY_PER_DAY // Max 3.5 de pénalité
    );
    activityScore -= inactivityPenalty;
  }
  score += Math.max(0, activityScore);

  // 6. STREAK (0-5)
  let streakScore = 0;
  if (player.currentStreak !== undefined) {
    if (player.currentStreak > 0) {
      streakScore = Math.min(
        player.currentStreak * WEIGHTS.WIN_STREAK_BONUS_PER_WIN,
        WEIGHTS.STREAK_WEIGHT
      );
    } else if (player.currentStreak < 0) {
      // Pénalité de lose streak (moins impactante)
      streakScore = Math.max(
        player.currentStreak * (WEIGHTS.WIN_STREAK_BONUS_PER_WIN * 0.5),
        -WEIGHTS.STREAK_WEIGHT * 0.5
      );
    }
  }
  score += streakScore;

  return Math.max(0, Math.min(100, score));
}

// ==========================================
// CALCUL DU TEAM SCORE
// ==========================================

function calculateTeamScore(team: TeamData): { score: number; breakdown: any } {
  const playerScores = team.players.map(player => {
    const baseScore = calculatePlayerScore(player);
    const roleMultiplier = WEIGHTS.ROLE_MULTIPLIERS[player.role] || 1.0;
    return baseScore * roleMultiplier;
  });

  // Score de base = moyenne pondérée des joueurs
  const baseTeamScore = playerScores.reduce((sum, score) => sum + score, 0) / team.players.length;

  // BONUS DE SYNERGIE (0-10)
  let synergyBonus = 0;
  if (team.teamSynergy !== undefined) {
    synergyBonus = (team.teamSynergy / 100) * WEIGHTS.TEAM_SYNERGY_BONUS;
  } else {
    // Calcul automatique basique
    // Moins d'autofill = meilleure synergie
    const autofillCount = team.players.filter(p => p.isAutofill).length;
    synergyBonus = WEIGHTS.TEAM_SYNERGY_BONUS * (1 - (autofillCount / 5));
  }

  // BONUS DE COMPOSITION (0-8)
  let compositionBonus = 0;

  // Balance AD/AP
  if (team.adApBalance !== undefined) {
    const balanceDeviation = Math.abs(50 - team.adApBalance);
    compositionBonus += (1 - balanceDeviation / 50) * 3; // Max 3 points
  }

  // Early/Late game balance
  if (team.earlyGamePower !== undefined && team.lateGamePower !== undefined) {
    const avgPower = (team.earlyGamePower + team.lateGamePower) / 2;
    compositionBonus += (avgPower / 100) * 5; // Max 5 points
  }

  const totalScore = baseTeamScore + synergyBonus + compositionBonus;

  return {
    score: totalScore,
    breakdown: {
      playerScores,
      teamBonuses: synergyBonus,
      compositionScore: compositionBonus,
      synergy: synergyBonus,
    },
  };
}

// ==========================================
// CONVERSION EN PROBABILITÉ (SIGMOÏDE)
// ==========================================

function calculateWinProbability(teamScore: number, opponentScore: number): number {
  const scoreDiff = teamScore - opponentScore;

  // Fonction sigmoïde : P = 1 / (1 + e^(-k*diff))
  // k contrôle la "sensibilité" de la courbe
  const k = 0.1; // Ajustable : plus k est grand, plus la courbe est raide

  const probability = 1 / (1 + Math.exp(-k * scoreDiff));

  // Convertir en pourcentage et limiter entre 5% et 95%
  // (on ne donne jamais 0% ou 100% pour rester réaliste)
  const percentage = Math.max(5, Math.min(95, probability * 100));

  return Math.round(percentage);
}

// ==========================================
// CALCUL DE LA CONFIANCE
// ==========================================

function calculateConfidence(team: TeamData): 'LOW' | 'MEDIUM' | 'HIGH' {
  let dataPoints = 0;

  team.players.forEach(player => {
    // Vérifier la quantité de données disponibles
    if (player.gamesOnChampion >= 20) dataPoints += 2;
    else if (player.gamesOnChampion >= 5) dataPoints += 1;

    if (player.totalGames >= 50) dataPoints += 1;
    if (player.recentGames !== undefined && player.recentGames >= 5) dataPoints += 1;
    if (player.tier !== 'UNRANKED') dataPoints += 1;
  });

  const maxDataPoints = team.players.length * 5;
  const confidence = dataPoints / maxDataPoints;

  if (confidence >= 0.7) return 'HIGH';
  if (confidence >= 0.4) return 'MEDIUM';
  return 'LOW';
}

// ==========================================
// FONCTION PRINCIPALE EXPORTÉE
// ==========================================

export function calculateMatchWinProbability(
  yourTeam: TeamData,
  opponentTeam: TeamData
): WinProbabilityResult {
  // Calculer les scores des deux équipes
  const yourTeamResult = calculateTeamScore(yourTeam);
  const opponentTeamResult = calculateTeamScore(opponentTeam);

  // Calculer la probabilité
  const winProbability = calculateWinProbability(
    yourTeamResult.score,
    opponentTeamResult.score
  );

  // Calculer la confiance
  const confidence = calculateConfidence(yourTeam);

  return {
    winProbability,
    teamScore: yourTeamResult.score,
    opponentScore: opponentTeamResult.score,
    breakdown: yourTeamResult.breakdown,
    confidence,
  };
}

// ==========================================
// FONCTION HELPER POUR L'UI
// ==========================================

export function getWinProbabilityColor(probability: number): string {
  if (probability >= 65) return '#10b981'; // Vert (high chance)
  if (probability >= 55) return '#3b82f6'; // Bleu (good chance)
  if (probability >= 45) return '#eab308'; // Jaune (balanced)
  if (probability >= 35) return '#f97316'; // Orange (low chance)
  return '#ef4444'; // Rouge (very low chance)
}

export function getWinProbabilityLabel(probability: number): string {
  if (probability >= 65) return 'Très favorable';
  if (probability >= 55) return 'Favorable';
  if (probability >= 45) return 'Équilibré';
  if (probability >= 35) return 'Défavorable';
  return 'Très défavorable';
}
