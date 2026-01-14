'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Swords, Coins, TrendingUp, Trophy, Flame, Castle, Droplets, Star, Sparkles, Zap } from 'lucide-react';
import WinProbabilityBadge from './WinProbabilityBadge';
import { calculateMatchWinProbability, PlayerData, TeamData } from '@/utils/winProbabilityCalculator';
import { detectPlayerRole, isPlayerAutofilled } from '@/utils/roleDetection';
import { getLatestDDragonVersion, getChampionImageUrl, getItemImageUrl, getSummonerSpellImageUrl } from '@/utils/ddragon';

interface Participant {
  puuid?: string;
  championName: string;
  summonerName: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  items?: number[];
  totalDamageDealtToChampions?: number;
  goldEarned?: number;
  totalMinionsKilled?: number;
  neutralMinionsKilled?: number;
  visionScore?: number;
  champLevel?: number;
  rank?: number; // 1 = MVP, 10 = pire
  participantId?: number;
  summoner1Id?: number;
  summoner2Id?: number;
  perks?: {
    styles: Array<{
      description: string;
      selections: Array<{
        perk: number;
        var1: number;
        var2: number;
        var3: number;
      }>;
      style: number;
    }>;
  };
  totalDamageTaken?: number;
  wardsPlaced?: number;
  wardsKilled?: number;
  tier?: string; // IRON, BRONZE, SILVER, GOLD, PLATINUM, EMERALD, DIAMOND, MASTER, GRANDMASTER, CHALLENGER, UNRANKED
  division?: string; // I, II, III, IV
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
  // Détails supplémentaires pour le joueur
  puuid?: string; // PUUID du joueur principal
  participantId?: number; // ID du participant pour le joueur principal
  summonerName?: string; // Nom du joueur principal
  items?: number[];
  totalDamageDealtToChampions?: number;
  goldEarned?: number;
  totalMinionsKilled?: number;
  visionScore?: number;
  champLevel?: number;
  rank?: number; // 1 = MVP, 10 = pire
  // Nouvelles stats détaillées
  summoner1Id?: number;
  summoner2Id?: number;
  perks?: {
    styles: Array<{
      description: string;
      selections: Array<{
        perk: number;
        var1: number;
        var2: number;
        var3: number;
      }>;
      style: number;
    }>;
  };
  totalDamageTaken?: number;
  physicalDamageDealtToChampions?: number;
  magicDamageDealtToChampions?: number;
  trueDamageDealtToChampions?: number;
  totalHeal?: number;
  totalDamageShieldedOnTeammates?: number;
  damageSelfMitigated?: number;
  wardsPlaced?: number;
  wardsKilled?: number;
  detectorWardsPlaced?: number;
  doubleKills?: number;
  tripleKills?: number;
  quadraKills?: number;
  pentaKills?: number;
  largestKillingSpree?: number;
  largestMultiKill?: number;
  firstBloodKill?: boolean;
  firstBloodAssist?: boolean;
  firstTowerKill?: boolean;
  firstTowerAssist?: boolean;
  turretKills?: number;
  inhibitorKills?: number;
  damageDealtToObjectives?: number;
  damageDealtToTurrets?: number;
  timeCCingOthers?: number;
  totalTimeCCDealt?: number;
  goldSpent?: number;
  neutralMinionsKilled?: number;
  individualPosition?: string;
  teamPosition?: string;
  lane?: string;
  role?: string;
}

interface MatchCardProps {
  match: Match;
}

interface TimelineFrame {
  timestamp: number;
  players: Array<{
    participantId: number;
    totalGold: number;
    level: number;
    currentGold: number;
    xp: number;
    minionsKilled: number;
    jungleMinionsKilled: number;
  }>;
}

// Helper pour inférer le rôle depuis le champion
function inferRoleFromChampion(championName: string): PlayerData['role'] {
  const roleMap: { [key: string]: PlayerData['role'] } = {
    'Aatrox': 'TOP', 'Darius': 'TOP', 'Garen': 'TOP', 'Fiora': 'TOP', 'Camille': 'TOP', 'Sett': 'TOP', 'Mordekaiser': 'TOP', 'Malphite': 'TOP', 'Shen': 'TOP', 'Ornn': 'TOP', 'Gwen': 'TOP', 'Jax': 'TOP', 'Illaoi': 'TOP', 'Nasus': 'TOP', 'Renekton': 'TOP',
    'LeeSin': 'JUNGLE', 'Elise': 'JUNGLE', 'KhaZix': 'JUNGLE', 'Kindred': 'JUNGLE', 'Graves': 'JUNGLE', 'Ekko': 'JUNGLE', 'Nidalee': 'JUNGLE', 'Sejuani': 'JUNGLE', 'Amumu': 'JUNGLE', 'Udyr': 'JUNGLE', 'Warwick': 'JUNGLE', 'Shaco': 'JUNGLE', 'Viego': 'JUNGLE', 'Belveth': 'JUNGLE', 'Briar': 'JUNGLE',
    'Ahri': 'MID', 'Zed': 'MID', 'Yasuo': 'MID', 'Katarina': 'MID', 'Syndra': 'MID', 'Orianna': 'MID', 'LeBlanc': 'MID', 'Viktor': 'MID', 'Azir': 'MID', 'Sylas': 'MID', 'Akali': 'MID', 'Yone': 'MID', 'Vex': 'MID', 'Aurora': 'MID',
    'Jinx': 'ADC', 'Caitlyn': 'ADC', 'Vayne': 'ADC', 'Ezreal': 'ADC', 'Jhin': 'ADC', 'Ashe': 'ADC', 'Lucian': 'ADC', 'Tristana': 'ADC', 'KaiSa': 'ADC', 'Xayah': 'ADC', 'Aphelios': 'ADC', 'Samira': 'ADC', 'Zeri': 'ADC', 'Nilah': 'ADC', 'Smolder': 'ADC',
    'Thresh': 'SUPPORT', 'Blitzcrank': 'SUPPORT', 'Leona': 'SUPPORT', 'Lulu': 'SUPPORT', 'Janna': 'SUPPORT', 'Soraka': 'SUPPORT', 'Nami': 'SUPPORT', 'Braum': 'SUPPORT', 'Rakan': 'SUPPORT', 'Yuumi': 'SUPPORT', 'Nautilus': 'SUPPORT', 'Pyke': 'SUPPORT', 'Senna': 'SUPPORT', 'Milio': 'SUPPORT', 'Renata': 'SUPPORT',
  };
  return roleMap[championName] || 'MID';
}

// ==========================================
// FONCTIONS DE CALCUL DE COMPOSITION
// ==========================================

// Calcule la synergie d'équipe (0-100) basée sur l'autofill et le rôle fit
function calculateTeamSynergy(players: PlayerData[]): number {
  const autofillCount = players.filter(p => p.isAutofill).length;
  const offRoleCount = players.filter(p => !p.isMainRole && !p.isAutofill).length;

  // Base de 100, on retire des points pour chaque joueur hors rôle
  let synergy = 100;
  synergy -= autofillCount * 20; // -20 par autofill
  synergy -= offRoleCount * 10;  // -10 par off-role

  return Math.max(0, Math.min(100, synergy));
}

// Calcule l'équilibre AD/AP (0-100, 50 = parfait)
function calculateAdApBalance(players: PlayerData[]): number {
  // Champions qui font majoritairement des dégâts AP
  const apChampions = [
    'Ahri', 'Anivia', 'Annie', 'Azir', 'Brand', 'Cassiopeia', 'Diana', 'Ekko',
    'Elise', 'Evelynn', 'Fizz', 'Galio', 'Gragas', 'Heimerdinger', 'Karma',
    'Kassadin', 'Katarina', 'Kennen', 'LeBlanc', 'Lissandra', 'Lux', 'Malzahar',
    'Morgana', 'Neeko', 'Orianna', 'Rumble', 'Ryze', 'Seraphine', 'Shaco',
    'Swain', 'Syndra', 'Taliyah', 'Teemo', 'TwistedFate', 'Veigar', 'Vel\'Koz',
    'Vex', 'Viktor', 'Vladimir', 'Xerath', 'Ziggs', 'Zyra', 'Sylas', 'Lillia',
    'Gwen', 'Mordekaiser', 'Aurora', 'Twisted Fate',
  ];

  let apCount = 0;
  let adCount = 0;

  players.forEach(player => {
    if (apChampions.includes(player.championName)) {
      apCount++;
    } else {
      adCount++;
    }
  });

  // Calculer le ratio AP (0-100)
  const total = apCount + adCount;
  if (total === 0) return 50;

  const apRatio = (apCount / total) * 100;

  // L'idéal est 40-60% AP (soit 2-3 champs AP sur 5)
  // Retourner une valeur où 50 = équilibre parfait
  return apRatio;
}

// Calcule la puissance early game (0-100)
function calculateEarlyGamePower(players: PlayerData[]): number {
  // Champions forts en early game
  const earlyGameChampions = [
    // Top
    'Darius', 'Renekton', 'Pantheon', 'Olaf', 'Tryndamere', 'Riven',
    // Jungle
    'Lee Sin', 'Elise', 'Jarvan IV', 'Xin Zhao', 'Graves', 'Nidalee', 'Shaco',
    // Mid
    'LeBlanc', 'Zed', 'Talon', 'Pantheon', 'Lucian',
    // ADC
    'Draven', 'Lucian', 'Tristana', 'Kalista', 'Caitlyn',
    // Support
    'Blitzcrank', 'Thresh', 'Leona', 'Nautilus', 'Pyke', 'Rell',
  ];

  let earlyPower = 50; // Base

  players.forEach(player => {
    if (earlyGameChampions.includes(player.championName)) {
      earlyPower += 10;
    }
  });

  return Math.min(100, earlyPower);
}

// Calcule la puissance late game (0-100)
function calculateLateGamePower(players: PlayerData[]): number {
  // Champions forts en late game
  const lateGameChampions = [
    // Top
    'Fiora', 'Jax', 'Kayle', 'Nasus', 'Gangplank', 'Vladimir', 'Camille',
    // Jungle
    'Master Yi', 'Karthus', 'Kindred', 'Viego', 'Bel\'Veth',
    // Mid
    'Kassadin', 'Azir', 'Viktor', 'Veigar', 'Ryze', 'Cassiopeia', 'Orianna',
    // ADC
    'Jinx', 'Vayne', 'Kog\'Maw', 'Twitch', 'Aphelios', 'Kai\'Sa', 'Smolder',
    // Support
    'Sona', 'Yuumi', 'Senna',
  ];

  let latePower = 50; // Base

  players.forEach(player => {
    if (lateGameChampions.includes(player.championName)) {
      latePower += 10;
    }
  });

  return Math.min(100, latePower);
}

// ==========================================
// FONCTION DE CRÉATION DE PLAYERDATA
// ==========================================

// Helper pour créer PlayerData à partir des données disponibles
function createPlayerDataFromParticipant(participant: Participant, isMainPlayer: boolean = false): PlayerData {
  const kda = (participant.kills || 0) + (participant.assists || 0);
  const deaths = participant.deaths || 1;
  const kdaRatio = kda / deaths;

  return {
    summonerName: participant.summonerName || 'Unknown',
    role: inferRoleFromChampion(participant.championName),
    tier: (participant.tier as any) || 'UNRANKED',
    division: (participant.division as any) || null,
    leaguePoints: 0,
    championName: participant.championName,
    championMastery: Math.min(7, Math.floor(kdaRatio)), // Estimation basée sur KDA
    gamesOnChampion: 20, // Estimation par défaut
    winrateOnChampion: 50, // Estimation par défaut
    kdaOnChampion: kdaRatio,
    globalWinrate: 50, // Estimation par défaut
    totalGames: 100, // Estimation par défaut
    isMainRole: true, // On assume que tout le monde est sur son rôle principal
    isAutofill: false,
    recentWins: 5,
    recentGames: 10,
    currentStreak: 0,
    daysSinceLastGame: 0,
  };
}

// Calculer la probabilité de victoire pour ce match
function calculateProbabilityForMatch(match: Match): { winProbability: number; confidence: 'LOW' | 'MEDIUM' | 'HIGH'; teamScore: number; opponentScore: number; breakdown: any } | null {
  if (!match.teammates || !match.enemies || match.teammates.length === 0 || match.enemies.length === 0) {
    return null;
  }

  // Créer le joueur principal
  const mainPlayerData = createPlayerDataFromParticipant({
    championName: match.champion,
    summonerName: match.summonerName || 'You',
    kills: match.kills,
    deaths: match.deaths,
    assists: match.assists,
    tier: match.teammates[0]?.tier, // Utiliser le tier du premier coéquipier si disponible
    division: match.teammates[0]?.division,
  }, true);

  // Créer les coéquipiers
  const teammates = match.teammates.map(t => createPlayerDataFromParticipant(t));

  // Créer les ennemis
  const enemies = match.enemies.map(e => createPlayerDataFromParticipant(e));

  const yourTeam: TeamData = {
    players: [mainPlayerData, ...teammates],
  };

  const opponentTeam: TeamData = {
    players: enemies,
  };

  try {
    const result = calculateMatchWinProbability(yourTeam, opponentTeam);
    return {
      winProbability: result.winProbability,
      confidence: result.confidence,
      teamScore: result.teamScore,
      opponentScore: result.opponentScore,
      breakdown: result.breakdown,
    };
  } catch (error) {
    console.error('Error calculating win probability:', error);
    return null;
  }
}

export default function MatchCard({ match }: MatchCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'combat' | 'economy' | 'charts' | 'scoreboard' | 'probability'>('overview');
  const [chartMetric, setChartMetric] = useState<'gold' | 'cs' | 'xp' | 'level'>('gold');
  const [timeline, setTimeline] = useState<TimelineFrame[] | null>(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [probabilityResult, setProbabilityResult] = useState<{ winProbability: number; confidence: 'LOW' | 'MEDIUM' | 'HIGH'; teamScore: number; opponentScore: number; breakdown: any } | null>(null);
  const [isCalculatingProbability, setIsCalculatingProbability] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [ddragonVersion, setDdragonVersion] = useState('15.1.1');

  // Fetch latest DDragon version on mount
  useEffect(() => {
    getLatestDDragonVersion().then(version => {
      setDdragonVersion(version);
    });
  }, []);

  // Créer le joueur principal à partir des données de match
  const mainPlayer: Participant = {
    championName: match.champion,
    summonerName: match.summonerName || 'You',
    kills: match.kills,
    deaths: match.deaths,
    assists: match.assists,
    items: match.items,
    totalDamageDealtToChampions: match.totalDamageDealtToChampions,
    goldEarned: match.goldEarned,
    totalMinionsKilled: match.totalMinionsKilled,
    neutralMinionsKilled: match.neutralMinionsKilled,
    visionScore: match.visionScore,
    champLevel: match.champLevel,
    rank: match.rank,
    participantId: match.participantId,
    summoner1Id: match.summoner1Id,
    summoner2Id: match.summoner2Id,
    perks: match.perks,
    totalDamageTaken: match.totalDamageTaken,
    wardsPlaced: match.wardsPlaced,
    wardsKilled: match.wardsKilled,
  };

  // Tous les joueurs avec leur participantId - incluant le joueur principal
  const allPlayers = [
    // Le joueur principal en premier
    { ...mainPlayer, team: 'ally' as const, isMainPlayer: true },
    // Les autres coéquipiers
    ...(match.teammates || []).map(p => ({ ...p, team: 'ally' as const, isMainPlayer: false })),
    // Les ennemis
    ...(match.enemies || []).map(p => ({ ...p, team: 'enemy' as const, isMainPlayer: false }))
  ];

  // Fonction pour obtenir la couleur d'un joueur basée sur son équipe et son index
  const getPlayerColor = (participantId: number): { hex: string; border: string; bg: string } => {
    const playerIndex = allPlayers.findIndex(p => p.participantId === participantId);
    if (playerIndex === -1) return { hex: '#64748b', border: 'border-gray-500', bg: 'bg-gray-500' };

    const player = allPlayers[playerIndex];

    if (player.team === 'ally') {
      // Couleurs contrastées pour les alliés
      const allyColors = [
        { hex: '#3b82f6', border: 'border-blue-500', bg: 'bg-blue-500' },        // Bleu vif
        { hex: '#06b6d4', border: 'border-cyan-500', bg: 'bg-cyan-500' },        // Cyan
        { hex: '#8b5cf6', border: 'border-violet-500', bg: 'bg-violet-500' },    // Violet
        { hex: '#0ea5e9', border: 'border-sky-500', bg: 'bg-sky-500' },          // Sky bleu
        { hex: '#6366f1', border: 'border-indigo-500', bg: 'bg-indigo-500' }     // Indigo
      ];
      const allyIndex = allPlayers.filter((p, idx) => idx <= playerIndex && p.team === 'ally').length - 1;
      return allyColors[allyIndex % allyColors.length];
    } else {
      // Couleurs contrastées pour les ennemis
      const enemyColors = [
        { hex: '#ef4444', border: 'border-red-500', bg: 'bg-red-500' },          // Rouge vif
        { hex: '#f97316', border: 'border-orange-500', bg: 'bg-orange-500' },    // Orange
        { hex: '#eab308', border: 'border-yellow-500', bg: 'bg-yellow-500' },    // Jaune
        { hex: '#ec4899', border: 'border-pink-500', bg: 'bg-pink-500' },        // Rose
        { hex: '#f43f5e', border: 'border-rose-500', bg: 'bg-rose-500' }         // Rose foncé
      ];
      const enemyIndex = allPlayers.filter((p, idx) => idx <= playerIndex && p.team === 'enemy').length - 1;
      return enemyColors[enemyIndex % enemyColors.length];
    }
  };

  // Par défaut, sélectionner uniquement le joueur principal
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>(
    match.participantId ? [match.participantId] : []
  );

  // Charger automatiquement la timeline quand on ouvre l'onglet graphiques
  useEffect(() => {
    if (activeTab === 'charts' && !timeline && !loadingTimeline) {
      loadTimeline();
    }
  }, [activeTab]);

  const loadTimeline = async () => {
    if (timeline || loadingTimeline) return;

    setLoadingTimeline(true);
    try {
      // Extraire la région du matchId (format: REGION_matchId)
      const region = match.matchId.split('_')[0].toLowerCase();
      const response = await fetch(
        `/api/riot/match-timeline?matchId=${match.matchId}&region=${region}`
      );

      if (response.ok) {
        const data = await response.json();
        setTimeline(data.frames);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la timeline:', error);
    } finally {
      setLoadingTimeline(false);
    }
  };

  // Calculer la probabilité de victoire avec enrichissement des données
  const calculateProbability = async () => {
    if (probabilityResult || isCalculatingProbability) return;

    setIsCalculatingProbability(true);
    setLoadingProgress(0);

    try {
      // Extraire la région du matchId
      const region = match.matchId.split('_')[0].toLowerCase();

      setLoadingMessage('Preparing analysis...');
      setLoadingProgress(5);

      // Collecter tous les joueurs
      const teammates = match.teammates || [];
      const enemies = match.enemies || [];
      const totalPlayers = teammates.length + enemies.length;

      // Enrichir les données des coéquipiers
      setLoadingMessage(`Analyzing teammates (0/${teammates.length})...`);
      const enrichedTeammates: PlayerData[] = [];

      for (let i = 0; i < teammates.length; i++) {
        const teammate = teammates[i];
        setLoadingMessage(`Analyzing teammates (${i + 1}/${teammates.length})...`);
        setLoadingProgress(Math.round(10 + (i / totalPlayers) * 40));

        if (teammate.puuid) {
          try {
            const enrichResponse = await fetch('/api/riot/enrich-player', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                summonerName: teammate.summonerName,
                puuid: teammate.puuid,
                championName: teammate.championName,
                region,
                tier: teammate.tier,
                division: teammate.division,
              }),
            });

            if (enrichResponse.ok) {
              const enrichedData = await enrichResponse.json();

              // Détection intelligente du rôle avec participantId
              const detectedRole = detectPlayerRole(
                {
                  championName: teammate.championName,
                  summonerName: teammate.summonerName,
                  participantId: teammate.participantId,
                  totalMinionsKilled: teammate.totalMinionsKilled,
                  neutralMinionsKilled: teammate.neutralMinionsKilled,
                  visionScore: teammate.visionScore,
                },
                teammates.filter(t => t !== teammate).map(t => ({
                  championName: t.championName,
                  summonerName: t.summonerName,
                  participantId: t.participantId,
                  totalMinionsKilled: t.totalMinionsKilled,
                  neutralMinionsKilled: t.neutralMinionsKilled,
                  visionScore: t.visionScore,
                }))
              );

              // Détection d'autofill basée sur l'historique des rôles
              const recentRoles = enrichedData.recentRoles || [];
              const isAutofill = isPlayerAutofilled(detectedRole, recentRoles);

              // Déterminer si c'est le rôle principal
              const roleCounts: { [key: string]: number } = {};
              recentRoles.forEach((role: string) => {
                roleCounts[role] = (roleCounts[role] || 0) + 1;
              });
              const mainRole = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
              const isMainRole = !mainRole || detectedRole === mainRole;

              enrichedTeammates.push({
                summonerName: teammate.summonerName || 'Unknown',
                role: detectedRole,
                tier: (enrichedData.tier as any) || 'UNRANKED',
                division: (enrichedData.division as any) || null,
                leaguePoints: enrichedData.leaguePoints || 0,
                championName: teammate.championName,
                championMastery: enrichedData.championMastery || 0,
                gamesOnChampion: enrichedData.gamesOnChampion || 0,
                winrateOnChampion: enrichedData.winrateOnChampion || 50,
                kdaOnChampion: enrichedData.kdaOnChampion || 2.0,
                globalWinrate: enrichedData.globalWinrate || 50,
                totalGames: enrichedData.totalGames || 0,
                isMainRole,
                isAutofill,
                recentWins: enrichedData.recentWins || 0,
                recentGames: enrichedData.recentGames || 0,
                currentStreak: enrichedData.currentStreak || 0,
                daysSinceLastGame: enrichedData.daysSinceLastGame || 0,
              });
            } else {
              // Fallback sur données estimées
              enrichedTeammates.push(createPlayerDataFromParticipant(teammate));
            }
          } catch (error) {
            console.error(`Error enriching teammate ${teammate.summonerName}:`, error);
            enrichedTeammates.push(createPlayerDataFromParticipant(teammate));
          }
        } else {
          enrichedTeammates.push(createPlayerDataFromParticipant(teammate));
        }
      }

      // Enrichir les données des ennemis
      setLoadingMessage(`Analyzing opponents (0/${enemies.length})...`);
      const enrichedEnemies: PlayerData[] = [];

      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        setLoadingMessage(`Analyzing opponents (${i + 1}/${enemies.length})...`);
        setLoadingProgress(Math.round(50 + ((teammates.length + i) / totalPlayers) * 40));

        if (enemy.puuid) {
          try {
            const enrichResponse = await fetch('/api/riot/enrich-player', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                summonerName: enemy.summonerName,
                puuid: enemy.puuid,
                championName: enemy.championName,
                region,
                tier: enemy.tier,
                division: enemy.division,
              }),
            });

            if (enrichResponse.ok) {
              const enrichedData = await enrichResponse.json();

              // Détection intelligente du rôle avec participantId
              const detectedRole = detectPlayerRole(
                {
                  championName: enemy.championName,
                  summonerName: enemy.summonerName,
                  participantId: enemy.participantId,
                  totalMinionsKilled: enemy.totalMinionsKilled,
                  neutralMinionsKilled: enemy.neutralMinionsKilled,
                  visionScore: enemy.visionScore,
                },
                enemies.filter(e => e !== enemy).map(e => ({
                  championName: e.championName,
                  summonerName: e.summonerName,
                  participantId: e.participantId,
                  totalMinionsKilled: e.totalMinionsKilled,
                  neutralMinionsKilled: e.neutralMinionsKilled,
                  visionScore: e.visionScore,
                }))
              );

              // Détection d'autofill basée sur l'historique des rôles
              const recentRoles = enrichedData.recentRoles || [];
              const isAutofill = isPlayerAutofilled(detectedRole, recentRoles);

              // Déterminer si c'est le rôle principal
              const roleCounts: { [key: string]: number } = {};
              recentRoles.forEach((role: string) => {
                roleCounts[role] = (roleCounts[role] || 0) + 1;
              });
              const mainRole = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
              const isMainRole = !mainRole || detectedRole === mainRole;

              enrichedEnemies.push({
                summonerName: enemy.summonerName || 'Unknown',
                role: detectedRole,
                tier: (enrichedData.tier as any) || 'UNRANKED',
                division: (enrichedData.division as any) || null,
                leaguePoints: enrichedData.leaguePoints || 0,
                championName: enemy.championName,
                championMastery: enrichedData.championMastery || 0,
                gamesOnChampion: enrichedData.gamesOnChampion || 0,
                winrateOnChampion: enrichedData.winrateOnChampion || 50,
                kdaOnChampion: enrichedData.kdaOnChampion || 2.0,
                globalWinrate: enrichedData.globalWinrate || 50,
                totalGames: enrichedData.totalGames || 0,
                isMainRole,
                isAutofill,
                recentWins: enrichedData.recentWins || 0,
                recentGames: enrichedData.recentGames || 0,
                currentStreak: enrichedData.currentStreak || 0,
                daysSinceLastGame: enrichedData.daysSinceLastGame || 0,
              });
            } else {
              enrichedEnemies.push(createPlayerDataFromParticipant(enemy));
            }
          } catch (error) {
            console.error(`Error enriching enemy ${enemy.summonerName}:`, error);
            enrichedEnemies.push(createPlayerDataFromParticipant(enemy));
          }
        } else {
          enrichedEnemies.push(createPlayerDataFromParticipant(enemy));
        }
      }

      // Créer le joueur principal
      setLoadingMessage('Analyzing your statistics...');
      setLoadingProgress(90);

      const mainPlayerData = createPlayerDataFromParticipant({
        championName: match.champion,
        summonerName: match.summonerName || 'You',
        kills: match.kills,
        deaths: match.deaths,
        assists: match.assists,
        tier: teammates[0]?.tier,
        division: teammates[0]?.division,
      }, true);

      // Construire les équipes
      const yourTeam: TeamData = {
        players: [mainPlayerData, ...enrichedTeammates],
      };

      const opponentTeam: TeamData = {
        players: enrichedEnemies,
      };

      // Calculate composition data for both teams
      setLoadingMessage('Analyzing team composition...');
      setLoadingProgress(92);

      yourTeam.teamSynergy = calculateTeamSynergy(yourTeam.players);
      yourTeam.adApBalance = calculateAdApBalance(yourTeam.players);
      yourTeam.earlyGamePower = calculateEarlyGamePower(yourTeam.players);
      yourTeam.lateGamePower = calculateLateGamePower(yourTeam.players);

      opponentTeam.teamSynergy = calculateTeamSynergy(opponentTeam.players);
      opponentTeam.adApBalance = calculateAdApBalance(opponentTeam.players);
      opponentTeam.earlyGamePower = calculateEarlyGamePower(opponentTeam.players);
      opponentTeam.lateGamePower = calculateLateGamePower(opponentTeam.players);

      // Calculate probability
      setLoadingMessage('Calculating win probability...');
      setLoadingProgress(95);

      const result = calculateMatchWinProbability(yourTeam, opponentTeam);

      setLoadingProgress(100);
      setProbabilityResult(result);

    } catch (error) {
      console.error('Erreur lors du calcul de probabilité:', error);
      setLoadingMessage('Erreur lors du calcul');
    } finally {
      setTimeout(() => {
        setIsCalculatingProbability(false);
        setLoadingMessage('');
        setLoadingProgress(0);
      }, 300);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / 3600000);

    if (hours < 1) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}min`;
    }
    if (hours < 24) {
      return `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    return `${days}j`;
  };

  const formatGameMode = (queueId: number) => {
    const queueMap: { [key: number]: string } = {
      420: 'Ranked Solo/Duo',
      440: 'Ranked Flex',
      400: 'Normal Draft',
      430: 'Normal Blind',
      490: 'Normal',
      450: 'ARAM',
      700: 'Clash',
      900: 'URF',
      1020: 'Tous pour un',
      1300: 'Nexus Blitz',
      1400: 'Ultimate Spellbook',
      1700: 'Arena',
      1710: 'Arena',
    };
    return queueMap[queueId] || `Mode ${queueId}`;
  };

  const getGameModeColor = (queueId: number) => {
    if (queueId === 420 || queueId === 440) {
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    }
    if (queueId === 450) {
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
    if (queueId === 1700 || queueId === 1710) {
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    }
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  };

  const kda = ((match.kills + match.assists) / Math.max(1, match.deaths)).toFixed(2);
  const kdaColor = parseFloat(kda) >= 3 ? 'text-yellow-400' : parseFloat(kda) >= 2 ? 'text-green-400' : 'text-gray-400';

  // Fonction pour obtenir les styles du badge de rang
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return {
        container: 'bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 shadow-lg shadow-yellow-500/50',
        text: 'text-black font-black',
        showIcon: true,
        label: 'MVP',
        glow: true,
      };
    }
    if (rank === 2) {
      return {
        container: 'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 shadow-lg shadow-gray-400/50',
        text: 'text-gray-800 font-bold',
        showIcon: false,
        label: '#2',
        glow: false,
      };
    }
    if (rank === 3) {
      return {
        container: 'bg-gradient-to-br from-orange-400 via-orange-600 to-orange-700 shadow-lg shadow-orange-500/50',
        text: 'text-white font-bold',
        showIcon: false,
        label: '#3',
        glow: false,
      };
    }
    if (rank <= 5) {
      return {
        container: 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-md',
        text: 'text-white font-semibold',
        showIcon: false,
        label: `#${rank}`,
        glow: false,
      };
    }
    if (rank <= 7) {
      return {
        container: 'bg-gradient-to-br from-gray-600 to-gray-700 shadow-sm',
        text: 'text-gray-200 font-medium',
        showIcon: false,
        label: `#${rank}`,
        glow: false,
      };
    }
    return {
      container: 'bg-gradient-to-br from-red-600 to-red-700 shadow-sm',
      text: 'text-white font-medium',
      showIcon: false,
      label: `#${rank}`,
      glow: false,
    };
  };

  const championImageUrl = getChampionImageUrl(match.champion, ddragonVersion);

  // Helper pour obtenir le nom du sort d'invocateur
  const getSummonerSpellName = (spellId: number): string => {
    const spellMap: { [key: number]: string } = {
      1: 'SummonerBoost',        // Cleanse
      3: 'SummonerExhaust',      // Exhaust
      4: 'SummonerFlash',        // Flash
      6: 'SummonerHaste',        // Ghost
      7: 'SummonerHeal',         // Heal
      11: 'SummonerSmite',       // Smite
      12: 'SummonerTeleport',    // Teleport
      13: 'SummonerMana',        // Clarity
      14: 'SummonerDot',         // Ignite
      21: 'SummonerBarrier',     // Barrier
      30: 'SummonerPoroRecall',  // To the King!
      31: 'SummonerPoroThrow',   // Poro Toss
      32: 'SummonerSnowball',    // Mark/Dash (ARAM)
      39: 'SummonerSnowURFSnowball_Mark', // URF Snowball
      54: 'Summoner_UltBookPlaceholder',  // Placeholder
      55: 'Summoner_UltBookSmitePlaceholder', // Smite Placeholder
    };
    return spellMap[spellId] || 'SummonerFlash';
  };


  return (
    <div
      className={`match-card relative overflow-visible ${
        match.win ? 'match-card-victory' : 'match-card-defeat'
      } ${match.rank === 1 ? 'match-card-mvp' : ''}`}
      style={{ padding: '1rem 1.25rem' }}
    >

      {/* Game Mode Badge en haut à gauche */}
      <div className="absolute" style={{ top: '0.75rem', left: '1.25rem' }}>
        <div className={`text-xs font-semibold rounded-lg border backdrop-blur-sm ${getGameModeColor(match.queueId)}`} style={{ padding: '0.25rem 0.75rem' }}>
          {formatGameMode(match.queueId)}
        </div>
      </div>

      {/* Duration Badge en haut à droite */}
      <div className="absolute" style={{ top: '0.75rem', right: '1.25rem' }}>
        <div className="flex items-center text-xs font-medium rounded-lg border bg-white/5 text-[var(--text-secondary)] border-white/10 backdrop-blur-sm" style={{ gap: '0.375rem', padding: '0.25rem 0.625rem' }}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatDuration(match.gameDuration)}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '2.25rem' }}>
        <div className="flex items-center flex-wrap" style={{ gap: '2rem' }}>
          {/* Left Section - Champion & KDA */}
          <div className="flex items-center flex-shrink-0" style={{ gap: '1rem' }}>

            {/* Champion Image & Name */}
            <div className="flex items-center" style={{ gap: '0.75rem' }}>
              {/* Champion Portrait */}
              <div className="relative">
                <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/10 bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg">
                  <img
                    src={championImageUrl}
                    alt={match.champion}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback si l'image ne charge pas
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
                          <span class="text-white text-xl font-bold">${match.champion.charAt(0)}</span>
                        </div>
                      `;
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col" style={{ gap: '0.25rem' }}>
                <div className="flex items-center" style={{ gap: '0.5rem' }}>
                  <h4 className="text-lg font-bold text-white font-['Rajdhani']">{match.champion}</h4>
                  {match.rank && (() => {
                    const badge = getRankBadge(match.rank);
                    return (
                      <div className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full ${badge.container} ${badge.text} ${badge.glow ? 'rank-mvp-shimmer glow-mvp' : ''} shadow-lg`}>
                        {badge.showIcon && (
                          <svg className="w-3.5 h-3.5 relative z-10" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                          </svg>
                        )}
                        <span className="text-[11px] relative z-10 font-black tracking-tight">{badge.label}</span>
                      </div>
                    );
                  })()}
                </div>
                <span className="text-xs text-[var(--text-tertiary)]">{formatTimestamp(match.timestamp)}</span>
              </div>
            </div>

            {/* KDA Stats */}
            <div className="flex items-center border-l border-white/10" style={{ gap: '1rem', paddingLeft: '1rem' }}>
              <div className="text-center">
                <div className="text-base font-bold text-white tracking-tight" style={{ marginBottom: '0.125rem' }}>
                  {match.kills}
                  <span className="text-[var(--text-tertiary)] mx-2">/</span>
                  <span className="text-red-400">{match.deaths}</span>
                  <span className="text-[var(--text-tertiary)] mx-2">/</span>
                  {match.assists}
                </div>
                <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">K / D / A</p>
              </div>

              <div className="h-10 w-px bg-white/10"></div>

              <div className="text-center">
                <p className={`text-xl font-bold tracking-tight ${kdaColor} font-['Rajdhani']`} style={{ marginBottom: '0.125rem' }}>
                  {kda}:1
                </p>
                <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">KDA</p>
              </div>
            </div>
          </div>

          {/* Right Section - Teams */}
          <div className="flex items-start flex-1 border-l border-white/10" style={{ gap: '1.5rem', marginLeft: '1.5rem', paddingLeft: '1.5rem' }}>
          {/* Teams */}
          <div className="flex flex-1" style={{ gap: '1.5rem' }}>
            {/* Allies (Blue team) - Vertical */}
            {match.teammates && match.teammates.length > 0 && (
              <div className="flex-1">
                <div className="text-xs text-blue-400 font-bold uppercase tracking-wider" style={{ marginBottom: '0.5rem' }}>Allies</div>
                <div className="flex flex-col" style={{ gap: '0.375rem' }}>
                  {match.teammates.map((teammate, index) => {
                    const teammateChampionUrl = getChampionImageUrl(teammate.championName, ddragonVersion);
                    const badge = getRankBadge(teammate.rank || 10);
                    const isMVP = teammate.rank === 1;
                    return (
                      <div key={`ally-${index}`} className={`flex items-center ${isMVP ? 'bg-yellow-500/10 rounded-lg' : ''}`} style={isMVP ? { gap: '0.5rem', padding: '0.25rem 0.5rem' } : { gap: '0.5rem' }}>
                        <div className={`w-5 h-5 rounded overflow-hidden flex-shrink-0 ${isMVP ? 'border-2 border-yellow-500 shadow-lg shadow-yellow-500/50' : `border ${teammate.participantId ? getPlayerColor(teammate.participantId).border : 'border-blue-500'}`}`}>
                          <img
                            src={teammateChampionUrl}
                            alt={teammate.championName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center bg-gray-700 text-[8px] text-white">
                                  ${teammate.championName.charAt(0)}
                                </div>
                              `;
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-300 truncate">
                          {teammate.summonerName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Enemies (Red team) - Vertical */}
            {match.enemies && match.enemies.length > 0 && (
              <div className="flex-1">
                <div className="text-xs text-red-400 font-bold uppercase tracking-wider" style={{ marginBottom: '0.5rem' }}>Enemies</div>
                <div className="flex flex-col" style={{ gap: '0.375rem' }}>
                  {match.enemies.map((enemy, index) => {
                    const enemyChampionUrl = getChampionImageUrl(enemy.championName, ddragonVersion);
                    const badge = getRankBadge(enemy.rank || 10);
                    const isMVP = enemy.rank === 1;
                    return (
                      <div key={`enemy-${index}`} className={`flex items-center ${isMVP ? 'bg-yellow-500/10 rounded-lg' : ''}`} style={isMVP ? { gap: '0.5rem', padding: '0.25rem 0.5rem' } : { gap: '0.5rem' }}>
                        <div className={`w-5 h-5 rounded overflow-hidden flex-shrink-0 ${isMVP ? 'border-2 border-yellow-500 shadow-lg shadow-yellow-500/50' : `border ${enemy.participantId ? getPlayerColor(enemy.participantId).border : 'border-red-500'}`}`}>
                          <img
                            src={enemyChampionUrl}
                            alt={enemy.championName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.parentElement!.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center bg-gray-700 text-[8px] text-white">
                                  ${enemy.championName.charAt(0)}
                                </div>
                              `;
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-300 truncate">
                          {enemy.summonerName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end border-t border-white/5" style={{ paddingTop: '0.75rem', marginTop: '1rem' }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="glass-button flex items-center hover:scale-105 active:scale-100 transition-transform"
            style={{ gap: '0.5rem', padding: '0.5rem 1rem' }}
          >
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-sm font-semibold text-blue-300">
              {isExpanded ? 'Hide' : 'Details'}
            </span>
          </button>
        </div>
      </div>

      {/* Détails étendus avec onglets */}
      {isExpanded && (
        <div className="border-t border-white/5 animate-liquidExpand" style={{ marginTop: '1rem', paddingTop: '1.5rem' }}>
          {/* Navigation des onglets */}
          <div className="match-details-tabs" style={{ marginBottom: '1.5rem' }}>
            <button
              onClick={() => setActiveTab('overview')}
              className={`match-details-tab ${activeTab === 'overview' ? 'match-details-tab-active' : ''}`}
            >
              <span className="flex items-center" style={{ gap: '0.5rem' }}>
                <BarChart3 className="w-4 h-4" />
                Vue d'ensemble
              </span>
            </button>
            <button
              onClick={() => setActiveTab('combat')}
              className={`match-details-tab ${activeTab === 'combat' ? 'match-details-tab-active' : ''}`}
            >
              <span className="flex items-center" style={{ gap: '0.5rem' }}>
                <Swords className="w-4 h-4" />
                Combat
              </span>
            </button>
            <button
              onClick={() => setActiveTab('economy')}
              className={`match-details-tab ${activeTab === 'economy' ? 'match-details-tab-active' : ''}`}
            >
              <span className="flex items-center" style={{ gap: '0.5rem' }}>
                <Coins className="w-4 h-4" />
                Economy
              </span>
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`match-details-tab ${activeTab === 'charts' ? 'match-details-tab-active' : ''}`}
            >
              <span className="flex items-center" style={{ gap: '0.5rem' }}>
                <TrendingUp className="w-4 h-4" />
                Graphiques
              </span>
            </button>
            <button
              onClick={() => setActiveTab('scoreboard')}
              className={`match-details-tab ${activeTab === 'scoreboard' ? 'match-details-tab-active' : ''}`}
            >
              <span className="flex items-center" style={{ gap: '0.5rem' }}>
                <Trophy className="w-4 h-4" />
                Scoreboard
              </span>
            </button>
            <button
              onClick={() => setActiveTab('probability')}
              className={`match-details-tab ${activeTab === 'probability' ? 'match-details-tab-active' : ''}`}
            >
              <span className="flex items-center" style={{ gap: '0.5rem' }}>
                <Sparkles className="w-4 h-4" />
                Probabilité
              </span>
            </button>
          </div>

          {/* Contenu des onglets */}
          <div style={{ minHeight: '300px' }}>
            {/* ONGLET OVERVIEW */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* En-tête de la partie */}
                <div className="bg-gradient-to-r from-white/5 to-white/0 rounded-lg border border-white/10" style={{ padding: '1rem' }}>
                  <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
                    {/* Colonne 1: Informations de base */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Informations</div>
                      <div className="flex items-center" style={{ gap: '0.5rem' }}>
                        <span className="text-xs text-gray-400">Mode:</span>
                        <span className="text-sm font-semibold text-white">{formatGameMode(match.queueId)}</span>
                      </div>
                      <div className="flex items-center" style={{ gap: '0.5rem' }}>
                        <span className="text-xs text-gray-400">Duration:</span>
                        <span className="text-sm font-semibold text-white">{formatDuration(match.gameDuration)}</span>
                      </div>
                      <div className="flex items-center" style={{ gap: '0.5rem' }}>
                        <span className="text-xs text-gray-400">Date:</span>
                        <span className="text-sm text-gray-300">{new Date(match.timestamp).toLocaleDateString('en-US')}</span>
                      </div>
                      <div className="flex items-center" style={{ gap: '0.5rem' }}>
                        <span className="text-xs text-gray-400">Result:</span>
                        <span className={`text-sm font-bold ${match.win ? 'text-blue-400' : 'text-red-400'}`}>
                          {match.win ? 'VICTORY' : 'DEFEAT'}
                        </span>
                      </div>
                    </div>

                    {/* Colonne 2: Champion & Rôle */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Champion</div>
                      <div className="flex items-center" style={{ gap: '0.75rem' }}>
                        <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-white/20">
                          <img
                            src={championImageUrl}
                            alt={match.champion}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="text-base font-bold text-white">{match.champion}</div>
                          <div className="text-xs text-gray-400">Niveau {match.champLevel || 0}</div>
                          {(match.teamPosition || match.individualPosition || match.lane) && (
                            <div className="text-xs text-blue-400 font-semibold">
                              {match.teamPosition || match.individualPosition || match.lane}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Colonne 3: Sorts & Runes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Sorts & Runes</div>
                      <div className="flex" style={{ gap: '0.5rem' }}>
                        {match.summoner1Id && (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20 bg-black/40">
                            <img
                              src={getSummonerSpellImageUrl(getSummonerSpellName(match.summoner1Id), ddragonVersion)}
                              alt="Spell 1"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        {match.summoner2Id && (
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20 bg-black/40">
                            <img
                              src={getSummonerSpellImageUrl(getSummonerSpellName(match.summoner2Id), ddragonVersion)}
                              alt="Spell 2"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                      {match.perks && match.perks.styles.length > 0 && (
                        <div className="flex gap-1">
                          {match.perks.styles[0].selections.slice(0, 4).map((selection, index) => (
                            <div key={index} className="w-7 h-7 rounded-full overflow-hidden border border-yellow-500/30 bg-black/60">
                              <img
                                src={`https://opgg-static.akamaized.net/meta/images/lol/${ddragonVersion}/perk/${selection.perk}.png`}
                                alt="Rune"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Statistiques principales - Grille compacte */}
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center" style={{ gap: '0.5rem', marginBottom: '1rem' }}>
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Main Statistics
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: '0.75rem' }}>
                    {/* KDA */}
                    <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '0.75rem' }}>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider" style={{ marginBottom: '0.25rem' }}>K / D / A</div>
                      <div className="text-base font-bold text-white">
                        {match.kills} / <span className="text-red-400">{match.deaths}</span> / {match.assists}
                      </div>
                      <div className="text-[10px] text-gray-400" style={{ marginTop: '0.25rem' }}>
                        Ratio: <span className="text-green-400 font-semibold">
                          {match.deaths === 0 ? 'Perfect' : ((match.kills + match.assists) / match.deaths).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* CS */}
                    <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '0.75rem' }}>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider" style={{ marginBottom: '0.25rem' }}>CS Total</div>
                      <div className="text-base font-bold text-white">{match.totalMinionsKilled || 0}</div>
                      <div className="text-[10px] text-gray-400" style={{ marginTop: '0.25rem' }}>
                        <span className="text-blue-400 font-semibold">
                          {((match.totalMinionsKilled || 0) / (match.gameDuration / 60)).toFixed(1)}
                        </span> CS/min
                      </div>
                    </div>

                    {/* Gold */}
                    <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '0.75rem' }}>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider" style={{ marginBottom: '0.25rem' }}>Gold Earned</div>
                      <div className="text-base font-bold text-yellow-400">
                        {((match.goldEarned || 0) / 1000).toFixed(1)}k
                      </div>
                      <div className="text-[10px] text-gray-400" style={{ marginTop: '0.25rem' }}>
                        <span className="text-yellow-400 font-semibold">
                          {((match.goldEarned || 0) / (match.gameDuration / 60)).toFixed(0)}
                        </span> Gold/min
                      </div>
                    </div>

                    {/* Damage to champions */}
                    <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '0.75rem' }}>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider" style={{ marginBottom: '0.25rem' }}>Damage Dealt</div>
                      <div className="text-base font-bold text-red-400">
                        {((match.totalDamageDealtToChampions || 0) / 1000).toFixed(1)}k
                      </div>
                      <div className="text-[10px] text-gray-400" style={{ marginTop: '0.25rem' }}>
                        To champions
                      </div>
                    </div>

                    {/* Vision Score */}
                    <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '0.75rem' }}>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider" style={{ marginBottom: '0.25rem' }}>Vision Score</div>
                      <div className="text-base font-bold text-purple-400">{match.visionScore || 0}</div>
                      <div className="text-[10px] text-gray-400" style={{ marginTop: '0.25rem' }}>
                        Wards: {match.wardsPlaced || 0}
                      </div>
                    </div>

                    {/* Damage taken */}
                    <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '0.75rem' }}>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider" style={{ marginBottom: '0.25rem' }}>Damage Taken</div>
                      <div className="text-base font-bold text-orange-400">
                        {((match.totalDamageTaken || 0) / 1000).toFixed(1)}k
                      </div>
                    </div>

                    {/* Healing */}
                    <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '0.75rem' }}>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider" style={{ marginBottom: '0.25rem' }}>Healing Done</div>
                      <div className="text-base font-bold text-green-400">
                        {((match.totalHeal || 0) / 1000).toFixed(1)}k
                      </div>
                    </div>

                    {/* Participation */}
                    <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '0.75rem' }}>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider" style={{ marginBottom: '0.25rem' }}>Kill Participation</div>
                      <div className="text-base font-bold text-green-400">
                        {match.teammates && match.teammates.length > 0
                          ? (((match.kills + match.assists) / Math.max(1, match.kills + match.teammates.reduce((acc, t) => acc + (t.kills || 0), 0))) * 100).toFixed(0)
                          : 0}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistiques avancées */}
                <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: '1rem' }}>
                  {/* Vision & Wards */}
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center" style={{ gap: '0.25rem', marginBottom: '0.5rem' }}>
                      <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      Vision & Wards
                    </h4>
                    <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Wards placed</span>
                        <span className="text-yellow-400 font-semibold">{match.wardsPlaced || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Wards destroyed</span>
                        <span className="text-red-400 font-semibold">{match.wardsKilled || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Control wards</span>
                        <span className="text-pink-400 font-semibold">{match.detectorWardsPlaced || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Multi-kills & Achievements */}
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center" style={{ gap: '0.25rem', marginBottom: '0.5rem' }}>
                      <svg className="w-3 h-3 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Achievements
                    </h4>
                    <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {(match.doubleKills || 0) > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Double Kills</span>
                          <span className="text-blue-400 font-semibold">{match.doubleKills}</span>
                        </div>
                      )}
                      {(match.tripleKills || 0) > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Triple Kills</span>
                          <span className="text-purple-400 font-semibold">{match.tripleKills}</span>
                        </div>
                      )}
                      {(match.quadraKills || 0) > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Quadra Kills</span>
                          <span className="text-orange-400 font-semibold">{match.quadraKills}</span>
                        </div>
                      )}
                      {(match.pentaKills || 0) > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400 flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            Penta Kills
                          </span>
                          <span className="text-red-400 font-semibold">{match.pentaKills}</span>
                        </div>
                      )}
                      {match.firstBloodKill && (
                        <div className="text-xs text-red-400 font-semibold flex items-center gap-1">
                          <Droplets className="w-3 h-3" />
                          First Blood
                        </div>
                      )}
                      {match.largestKillingSpree && match.largestKillingSpree >= 3 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Killing Spree</span>
                          <span className="text-green-400 font-semibold">{match.largestKillingSpree} kills</span>
                        </div>
                      )}
                      {!match.doubleKills && !match.tripleKills && !match.quadraKills && !match.pentaKills && !match.firstBloodKill && (!match.largestKillingSpree || match.largestKillingSpree < 3) && (
                        <div className="text-xs text-gray-500 text-center py-2">No achievements</div>
                      )}
                    </div>
                  </div>

                  {/* Objectives */}
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center" style={{ gap: '0.25rem', marginBottom: '0.5rem' }}>
                      <svg className="w-3 h-3 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      Objectives
                    </h4>
                    <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Turrets destroyed</span>
                        <span className="text-orange-400 font-semibold">{match.turretKills || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Inhibitors</span>
                        <span className="text-purple-400 font-semibold">{match.inhibitorKills || 0}</span>
                      </div>
                      {match.firstTowerKill && (
                        <div className="text-xs text-orange-400 font-semibold flex items-center gap-1">
                          <Castle className="w-3 h-3" />
                          First Tower
                        </div>
                      )}
                      {match.damageDealtToObjectives && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Objective damage</span>
                          <span className="text-blue-400 font-semibold">{((match.damageDealtToObjectives || 0) / 1000).toFixed(1)}k</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items Build */}
                <div>
                  <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Final Build
                  </h4>
                  <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <div className="flex gap-2 items-center">
                      {match.items && match.items.map((itemId, index) => (
                        <div key={index} className={`w-12 h-12 rounded-lg overflow-hidden border-2 ${itemId === 0 ? 'border-white/5 bg-black/40' : 'border-yellow-500/30 bg-black/60'}`}>
                          {itemId !== 0 && (
                            <img
                              src={`${getItemImageUrl(itemId, ddragonVersion)}`}
                              alt={`Item ${itemId}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ONGLET COMBAT */}
            {activeTab === 'combat' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 className="text-sm font-bold text-white flex items-center" style={{ gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                  </svg>
                  Combat Details
                </h4>

                {/* Damage dealt - Breakdown */}
                <div>
                  <h5 className="text-xs font-semibold text-gray-300" style={{ marginBottom: '0.5rem' }}>Damage dealt to champions</h5>
                  <div className="bg-white/5 rounded-lg" style={{ padding: '1rem' }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                      <span className="text-sm text-gray-400">Total</span>
                      <span className="text-lg font-bold text-red-400">
                        {((match.totalDamageDealtToChampions || 0) / 1000).toFixed(1)}k
                      </span>
                    </div>

                    {/* Barres de répartition des types de dégâts */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
                      {match.physicalDamageDealtToChampions !== undefined && (
                        <div>
                          <div className="flex justify-between text-xs" style={{ marginBottom: '0.25rem' }}>
                            <span className="text-orange-400">Physical</span>
                            <span className="text-gray-400">{((match.physicalDamageDealtToChampions / 1000)).toFixed(1)}k ({((match.physicalDamageDealtToChampions / Math.max(1, match.totalDamageDealtToChampions || 1)) * 100).toFixed(0)}%)</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
                              style={{ width: `${(match.physicalDamageDealtToChampions / Math.max(1, match.totalDamageDealtToChampions || 1)) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {match.magicDamageDealtToChampions !== undefined && (
                        <div>
                          <div className="flex justify-between text-xs" style={{ marginBottom: '0.25rem' }}>
                            <span className="text-blue-400">Magic</span>
                            <span className="text-gray-400">{((match.magicDamageDealtToChampions / 1000)).toFixed(1)}k ({((match.magicDamageDealtToChampions / Math.max(1, match.totalDamageDealtToChampions || 1)) * 100).toFixed(0)}%)</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                              style={{ width: `${(match.magicDamageDealtToChampions / Math.max(1, match.totalDamageDealtToChampions || 1)) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {match.trueDamageDealtToChampions !== undefined && (
                        <div>
                          <div className="flex justify-between text-xs" style={{ marginBottom: '0.25rem' }}>
                            <span className="text-white">True</span>
                            <span className="text-gray-400">{((match.trueDamageDealtToChampions / 1000)).toFixed(1)}k ({((match.trueDamageDealtToChampions / Math.max(1, match.totalDamageDealtToChampions || 1)) * 100).toFixed(0)}%)</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-gray-400 to-white"
                              style={{ width: `${(match.trueDamageDealtToChampions / Math.max(1, match.totalDamageDealtToChampions || 1)) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Combat stats grid */}
                <div className="grid grid-cols-2" style={{ gap: '0.75rem' }}>
                  {/* Damage taken */}
                  <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '0.75rem' }}>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider" style={{ marginBottom: '0.25rem' }}>Damage Taken</div>
                    <div className="text-lg font-bold text-purple-400">
                      {((match.totalDamageTaken || 0) / 1000).toFixed(1)}k
                    </div>
                  </div>

                  {/* Damage mitigated */}
                  <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '0.75rem' }}>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider" style={{ marginBottom: '0.25rem' }}>Damage Mitigated</div>
                    <div className="text-lg font-bold text-cyan-400">
                      {((match.damageSelfMitigated || 0) / 1000).toFixed(1)}k
                    </div>
                  </div>

                  {/* Healing */}
                  <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '0.75rem' }}>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider" style={{ marginBottom: '0.25rem' }}>Healing</div>
                    <div className="text-lg font-bold text-green-400">
                      {((match.totalHeal || 0) / 1000).toFixed(1)}k
                    </div>
                  </div>

                  {/* Shields */}
                  <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '0.75rem' }}>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider" style={{ marginBottom: '0.25rem' }}>Shields to Allies</div>
                    <div className="text-lg font-bold text-yellow-400">
                      {((match.totalDamageShieldedOnTeammates || 0) / 1000).toFixed(1)}k
                    </div>
                  </div>

                  {/* Objective damage */}
                  <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '0.75rem' }}>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider" style={{ marginBottom: '0.25rem' }}>Objective Damage</div>
                    <div className="text-lg font-bold text-orange-400">
                      {((match.damageDealtToObjectives || 0) / 1000).toFixed(1)}k
                    </div>
                  </div>

                  {/* Turret damage */}
                  <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '0.75rem' }}>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider" style={{ marginBottom: '0.25rem' }}>Turret Damage</div>
                    <div className="text-lg font-bold text-gray-400">
                      {((match.damageDealtToTurrets || 0) / 1000).toFixed(1)}k
                    </div>
                  </div>

                  {/* CC applied */}
                  <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '0.75rem' }}>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider" style={{ marginBottom: '0.25rem' }}>CC Applied</div>
                    <div className="text-lg font-bold text-indigo-400">
                      {(match.timeCCingOthers || 0).toFixed(0)}s
                    </div>
                  </div>

                  {/* Structures destroyed */}
                  <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '0.75rem' }}>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider" style={{ marginBottom: '0.25rem' }}>Structures Destroyed</div>
                    <div className="text-lg font-bold text-red-400">
                      {(match.turretKills || 0) + (match.inhibitorKills || 0)}
                    </div>
                    <div className="text-[9px] text-gray-500" style={{ marginTop: '0.125rem' }}>
                      {match.turretKills || 0} turrets, {match.inhibitorKills || 0} inhib
                    </div>
                  </div>
                </div>

                {/* Multi-kills and Achievements */}
                {((match.pentaKills || 0) > 0 || (match.quadraKills || 0) > 0 || (match.tripleKills || 0) > 0 || (match.doubleKills || 0) > 0 || match.firstBloodKill || match.firstTowerKill) && (
                  <div>
                    <h5 className="text-xs font-semibold text-gray-300" style={{ marginBottom: '0.5rem' }}>Achievements</h5>
                    <div className="grid grid-cols-2" style={{ gap: '0.5rem' }}>
                      {(match.pentaKills || 0) > 0 && (
                        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg" style={{ padding: '0.75rem' }}>
                          <div className="text-xs font-bold text-yellow-400 flex items-center" style={{ gap: '0.25rem' }}>
                            <Trophy className="w-3 h-3" />
                            PENTA KILL
                          </div>
                          <div className="text-[10px] text-gray-400">× {match.pentaKills}</div>
                        </div>
                      )}
                      {(match.quadraKills || 0) > 0 && (
                        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg" style={{ padding: '0.75rem' }}>
                          <div className="text-xs font-bold text-orange-400 flex items-center" style={{ gap: '0.25rem' }}>
                            <Star className="w-3 h-3 fill-current" />
                            QUADRA KILL
                          </div>
                          <div className="text-[10px] text-gray-400">× {match.quadraKills}</div>
                        </div>
                      )}
                      {(match.tripleKills || 0) > 0 && (
                        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg" style={{ padding: '0.75rem' }}>
                          <div className="text-xs font-bold text-purple-400 flex items-center" style={{ gap: '0.25rem' }}>
                            <Sparkles className="w-3 h-3" />
                            TRIPLE KILL
                          </div>
                          <div className="text-[10px] text-gray-400">× {match.tripleKills}</div>
                        </div>
                      )}
                      {(match.doubleKills || 0) > 0 && (
                        <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg" style={{ padding: '0.75rem' }}>
                          <div className="text-xs font-bold text-blue-400 flex items-center" style={{ gap: '0.25rem' }}>
                            <Zap className="w-3 h-3" />
                            DOUBLE KILL
                          </div>
                          <div className="text-[10px] text-gray-400">× {match.doubleKills}</div>
                        </div>
                      )}
                      {match.firstBloodKill && (
                        <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-lg" style={{ padding: '0.75rem' }}>
                          <div className="text-xs font-bold text-red-400 flex items-center" style={{ gap: '0.25rem' }}>
                            <Droplets className="w-3 h-3" />
                            FIRST BLOOD
                          </div>
                        </div>
                      )}
                      {match.firstTowerKill && (
                        <div className="bg-gradient-to-r from-gray-500/20 to-gray-600/20 border border-gray-500/30 rounded-lg" style={{ padding: '0.75rem' }}>
                          <div className="text-xs font-bold text-gray-300 flex items-center" style={{ gap: '0.25rem' }}>
                            <Castle className="w-3 h-3" />
                            FIRST TOWER
                          </div>
                        </div>
                      )}
                      {(match.largestKillingSpree || 0) >= 3 && (
                        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg" style={{ padding: '0.75rem' }}>
                          <div className="text-xs font-bold text-green-400 flex items-center" style={{ gap: '0.25rem' }}>
                            <Flame className="w-3 h-3" />
                            KILLING SPREE
                          </div>
                          <div className="text-[10px] text-gray-400">{match.largestKillingSpree} kills</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ONGLET ÉCONOMIE */}
            {activeTab === 'economy' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Résumé économique */}
                <div className="bg-gradient-to-r from-yellow-500/10 to-yellow-500/0 rounded-lg border border-yellow-500/20" style={{ padding: '1rem' }}>
                  <h4 className="text-sm font-bold text-white flex items-center" style={{ gap: '0.5rem', marginBottom: '1rem' }}>
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                    Résumé Économique
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: '1rem' }}>
                    <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '0.75rem' }}>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider" style={{ marginBottom: '0.25rem' }}>Gold Earned</div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {((match.goldEarned || 0) / 1000).toFixed(1)}k
                      </div>
                      <div className="text-xs text-gray-400" style={{ marginTop: '0.25rem' }}>
                        {((match.goldEarned || 0) / (match.gameDuration / 60)).toFixed(0)} G/min
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '0.75rem' }}>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider" style={{ marginBottom: '0.25rem' }}>Gold Spent</div>
                      <div className="text-2xl font-bold text-orange-400">
                        {match.goldSpent ? `${(match.goldSpent / 1000).toFixed(1)}k` : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400" style={{ marginTop: '0.25rem' }}>
                        {match.goldSpent ? `${((match.goldSpent / (match.goldEarned || 1)) * 100).toFixed(0)}% du total` : '-'}
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '0.75rem' }}>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider" style={{ marginBottom: '0.25rem' }}>Unspent Gold</div>
                      <div className="text-2xl font-bold text-gray-300">
                        {match.goldSpent ? `${(((match.goldEarned || 0) - match.goldSpent) / 1000).toFixed(1)}k` : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400" style={{ marginTop: '0.25rem' }}>
                        At end of game
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '0.75rem' }}>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider" style={{ marginBottom: '0.25rem' }}>Efficiency</div>
                      <div className="text-2xl font-bold text-green-400">
                        {match.goldSpent ? `${((match.goldSpent / (match.goldEarned || 1)) * 100).toFixed(0)}%` : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400" style={{ marginTop: '0.25rem' }}>
                        Gold spent vs earned
                      </div>
                    </div>
                  </div>
                </div>

                {/* Build détaillé */}
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center" style={{ gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Final Build & Items
                  </h4>

                  <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '1rem' }}>
                    {/* Items principaux */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div className="text-xs text-gray-400 font-semibold" style={{ marginBottom: '0.5rem' }}>Items (6 slots)</div>
                      <div className="flex" style={{ gap: '0.5rem' }}>
                        {match.items && match.items.slice(0, 6).map((itemId, index) => (
                          <div
                            key={index}
                            className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                              itemId === 0
                                ? 'border-white/5 bg-black/40'
                                : 'border-purple-500/30 bg-black/60 hover:border-purple-500 hover:scale-110'
                            }`}
                          >
                            {itemId !== 0 ? (
                              <>
                                <img
                                  src={`${getItemImageUrl(itemId, ddragonVersion)}`}
                                  alt={`Item ${itemId}`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-0 right-0 bg-black/90 text-[8px] px-1 rounded-tl text-white font-bold">
                                  #{index + 1}
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">
                                Vide
                              </div>
                            )}
                          </div>
                        ))}
                        {match.items && match.items.length < 6 && Array.from({ length: 6 - match.items.length }).map((_, index) => (
                          <div key={`empty-${index}`} className="w-14 h-14 rounded-lg border-2 border-white/5 bg-black/40 flex items-center justify-center">
                            <div className="text-xs text-gray-600">Vide</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Trinket */}
                    {match.items && match.items[6] && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <div className="text-xs text-gray-400 font-semibold" style={{ marginBottom: '0.5rem' }}>Trinket</div>
                        <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-blue-500/30 bg-black/60">
                          <img
                            src={getItemImageUrl(match.items[6], ddragonVersion)}
                            alt="Trinket"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {/* Statistiques du build */}
                    <div className="border-t border-white/10" style={{ marginTop: '1rem', paddingTop: '1rem' }}>
                      <div className="grid grid-cols-3" style={{ gap: '0.75rem' }}>
                        <div className="text-center">
                          <div className="text-xs text-gray-400" style={{ marginBottom: '0.25rem' }}>Completed Items</div>
                          <div className="text-lg font-bold text-white">
                            {match.items?.filter(id => id !== 0).length || 0}/6
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400" style={{ marginBottom: '0.25rem' }}>Build Complet</div>
                          <div className="text-lg font-bold">
                            {match.items?.filter(id => id !== 0).length === 6 ? (
                              <span className="text-green-400">✓ Yes</span>
                            ) : (
                              <span className="text-orange-400">Partial</span>
                            )}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400" style={{ marginBottom: '0.25rem' }}>Slots Vides</div>
                          <div className="text-lg font-bold text-gray-400">
                            {6 - (match.items?.filter(id => id !== 0).length || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sources de gold */}
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center" style={{ gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 1a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm4-4a1 1 0 100 2h.01a1 1 0 100-2H13zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM7 8a1 1 0 000 2h.01a1 1 0 000-2H7z" clipRule="evenodd" />
                    </svg>
                    Gold Sources
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: '0.75rem' }}>
                    <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '1rem' }}>
                      <div className="flex items-center" style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        <div className="text-xs text-gray-400 font-semibold">Minions & Jungle</div>
                      </div>
                      <div className="text-2xl font-bold text-white" style={{ marginBottom: '0.25rem' }}>
                        {((match.totalMinionsKilled || 0) + (match.neutralMinionsKilled || 0)) * 20}
                      </div>
                      <div className="text-xs text-gray-400">
                        {match.totalMinionsKilled || 0} CS + {match.neutralMinionsKilled || 0} Jungle
                      </div>
                      <div className="h-1.5 bg-black/40 rounded-full overflow-hidden" style={{ marginTop: '0.5rem' }}>
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${Math.min(100, (((match.totalMinionsKilled || 0) + (match.neutralMinionsKilled || 0)) * 20 / (match.goldEarned || 1)) * 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '1rem' }}>
                      <div className="flex items-center" style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                        <div className="text-xs text-gray-400 font-semibold">Kills & Assists</div>
                      </div>
                      <div className="text-2xl font-bold text-white" style={{ marginBottom: '0.25rem' }}>
                        ~{(match.kills * 300) + (match.assists * 150)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {match.kills} Kills + {match.assists} Assists
                      </div>
                      <div className="h-1.5 bg-black/40 rounded-full overflow-hidden" style={{ marginTop: '0.5rem' }}>
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{
                            width: `${Math.min(100, ((match.kills * 300 + match.assists * 150) / (match.goldEarned || 1)) * 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '1rem' }}>
                      <div className="flex items-center" style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                        <div className="text-xs text-gray-400 font-semibold">Objectives</div>
                      </div>
                      <div className="text-2xl font-bold text-white" style={{ marginBottom: '0.25rem' }}>
                        ~{((match.turretKills || 0) * 150) + ((match.inhibitorKills || 0) * 50)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {match.turretKills || 0} Tours + {match.inhibitorKills || 0} Inhibs
                      </div>
                      <div className="h-1.5 bg-black/40 rounded-full overflow-hidden" style={{ marginTop: '0.5rem' }}>
                        <div
                          className="h-full bg-orange-500 rounded-full"
                          style={{
                            width: `${Math.min(100, (((match.turretKills || 0) * 150 + (match.inhibitorKills || 0) * 50) / (match.goldEarned || 1)) * 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg" style={{ marginTop: '0.75rem', padding: '0.75rem' }}>
                    <div className="flex items-center text-xs text-gray-400" style={{ gap: '0.5rem' }}>
                      <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span>Values are estimates based on average gold per kill/assist/objective</span>
                    </div>
                  </div>
                </div>

                {/* Note sur la timeline */}
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg" style={{ padding: '1rem' }}>
                  <div className="flex items-start" style={{ gap: '0.5rem' }}>
                    <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" style={{ marginTop: '0.125rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-yellow-300" style={{ marginBottom: '0.25rem' }}>Purchase Timeline Coming Soon</p>
                      <p className="text-xs text-gray-400">
                        Detailed item purchase chronology with timestamps will be available soon.
                        You will be able to see the exact order and timing of each purchase during the game.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ONGLET GRAPHIQUES */}
            {activeTab === 'charts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 className="text-sm font-bold text-white flex items-center" style={{ gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Performance Comparison
                </h4>

                {/* Loading */}
                {loadingTimeline && (
                  <div className="flex items-center justify-center" style={{ padding: '2rem 0' }}>
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-400" style={{ marginLeft: '0.75rem' }}>Loading...</span>
                  </div>
                )}

                {timeline && (
                  <>
                    {/* Onglets des métriques */}
                    <div className="flex border-b border-white/10" style={{ gap: '0.5rem', paddingBottom: '0.5rem' }}>
                      <button
                        onClick={() => setChartMetric('gold')}
                        className={`px-3 py-1.5 rounded-t-lg text-xs font-medium transition-none ${
                          chartMetric === 'gold'
                            ? 'bg-yellow-500/20 text-yellow-400 border-b-2 border-yellow-500'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        Gold
                      </button>
                      <button
                        onClick={() => setChartMetric('cs')}
                        className={`px-3 py-1.5 rounded-t-lg text-xs font-medium transition-none ${
                          chartMetric === 'cs'
                            ? 'bg-blue-500/20 text-blue-400 border-b-2 border-blue-500'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        CS
                      </button>
                      <button
                        onClick={() => setChartMetric('xp')}
                        className={`px-3 py-1.5 rounded-t-lg text-xs font-medium transition-none ${
                          chartMetric === 'xp'
                            ? 'bg-purple-500/20 text-purple-400 border-b-2 border-purple-500'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        XP
                      </button>
                      <button
                        onClick={() => setChartMetric('level')}
                        className={`px-3 py-1.5 rounded-t-lg text-xs font-medium transition-none ${
                          chartMetric === 'level'
                            ? 'bg-green-500/20 text-green-400 border-b-2 border-green-500'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        Level
                      </button>
                    </div>
                  </>
                )}

                {/* Images des champions cliquables */}
                {timeline && (
                  <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '1rem' }}>
                    <div className="text-xs font-semibold text-gray-300 text-center" style={{ marginBottom: '0.75rem' }}>Click on champions to show/hide</div>
                    <div className="flex flex-wrap justify-center" style={{ gap: '0.5rem' }}>
                      {allPlayers.map((player) => {
                        if (!player.participantId) return null;
                        const participantId = player.participantId;
                        const isSelected = selectedPlayerIds.includes(participantId);
                        return (
                          <button
                            key={participantId}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedPlayerIds(selectedPlayerIds.filter(id => id !== participantId));
                              } else {
                                setSelectedPlayerIds([...selectedPlayerIds, participantId]);
                              }
                            }}
                            className={`relative transition-none ${
                              isSelected ? 'opacity-100 scale-110' : 'opacity-50 grayscale hover:opacity-75'
                            }`}
                          >
                            <div
                              className={`w-12 h-12 rounded-lg overflow-hidden border-3 ${isSelected ? 'shadow-lg' : ''}`}
                              style={{
                                borderWidth: '3px',
                                borderStyle: 'solid',
                                borderColor: getPlayerColor(participantId).hex
                              }}
                            >
                              <img
                                src={`${getChampionImageUrl(player.championName, ddragonVersion)}`}
                                alt={player.championName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Ancienne sélection - à supprimer plus tard */}
                <div className="bg-white/5 p-3 rounded-lg hidden">
                  <div className="text-xs font-semibold text-gray-300 mb-2">Select players to compare:</div>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {/* Alliés */}
                    {match.teammates && match.teammates.map((teammate, index) => {
                      const playerId = teammate.participantId || 0;
                      const isSelected = selectedPlayerIds.includes(playerId);
                      return (
                        <label
                          key={playerId}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-none ${
                            isSelected ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPlayerIds([...selectedPlayerIds, playerId]);
                              } else {
                                setSelectedPlayerIds(selectedPlayerIds.filter(p => p !== playerId));
                              }
                            }}
                            className="w-3.5 h-3.5 rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                          />
                          <div className={`w-5 h-5 rounded overflow-hidden border ${getPlayerColor(playerId).border} flex-shrink-0`}>
                            <img
                              src={`${getChampionImageUrl(teammate.championName, ddragonVersion)}`}
                              alt={teammate.championName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-[10px] text-gray-300 truncate flex-1">{teammate.summonerName}</span>
                        </label>
                      );
                    })}
                    {/* Ennemis */}
                    {match.enemies && match.enemies.map((enemy, index) => {
                      const playerId = enemy.participantId || 0;
                      const isSelected = selectedPlayerIds.includes(playerId);
                      return (
                        <label
                          key={playerId}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-none ${
                            isSelected ? 'bg-red-500/20 border border-red-500/30' : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPlayerIds([...selectedPlayerIds, playerId]);
                              } else {
                                setSelectedPlayerIds(selectedPlayerIds.filter(p => p !== playerId));
                              }
                            }}
                            className="w-3.5 h-3.5 rounded border-gray-600 text-red-500 focus:ring-red-500"
                          />
                          <div className={`w-5 h-5 rounded overflow-hidden border ${getPlayerColor(playerId).border} flex-shrink-0`}>
                            <img
                              src={`${getChampionImageUrl(enemy.championName, ddragonVersion)}`}
                              alt={enemy.championName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-[10px] text-gray-300 truncate flex-1">{enemy.summonerName}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Graphique temporel */}
                {timeline && selectedPlayerIds.length > 0 ? (
                  <div className="bg-white/5 rounded-lg border border-white/10" style={{ padding: '1rem' }}>
                    {(() => {
                      // Filtrer les joueurs sélectionnés
                      const selectedPlayers = allPlayers.filter(p =>
                        p.participantId && selectedPlayerIds.includes(p.participantId)
                      );

                      // Dimensions du graphique
                      const width = 700;
                      const height = 350;
                      const padding = { top: 30, right: 20, bottom: 60, left: 70 };
                      const chartWidth = width - padding.left - padding.right;
                      const chartHeight = height - padding.top - padding.bottom;

                      // Extraire les valeurs pour chaque joueur à chaque frame
                      const getValue = (playerId: number, frame: TimelineFrame) => {
                        const playerFrame = frame.players.find(p => p.participantId === playerId);
                        if (!playerFrame) return 0;

                        switch (chartMetric) {
                          case 'gold':
                            return playerFrame.totalGold;
                          case 'cs':
                            return playerFrame.minionsKilled + playerFrame.jungleMinionsKilled;
                          case 'xp':
                            return playerFrame.xp;
                          case 'level':
                            return playerFrame.level;
                          default:
                            return 0;
                        }
                      };

                      // Trouver la valeur max pour l'échelle
                      let maxValue = 1;
                      timeline.forEach(frame => {
                        selectedPlayers.forEach(player => {
                          if (player.participantId) {
                            const value = getValue(player.participantId, frame);
                            maxValue = Math.max(maxValue, value);
                          }
                        });
                      });

                      // Créer les points pour chaque joueur
                      const playerPaths = selectedPlayers.map((player, playerIndex) => {
                        if (!player.participantId) return null;

                        const points = timeline.map((frame, frameIndex) => {
                          const x = padding.left + (frameIndex / (timeline.length - 1)) * chartWidth;
                          const value = getValue(player.participantId!, frame);
                          const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
                          return { x, y, value };
                        });

                        // Créer le path SVG
                        let path = `M ${points[0].x},${points[0].y}`;
                        for (let i = 1; i < points.length; i++) {
                          path += ` L ${points[i].x},${points[i].y}`;
                        }

                        return {
                          player,
                          points,
                          path,
                          color: getPlayerColor(player.participantId!).hex
                        };
                      }).filter(Boolean);

                      return (
                        <div className="space-y-4">
                          <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`}>
                            {/* Grille */}
                            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                              const y = padding.top + chartHeight * (1 - ratio);
                              return (
                                <g key={i}>
                                  <line
                                    x1={padding.left}
                                    y1={y}
                                    x2={width - padding.right}
                                    y2={y}
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="1"
                                  />
                                  <text
                                    x={padding.left - 10}
                                    y={y + 4}
                                    fill="rgba(255,255,255,0.5)"
                                    fontSize="10"
                                    textAnchor="end"
                                  >
                                    {Math.round(maxValue * ratio)}
                                  </text>
                                </g>
                              );
                            })}

                            {/* Axes */}
                            <line
                              x1={padding.left}
                              y1={padding.top}
                              x2={padding.left}
                              y2={height - padding.bottom}
                              stroke="rgba(255,255,255,0.3)"
                              strokeWidth="2"
                            />
                            <line
                              x1={padding.left}
                              y1={height - padding.bottom}
                              x2={width - padding.right}
                              y2={height - padding.bottom}
                              stroke="rgba(255,255,255,0.3)"
                              strokeWidth="2"
                            />

                            {/* Labels des axes */}
                            <text
                              x={padding.left - 50}
                              y={height / 2}
                              fill="rgba(255,255,255,0.7)"
                              fontSize="12"
                              fontWeight="bold"
                              textAnchor="middle"
                              transform={`rotate(-90, ${padding.left - 50}, ${height / 2})`}
                            >
                              {chartMetric === 'gold' ? 'Gold' : chartMetric === 'cs' ? 'CS' : chartMetric === 'xp' ? 'XP' : 'Level'}
                            </text>

                            <text
                              x={width / 2}
                              y={height - 10}
                              fill="rgba(255,255,255,0.7)"
                              fontSize="12"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              Time (minutes)
                            </text>

                            {/* Marqueurs de temps */}
                            {timeline.filter((_, i) => i % 2 === 0).map((frame, i) => {
                              const realIndex = i * 2;
                              const x = padding.left + (realIndex / (timeline.length - 1)) * chartWidth;
                              const minutes = Math.floor(frame.timestamp / 60000);
                              return (
                                <text
                                  key={i}
                                  x={x}
                                  y={height - padding.bottom + 20}
                                  fill="rgba(255,255,255,0.5)"
                                  fontSize="10"
                                  textAnchor="middle"
                                >
                                  {minutes}
                                </text>
                              );
                            })}

                            {/* Courbes */}
                            {playerPaths.map((data, index) => data && (
                              <path
                                key={index}
                                d={data.path}
                                fill="none"
                                stroke={data.color}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            ))}
                          </svg>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="bg-white/5 p-8 rounded-lg text-center">
                    <p className="text-sm text-gray-400">Select at least one player to display the chart</p>
                  </div>
                )}
              </div>
            )}

            {/* ONGLET SCOREBOARD */}
            {activeTab === 'scoreboard' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 className="text-sm font-bold text-white flex items-center" style={{ gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Detailed Scoreboard
                </h4>

                {/* Blue team (Alliés) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <div className="text-xs font-bold text-blue-400" style={{ marginBottom: '0.5rem' }}>Blue Team</div>

                  {/* Ajouter le joueur principal en premier */}
                  {(() => {
                    const playerData = mainPlayer;
                    const badge = getRankBadge(playerData.rank || 10);
                    const isMVP = playerData.rank === 1;
                    const isTopThree = playerData.rank && playerData.rank <= 3;
                    const kda = playerData.deaths === 0 ? 'Perfect' : (((playerData.kills || 0) + (playerData.assists || 0)) / (playerData.deaths || 1)).toFixed(2);

                    return (
                      <div key="main-player" className={`bg-gradient-to-r p-2 rounded-lg border ${
                        isMVP ? 'from-yellow-500/10 to-yellow-500/5 border-yellow-500/30' :
                        isTopThree ? 'from-blue-500/10 to-blue-500/5 border-blue-500/20' :
                        'from-blue-500/5 to-transparent border-blue-500/10'
                      }`}>
                        <div className="grid grid-cols-[auto_auto_1fr_auto_auto_auto] gap-1.5 items-center">
                          {/* Rang */}
                          <div className={`relative w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 ${badge.container} ${badge.glow ? 'rank-mvp-shimmer' : ''}`}>
                            <div className={`flex flex-col items-center justify-center ${badge.text} relative z-10`}>
                              {badge.showIcon && (
                                <svg className="w-2.5 h-2.5 mb-0.5" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                </svg>
                              )}
                              <span className="text-[8px] leading-none font-bold">{badge.label}</span>
                            </div>
                          </div>

                          {/* Champion + Sorts */}
                          <div className="flex items-center gap-1">
                            <div className="relative">
                              <div className={`w-11 h-11 rounded-lg overflow-hidden border-2 ${playerData.participantId ? getPlayerColor(playerData.participantId).border : 'border-blue-500'} flex-shrink-0`}>
                                <img
                                  src={`${getChampionImageUrl(playerData.championName, ddragonVersion)}`}
                                  alt={playerData.championName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="absolute -bottom-0.5 -right-0.5 bg-black/90 text-white text-[8px] px-1 rounded font-bold">
                                {playerData.champLevel || 1}
                              </div>
                            </div>
                            {/* Summoner Spells */}
                            <div className="flex flex-col gap-0.5">
                              <div className="w-4 h-4 rounded bg-black/60 overflow-hidden">
                                {match.summoner1Id && (
                                  <img
                                    src={`${getSummonerSpellImageUrl(getSummonerSpellName(match.summoner1Id), ddragonVersion)}`}
                                    alt="Summoner 1"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                )}
                              </div>
                              <div className="w-4 h-4 rounded bg-black/60 overflow-hidden">
                                {match.summoner2Id && (
                                  <img
                                    src={`${getSummonerSpellImageUrl(getSummonerSpellName(match.summoner2Id), ddragonVersion)}`}
                                    alt="Summoner 2"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Nom + KDA */}
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs text-white font-semibold truncate">{playerData.summonerName}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400">{playerData.championName}</span>
                              <div className="text-[11px] text-white font-semibold whitespace-nowrap">
                                {playerData.kills || 0}/{playerData.deaths || 0}/{playerData.assists || 0}
                                <span className={`ml-1 text-[9px] font-bold ${kda === 'Perfect' ? 'text-yellow-400' : parseFloat(kda) >= 3 ? 'text-green-400' : 'text-gray-400'}`}>
                                  ({kda})
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Stats compactes */}
                          <div className="flex gap-2 text-[10px]">
                            <div className="text-center">
                              <div className="text-gray-400 text-[8px]">DMG</div>
                              <div className="text-red-400 font-semibold">
                                {match.totalDamageDealtToChampions ? `${(match.totalDamageDealtToChampions / 1000).toFixed(0)}k` : '-'}
                              </div>
                              <div className="text-gray-500 text-[8px]">
                                {match.totalDamageTaken ? `${(match.totalDamageTaken / 1000).toFixed(0)}k` : '-'}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-gray-400 text-[8px]">Gold</div>
                              <div className="text-yellow-400 font-semibold">
                                {match.goldEarned ? `${(match.goldEarned / 1000).toFixed(1)}k` : '-'}
                              </div>
                              <div className="text-blue-300 text-[8px]">
                                {((match.totalMinionsKilled || 0) + (match.neutralMinionsKilled || 0))} CS
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-gray-400 text-[8px]">Vision</div>
                              <div className="text-purple-400 font-semibold">{playerData.visionScore || 0}</div>
                              <div className="text-gray-500 text-[8px]">
                                {match.wardsPlaced || 0}W {match.wardsKilled || 0}K
                              </div>
                            </div>
                          </div>

                          {/* Items */}
                          <div className="flex gap-0.5">
                            {match.items?.slice(0, 7).map((itemId, idx) => (
                              <div
                                key={idx}
                                className={`w-6 h-6 rounded ${idx === 6 ? 'border border-purple-500/30' : ''} overflow-hidden ${
                                  itemId === 0 ? 'bg-black/40 border border-white/10' : 'bg-black/60'
                                }`}
                              >
                                {itemId !== 0 ? (
                                  <img
                                    src={`${getItemImageUrl(itemId, ddragonVersion)}`}
                                    alt={`Item ${itemId}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full"></div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Teammates */}
                  {match.teammates && match.teammates.map((teammate, index) => {
                    const badge = getRankBadge(teammate.rank || 10);
                    const isMVP = teammate.rank === 1;
                    const isTopThree = teammate.rank && teammate.rank <= 3;
                    const kda = teammate.deaths === 0 ? 'Perfect' : (((teammate.kills || 0) + (teammate.assists || 0)) / (teammate.deaths || 1)).toFixed(2);

                    return (
                      <div key={`teammate-${index}`} className={`bg-gradient-to-r p-2 rounded-lg border ${
                        isMVP ? 'from-yellow-500/10 to-yellow-500/5 border-yellow-500/30' :
                        isTopThree ? 'from-blue-500/10 to-blue-500/5 border-blue-500/20' :
                        'from-blue-500/5 to-transparent border-blue-500/10'
                      }`}>
                        <div className="grid grid-cols-[auto_auto_1fr_auto_auto_auto] gap-1.5 items-center">
                          {/* Rang */}
                          <div className={`relative w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 ${badge.container} ${badge.glow ? 'rank-mvp-shimmer' : ''}`}>
                            <div className={`flex flex-col items-center justify-center ${badge.text} relative z-10`}>
                              {badge.showIcon && (
                                <svg className="w-2.5 h-2.5 mb-0.5" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                </svg>
                              )}
                              <span className="text-[8px] leading-none font-bold">{badge.label}</span>
                            </div>
                          </div>

                          {/* Champion + Sorts */}
                          <div className="flex items-center gap-1">
                            <div className="relative">
                              <div className={`w-11 h-11 rounded-lg overflow-hidden border-2 ${teammate.participantId ? getPlayerColor(teammate.participantId).border : 'border-blue-500'} flex-shrink-0`}>
                                <img
                                  src={`${getChampionImageUrl(teammate.championName, ddragonVersion)}`}
                                  alt={teammate.championName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="absolute -bottom-0.5 -right-0.5 bg-black/90 text-white text-[8px] px-1 rounded font-bold">
                                {teammate.champLevel || 1}
                              </div>
                            </div>
                            {/* Summoner Spells */}
                            <div className="flex flex-col gap-0.5">
                              <div className="w-4 h-4 rounded bg-black/60 overflow-hidden">
                                {teammate.summoner1Id && (
                                  <img
                                    src={`${getSummonerSpellImageUrl(getSummonerSpellName(teammate.summoner1Id), ddragonVersion)}`}
                                    alt="Summoner 1"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                )}
                              </div>
                              <div className="w-4 h-4 rounded bg-black/60 overflow-hidden">
                                {teammate.summoner2Id && (
                                  <img
                                    src={`${getSummonerSpellImageUrl(getSummonerSpellName(teammate.summoner2Id), ddragonVersion)}`}
                                    alt="Summoner 2"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Nom + KDA */}
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs text-white font-semibold truncate">{teammate.summonerName}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400">{teammate.championName}</span>
                              <div className="text-[11px] text-white font-semibold whitespace-nowrap">
                                {teammate.kills || 0}/{teammate.deaths || 0}/{teammate.assists || 0}
                                <span className={`ml-1 text-[9px] font-bold ${kda === 'Perfect' ? 'text-yellow-400' : parseFloat(kda) >= 3 ? 'text-green-400' : 'text-gray-400'}`}>
                                  ({kda})
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Stats compactes */}
                          <div className="flex gap-2 text-[10px]">
                            <div className="text-center">
                              <div className="text-gray-400 text-[8px]">DMG</div>
                              <div className="text-red-400 font-semibold">
                                {teammate.totalDamageDealtToChampions ? `${(teammate.totalDamageDealtToChampions / 1000).toFixed(0)}k` : '-'}
                              </div>
                              <div className="text-gray-500 text-[8px]">
                                {teammate.totalDamageTaken ? `${(teammate.totalDamageTaken / 1000).toFixed(0)}k` : '-'}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-gray-400 text-[8px]">Gold</div>
                              <div className="text-yellow-400 font-semibold">
                                {teammate.goldEarned ? `${(teammate.goldEarned / 1000).toFixed(1)}k` : '-'}
                              </div>
                              <div className="text-blue-300 text-[8px]">
                                {((teammate.totalMinionsKilled || 0) + (teammate.neutralMinionsKilled || 0))} CS
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-gray-400 text-[8px]">Vision</div>
                              <div className="text-purple-400 font-semibold">{teammate.visionScore || 0}</div>
                              <div className="text-gray-500 text-[8px]">
                                {teammate.wardsPlaced || 0}W {teammate.wardsKilled || 0}K
                              </div>
                            </div>
                          </div>

                          {/* Items */}
                          <div className="flex gap-0.5">
                            {teammate.items?.slice(0, 7).map((itemId, idx) => (
                              <div
                                key={idx}
                                className={`w-6 h-6 rounded ${idx === 6 ? 'border border-purple-500/30' : ''} overflow-hidden ${
                                  itemId === 0 ? 'bg-black/40 border border-white/10' : 'bg-black/60'
                                }`}
                              >
                                {itemId !== 0 ? (
                                  <img
                                    src={`${getItemImageUrl(itemId, ddragonVersion)}`}
                                    alt={`Item ${itemId}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full"></div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Red team (Ennemis) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '1rem' }}>
                  <div className="text-xs font-bold text-red-400" style={{ marginBottom: '0.5rem' }}>Red Team</div>

                  {match.enemies && match.enemies.map((enemy, index) => {
                    const badge = getRankBadge(enemy.rank || 10);
                    const isMVP = enemy.rank === 1;
                    const isTopThree = enemy.rank && enemy.rank <= 3;
                    const kda = enemy.deaths === 0 ? 'Perfect' : (((enemy.kills || 0) + (enemy.assists || 0)) / (enemy.deaths || 1)).toFixed(2);

                    return (
                      <div key={`enemy-${index}`} className={`bg-gradient-to-r p-2 rounded-lg border ${
                        isMVP ? 'from-yellow-500/10 to-yellow-500/5 border-yellow-500/30' :
                        isTopThree ? 'from-red-500/10 to-red-500/5 border-red-500/20' :
                        'from-red-500/5 to-transparent border-red-500/10'
                      }`}>
                        <div className="grid grid-cols-[auto_auto_1fr_auto_auto_auto] gap-1.5 items-center">
                          {/* Rang */}
                          <div className={`relative w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0 ${badge.container} ${badge.glow ? 'rank-mvp-shimmer' : ''}`}>
                            <div className={`flex flex-col items-center justify-center ${badge.text} relative z-10`}>
                              {badge.showIcon && (
                                <svg className="w-2.5 h-2.5 mb-0.5" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                </svg>
                              )}
                              <span className="text-[8px] leading-none font-bold">{badge.label}</span>
                            </div>
                          </div>

                          {/* Champion + Sorts */}
                          <div className="flex items-center gap-1">
                            <div className="relative">
                              <div className={`w-11 h-11 rounded-lg overflow-hidden border-2 ${enemy.participantId ? getPlayerColor(enemy.participantId).border : 'border-red-500'} flex-shrink-0`}>
                                <img
                                  src={`${getChampionImageUrl(enemy.championName, ddragonVersion)}`}
                                  alt={enemy.championName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="absolute -bottom-0.5 -right-0.5 bg-black/90 text-white text-[8px] px-1 rounded font-bold">
                                {enemy.champLevel || 1}
                              </div>
                            </div>
                            {/* Summoner Spells */}
                            <div className="flex flex-col gap-0.5">
                              <div className="w-4 h-4 rounded bg-black/60 overflow-hidden">
                                {enemy.summoner1Id && (
                                  <img
                                    src={`${getSummonerSpellImageUrl(getSummonerSpellName(enemy.summoner1Id), ddragonVersion)}`}
                                    alt="Summoner 1"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                )}
                              </div>
                              <div className="w-4 h-4 rounded bg-black/60 overflow-hidden">
                                {enemy.summoner2Id && (
                                  <img
                                    src={`${getSummonerSpellImageUrl(getSummonerSpellName(enemy.summoner2Id), ddragonVersion)}`}
                                    alt="Summoner 2"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Nom + KDA */}
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs text-white font-semibold truncate">{enemy.summonerName}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400">{enemy.championName}</span>
                              <div className="text-[11px] text-white font-semibold whitespace-nowrap">
                                {enemy.kills || 0}/{enemy.deaths || 0}/{enemy.assists || 0}
                                <span className={`ml-1 text-[9px] font-bold ${kda === 'Perfect' ? 'text-yellow-400' : parseFloat(kda) >= 3 ? 'text-green-400' : 'text-gray-400'}`}>
                                  ({kda})
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Stats compactes */}
                          <div className="flex gap-2 text-[10px]">
                            <div className="text-center">
                              <div className="text-gray-400 text-[8px]">DMG</div>
                              <div className="text-red-400 font-semibold">
                                {enemy.totalDamageDealtToChampions ? `${(enemy.totalDamageDealtToChampions / 1000).toFixed(0)}k` : '-'}
                              </div>
                              <div className="text-gray-500 text-[8px]">
                                {enemy.totalDamageTaken ? `${(enemy.totalDamageTaken / 1000).toFixed(0)}k` : '-'}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-gray-400 text-[8px]">Gold</div>
                              <div className="text-yellow-400 font-semibold">
                                {enemy.goldEarned ? `${(enemy.goldEarned / 1000).toFixed(1)}k` : '-'}
                              </div>
                              <div className="text-blue-300 text-[8px]">
                                {((enemy.totalMinionsKilled || 0) + (enemy.neutralMinionsKilled || 0))} CS
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-gray-400 text-[8px]">Vision</div>
                              <div className="text-purple-400 font-semibold">{enemy.visionScore || 0}</div>
                              <div className="text-gray-500 text-[8px]">
                                {enemy.wardsPlaced || 0}W {enemy.wardsKilled || 0}K
                              </div>
                            </div>
                          </div>

                          {/* Items */}
                          <div className="flex gap-0.5">
                            {enemy.items?.slice(0, 7).map((itemId, idx) => (
                              <div
                                key={idx}
                                className={`w-6 h-6 rounded ${idx === 6 ? 'border border-purple-500/30' : ''} overflow-hidden ${
                                  itemId === 0 ? 'bg-black/40 border border-white/10' : 'bg-black/60'
                                }`}
                              >
                                {itemId !== 0 ? (
                                  <img
                                    src={`${getItemImageUrl(itemId, ddragonVersion)}`}
                                    alt={`Item ${itemId}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full"></div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ONGLET PROBABILITÉ */}
            {activeTab === 'probability' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center', padding: '2rem 2rem' }}>
                <h4 className="text-base font-bold text-white flex items-center" style={{ gap: '0.5rem' }}>
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Win Probability
                </h4>

                {!probabilityResult ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', maxWidth: '500px', textAlign: 'center', width: '100%' }}>
                    {!isCalculatingProbability ? (
                      <>
                        <p className="text-sm text-[var(--text-secondary)]" style={{ lineHeight: '1.6', padding: '0 1rem' }}>
                          Calculate the win probability based on player statistics, champion mastery, recent form, and team composition.
                        </p>
                        <button
                          onClick={calculateProbability}
                          className="rounded-xl font-semibold text-white transition-all duration-300"
                          style={{
                            padding: '0.875rem 1.75rem',
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
                            cursor: 'pointer',
                          }}
                        >
                          <span className="flex items-center" style={{ gap: '0.5rem' }}>
                            <Zap className="w-5 h-5" />
                            Calculate Probability
                          </span>
                        </button>
                      </>
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        width: '100%',
                        maxWidth: '500px',
                        padding: '2rem',
                        background: 'rgba(139, 92, 246, 0.1)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '1rem',
                      }}>
                        {/* Spinner et message */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                          <svg className="animate-spin h-12 w-12 text-purple-400" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                            <span className="text-base font-semibold text-white">
                              {loadingMessage || 'Loading...'}
                            </span>
                            <span className="text-sm text-purple-300 font-medium">
                              {loadingProgress}%
                            </span>
                          </div>
                        </div>

                        {/* Barre de progression */}
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div
                            className="w-full rounded-full overflow-hidden"
                            style={{
                              height: '8px',
                              backgroundColor: 'rgba(139, 92, 246, 0.2)',
                            }}
                          >
                            <div
                              className="rounded-full transition-all duration-500 ease-out"
                              style={{
                                height: '8px',
                                width: `${loadingProgress}%`,
                                background: 'linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%)',
                                boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)',
                              }}
                            />
                          </div>
                          <p className="text-xs text-center text-gray-400">
                            Fetching real-time data from Riot Games API
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '2rem', width: '100%', alignItems: 'center', padding: '0 1rem' }}>
                    {/* Colonne gauche - Camembert */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                      <svg width="240" height="240" viewBox="0 0 240 240" style={{ filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.3))' }}>
                        <defs>
                          <linearGradient id="yourTeamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: match.win ? '#10b981' : '#3b82f6', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: match.win ? '#059669' : '#2563eb', stopOpacity: 1 }} />
                          </linearGradient>
                          <linearGradient id="opponentTeamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#ef4444', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#dc2626', stopOpacity: 1 }} />
                          </linearGradient>
                        </defs>

                        {/* Cercle de fond */}
                        <circle cx="120" cy="120" r="100" fill="rgba(255, 255, 255, 0.05)" />

                        {/* Arc pour l'équipe adverse (commence à 0) */}
                        <path
                          d={(() => {
                            const angle = (100 - probabilityResult.winProbability) * 3.6;
                            const startAngle = 0;
                            const endAngle = angle;
                            const startRad = (startAngle - 90) * Math.PI / 180;
                            const endRad = (endAngle - 90) * Math.PI / 180;
                            const x1 = 120 + 100 * Math.cos(startRad);
                            const y1 = 120 + 100 * Math.sin(startRad);
                            const x2 = 120 + 100 * Math.cos(endRad);
                            const y2 = 120 + 100 * Math.sin(endRad);
                            const largeArc = angle > 180 ? 1 : 0;
                            return `M 120 120 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`;
                          })()}
                          fill="url(#opponentTeamGradient)"
                        />

                        {/* Arc pour votre équipe */}
                        <path
                          d={(() => {
                            const startAngle = (100 - probabilityResult.winProbability) * 3.6;
                            const angle = probabilityResult.winProbability * 3.6;
                            const endAngle = startAngle + angle;
                            const startRad = (startAngle - 90) * Math.PI / 180;
                            const endRad = (endAngle - 90) * Math.PI / 180;
                            const x1 = 120 + 100 * Math.cos(startRad);
                            const y1 = 120 + 100 * Math.sin(startRad);
                            const x2 = 120 + 100 * Math.cos(endRad);
                            const y2 = 120 + 100 * Math.sin(endRad);
                            const largeArc = angle > 180 ? 1 : 0;
                            return `M 120 120 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`;
                          })()}
                          fill="url(#yourTeamGradient)"
                        />

                        {/* Cercle intérieur (donut) */}
                        <circle cx="120" cy="120" r="70" fill="rgba(0, 0, 0, 0.8)" />

                        {/* Texte au centre - bien centré */}
                        <text x="120" y="120" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="42" fontWeight="bold" fontFamily="Rajdhani">
                          {probabilityResult.winProbability}%
                        </text>
                        <text x="120" y="142" textAnchor="middle" dominantBaseline="middle" fill="rgba(255, 255, 255, 0.6)" fontSize="13" fontFamily="Rajdhani">
                          win chance
                        </text>
                      </svg>

                      {/* Badge de confiance */}
                      <WinProbabilityBadge
                        probability={probabilityResult.winProbability}
                        confidence={probabilityResult.confidence}
                        showBar={false}
                        size="small"
                      />
                    </div>

                    {/* Colonne droite - Détails */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
                      {/* Détails des scores */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border" style={{
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
                          borderColor: 'rgba(59, 130, 246, 0.3)',
                          padding: '1.25rem',
                        }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-blue-400">VOTRE ÉQUIPE</span>
                            <Castle className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="text-2xl font-bold text-white font-['Rajdhani']">
                            {probabilityResult.teamScore.toFixed(1)}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)] mt-1">
                            Team Score
                          </div>
                        </div>

                        <div className="rounded-xl border" style={{
                          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                          borderColor: 'rgba(239, 68, 68, 0.3)',
                          padding: '1.25rem',
                        }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-red-400">ÉQUIPE ADVERSE</span>
                            <Swords className="w-4 h-4 text-red-400" />
                          </div>
                          <div className="text-2xl font-bold text-white font-['Rajdhani']">
                            {probabilityResult.opponentScore.toFixed(1)}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)] mt-1">
                            Team Score
                          </div>
                        </div>
                      </div>

                      {/* Légende */}
                      <div className="flex items-center justify-center" style={{ gap: '2rem' }}>
                        <div className="flex items-center" style={{ gap: '0.5rem' }}>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '4px',
                            background: match.win ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          }} />
                          <span className="text-sm text-[var(--text-secondary)]">Your Team</span>
                        </div>
                        <div className="flex items-center" style={{ gap: '0.5rem' }}>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '4px',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          }} />
                          <span className="text-sm text-[var(--text-secondary)]">Enemy Team</span>
                        </div>
                      </div>

                      {/* Note explicative */}
                      <div className="rounded-lg border border-white/10" style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem' }}>
                        <p className="text-xs text-[var(--text-secondary)]" style={{ lineHeight: '1.6' }}>
                          <strong className="text-white">Note:</strong> This probability is calculated using a deterministic algorithm based on ELO, champion mastery, recent form, role fit, and team composition. It does not account for specific champion matchups.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
