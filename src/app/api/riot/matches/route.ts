import { NextRequest, NextResponse } from 'next/server';

// Cache for 1 hour - new matches are frequent
export const revalidate = 3600;

const RIOT_API_KEY = process.env.RIOT_API_KEY;

interface RiotMatch {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameMode: string;
    queueId: number;
    participants: Array<{
      puuid: string;
      participantId: number;
      championName: string;
      kills: number;
      deaths: number;
      assists: number;
      win: boolean;
      teamId: number;
      summonerName?: string;
      riotIdGameName?: string;
      item0?: number;
      item1?: number;
      item2?: number;
      item3?: number;
      item4?: number;
      item5?: number;
      item6?: number;
      totalDamageDealtToChampions?: number;
      goldEarned?: number;
      totalMinionsKilled?: number;
      neutralMinionsKilled?: number;
      visionScore?: number;
      champLevel?: number;
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
      individualPosition?: string;
      teamPosition?: string;
      lane?: string;
      role?: string;
    }>;
  };
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

// Calculer le score de performance d'un joueur
const calculatePlayerScore = (participant: any, gameDuration: number) => {
  // KDA Score (0-100)
  const kills = participant.kills || 0;
  const deaths = participant.deaths || 0;
  const assists = participant.assists || 0;
  const kda = deaths === 0 ? (kills + assists) * 1.2 : (kills + assists) / deaths;
  const kdaScore = Math.min(kda * 10, 100); // Max 100

  // Damage Score (0-100) - normalisé plus tard
  const damage = participant.totalDamageDealtToChampions || 0;

  // Gold Score (0-100) - normalisé plus tard
  const gold = participant.goldEarned || 0;

  // CS Score (0-100)
  const cs = (participant.totalMinionsKilled || 0) + (participant.neutralMinionsKilled || 0);
  const csPerMin = cs / (gameDuration / 60);
  const csScore = Math.min(csPerMin * 10, 100); // 10 CS/min = 100 points

  // Vision Score (0-100)
  const vision = participant.visionScore || 0;
  const visionPerMin = vision / (gameDuration / 60);
  const visionScore = Math.min(visionPerMin * 20, 100); // 5 vision/min = 100 points

  // Participation aux kills (0-100) - calculé plus tard avec les kills de l'équipe

  return {
    puuid: participant.puuid,
    kdaScore,
    damage,
    gold,
    csScore,
    visionScore,
    kills,
    assists,
    win: participant.win,
  };
};

// Calculer les rangs de tous les joueurs d'une partie
const calculatePlayerRankings = (match: RiotMatch): Map<string, number> => {
  const participants = match.info.participants;

  // Calculer les scores de base pour chaque joueur
  const playerScores = participants.map(p => ({
    ...calculatePlayerScore(p, match.info.gameDuration),
    teamId: p.teamId,
  }));

  // Trouver les valeurs max pour normalisation
  const maxDamage = Math.max(...playerScores.map(p => p.damage), 1);
  const maxGold = Math.max(...playerScores.map(p => p.gold), 1);

  // Calculer les kills totaux par équipe pour la participation
  const teamKills: { [key: number]: number } = {};
  participants.forEach(p => {
    if (!teamKills[p.teamId]) teamKills[p.teamId] = 0;
    teamKills[p.teamId] += p.kills || 0;
  });

  // Calculer le score final pour chaque joueur
  const finalScores = playerScores.map(player => {
    const participant = participants.find(p => p.puuid === player.puuid)!;

    // Normaliser damage et gold
    const damageScore = (player.damage / maxDamage) * 100;
    const goldScore = (player.gold / maxGold) * 100;

    // Kill participation
    const teamKillTotal = teamKills[player.teamId] || 1;
    const killParticipation = ((player.kills + player.assists) / teamKillTotal) * 100;
    const participationScore = Math.min(killParticipation, 100);

    // Poids des différentes métriques
    const weights = {
      kda: 0.25,        // 25% - KDA
      damage: 0.25,     // 25% - Dégâts
      gold: 0.15,       // 15% - Gold
      cs: 0.10,         // 10% - CS
      vision: 0.10,     // 10% - Vision
      participation: 0.15, // 15% - Participation aux kills
    };

    // Score total (0-100)
    let totalScore =
      player.kdaScore * weights.kda +
      damageScore * weights.damage +
      goldScore * weights.gold +
      player.csScore * weights.cs +
      player.visionScore * weights.vision +
      participationScore * weights.participation;

    // Bonus de victoire (5%)
    if (player.win) {
      totalScore *= 1.05;
    }

    return {
      puuid: player.puuid,
      totalScore,
    };
  });

  // Trier par score décroissant
  finalScores.sort((a, b) => b.totalScore - a.totalScore);

  // Créer la map avec les rangs (1 = meilleur, 10 = pire)
  const rankings = new Map<string, number>();
  finalScores.forEach((player, index) => {
    rankings.set(player.puuid, index + 1);
  });

  return rankings;
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const gameName = searchParams.get('gameName');
  const tagLine = searchParams.get('tagLine');
  const platformRegion = searchParams.get('region') || 'euw1';
  const region = getRoutingValue(platformRegion);
  const providedPuuid = searchParams.get('puuid'); // Nouveau: accepter le PUUID directement
  const start = parseInt(searchParams.get('start') || '0', 10); // Position de départ
  const count = parseInt(searchParams.get('count') || '20', 10); // Nombre de matchs à récupérer

  if (!RIOT_API_KEY) {
    return NextResponse.json(
      { error: 'API key Riot non configurée' },
      { status: 500 }
    );
  }

  try {
    let puuid = providedPuuid;

    // Si le PUUID n'est pas fourni, le récupérer via gameName/tagLine
    if (!puuid) {
      if (!gameName || !tagLine) {
        return NextResponse.json(
          { error: 'gameName et tagLine (ou puuid) sont requis' },
          { status: 400 }
        );
      }

      // 1. Récupérer le PUUID du joueur
      const accountResponse = await fetch(
        `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
        {
          headers: {
            'X-Riot-Token': RIOT_API_KEY as string,
          },
        }
      );

      if (!accountResponse.ok) {
        if (accountResponse.status === 404) {
          return NextResponse.json(
            { error: 'Compte Riot non trouvé' },
            { status: 404 }
          );
        }
        if (accountResponse.status === 429) {
          return NextResponse.json(
            { error: 'Limite de requêtes atteinte. Veuillez réessayer dans quelques secondes.' },
            { status: 429 }
          );
        }
        console.error(`Erreur API Riot Account: ${accountResponse.status} - ${accountResponse.statusText}`);
        return NextResponse.json(
          { error: `Erreur API Riot (${accountResponse.status})` },
          { status: accountResponse.status }
        );
      }

      const accountData = await accountResponse.json();
      puuid = accountData.puuid;
    }

    // 2. Récupérer les IDs des parties avec pagination
    const matchlistResponse = await fetch(
      `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`,
      {
        headers: {
          'X-Riot-Token': RIOT_API_KEY,
        },
      }
    );

    if (!matchlistResponse.ok) {
      console.error(`Erreur API Riot Match List: ${matchlistResponse.status}`);
      return NextResponse.json(
        { error: `Erreur lors de la récupération de la liste des matches (${matchlistResponse.status})` },
        { status: matchlistResponse.status }
      );
    }

    const matchIds: string[] = await matchlistResponse.json();

    // 3. Récupérer les détails de chaque match de manière séquentielle
    const limitedMatchIds = matchIds;
    const matchDetails: (RiotMatch | null)[] = [];

    for (let i = 0; i < limitedMatchIds.length; i++) {
      const matchId = limitedMatchIds[i];

      // Ajouter un délai entre chaque requête pour respecter le rate limit
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      try {
        const matchResponse = await fetch(
          `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
          {
            headers: {
              'X-Riot-Token': RIOT_API_KEY as string,
            },
          }
        );

        if (!matchResponse.ok) {
          console.error(`Erreur pour le match ${matchId}: ${matchResponse.status}`);
          matchDetails.push(null);
          continue;
        }

        const matchData = await matchResponse.json();
        matchDetails.push(matchData);
      } catch (error) {
        console.error(`Erreur lors de la récupération du match ${matchId}:`, error);
        matchDetails.push(null);
      }
    }

    // 4. Formater les données pour le frontend
    const formattedMatches = matchDetails
      .filter((match): match is RiotMatch => match !== null)
      .map((match) => {
        const participantData = match.info.participants.find(
          (p) => p.puuid === puuid
        );

        if (!participantData) return null;

        // Calculer les rangs de tous les joueurs
        const rankings = calculatePlayerRankings(match);

        // Trouver la team du joueur
        const playerTeamId = participantData.teamId;

        // Récupérer les coéquipiers (même team, sans le joueur lui-même)
        const teammates = match.info.participants
          .filter((p) => p.teamId === playerTeamId && p.puuid !== puuid)
          .map((p) => ({
            puuid: p.puuid,
            participantId: p.participantId,
            championName: p.championName,
            summonerName: p.summonerName || p.riotIdGameName || 'Unknown',
            kills: p.kills,
            deaths: p.deaths,
            assists: p.assists,
            items: [p.item0 || 0, p.item1 || 0, p.item2 || 0, p.item3 || 0, p.item4 || 0, p.item5 || 0, p.item6 || 0],
            totalDamageDealtToChampions: p.totalDamageDealtToChampions,
            goldEarned: p.goldEarned,
            totalMinionsKilled: p.totalMinionsKilled,
            neutralMinionsKilled: p.neutralMinionsKilled,
            visionScore: p.visionScore,
            champLevel: p.champLevel,
            rank: rankings.get(p.puuid) || 10,
            summoner1Id: p.summoner1Id,
            summoner2Id: p.summoner2Id,
            perks: p.perks,
            totalDamageTaken: p.totalDamageTaken,
            wardsPlaced: p.wardsPlaced,
            wardsKilled: p.wardsKilled,
          }));

        // Récupérer les ennemis (team adverse)
        const enemies = match.info.participants
          .filter((p) => p.teamId !== playerTeamId)
          .map((p) => ({
            puuid: p.puuid,
            participantId: p.participantId,
            championName: p.championName,
            summonerName: p.summonerName || p.riotIdGameName || 'Unknown',
            kills: p.kills,
            deaths: p.deaths,
            assists: p.assists,
            items: [p.item0 || 0, p.item1 || 0, p.item2 || 0, p.item3 || 0, p.item4 || 0, p.item5 || 0, p.item6 || 0],
            totalDamageDealtToChampions: p.totalDamageDealtToChampions,
            goldEarned: p.goldEarned,
            totalMinionsKilled: p.totalMinionsKilled,
            neutralMinionsKilled: p.neutralMinionsKilled,
            visionScore: p.visionScore,
            champLevel: p.champLevel,
            rank: rankings.get(p.puuid) || 10,
            summoner1Id: p.summoner1Id,
            summoner2Id: p.summoner2Id,
            perks: p.perks,
            totalDamageTaken: p.totalDamageTaken,
            wardsPlaced: p.wardsPlaced,
            wardsKilled: p.wardsKilled,
          }));

        return {
          matchId: match.metadata.matchId,
          champion: participantData.championName,
          kills: participantData.kills,
          deaths: participantData.deaths,
          assists: participantData.assists,
          win: participantData.win,
          gameMode: match.info.gameMode,
          queueId: match.info.queueId,
          gameDuration: match.info.gameDuration,
          timestamp: match.info.gameCreation,
          teammates,
          enemies,
          // Stats détaillées du joueur
          participantId: participantData.participantId, // Ajout du participantId pour le joueur principal
          summonerName: participantData.summonerName || participantData.riotIdGameName || 'You', // Ajout du summonerName pour le joueur principal
          items: [
            participantData.item0 || 0,
            participantData.item1 || 0,
            participantData.item2 || 0,
            participantData.item3 || 0,
            participantData.item4 || 0,
            participantData.item5 || 0,
            participantData.item6 || 0,
          ],
          totalDamageDealtToChampions: participantData.totalDamageDealtToChampions,
          goldEarned: participantData.goldEarned,
          totalMinionsKilled: participantData.totalMinionsKilled,
          visionScore: participantData.visionScore,
          champLevel: participantData.champLevel,
          rank: rankings.get(puuid!) || 10, // Rang du joueur (1 = MVP, 10 = pire)
          // Nouvelles stats détaillées
          summoner1Id: participantData.summoner1Id,
          summoner2Id: participantData.summoner2Id,
          perks: participantData.perks,
          totalDamageTaken: participantData.totalDamageTaken,
          physicalDamageDealtToChampions: participantData.physicalDamageDealtToChampions,
          magicDamageDealtToChampions: participantData.magicDamageDealtToChampions,
          trueDamageDealtToChampions: participantData.trueDamageDealtToChampions,
          totalHeal: participantData.totalHeal,
          totalDamageShieldedOnTeammates: participantData.totalDamageShieldedOnTeammates,
          damageSelfMitigated: participantData.damageSelfMitigated,
          wardsPlaced: participantData.wardsPlaced,
          wardsKilled: participantData.wardsKilled,
          detectorWardsPlaced: participantData.detectorWardsPlaced,
          doubleKills: participantData.doubleKills,
          tripleKills: participantData.tripleKills,
          quadraKills: participantData.quadraKills,
          pentaKills: participantData.pentaKills,
          largestKillingSpree: participantData.largestKillingSpree,
          largestMultiKill: participantData.largestMultiKill,
          firstBloodKill: participantData.firstBloodKill,
          firstBloodAssist: participantData.firstBloodAssist,
          firstTowerKill: participantData.firstTowerKill,
          firstTowerAssist: participantData.firstTowerAssist,
          turretKills: participantData.turretKills,
          inhibitorKills: participantData.inhibitorKills,
          damageDealtToObjectives: participantData.damageDealtToObjectives,
          damageDealtToTurrets: participantData.damageDealtToTurrets,
          timeCCingOthers: participantData.timeCCingOthers,
          totalTimeCCDealt: participantData.totalTimeCCDealt,
          goldSpent: participantData.goldSpent,
          neutralMinionsKilled: participantData.neutralMinionsKilled,
          individualPosition: participantData.individualPosition,
          teamPosition: participantData.teamPosition,
          lane: participantData.lane,
          role: participantData.role,
        };
      })
      .filter((match) => match !== null);

    return NextResponse.json(formattedMatches);
  } catch (error) {
    console.error('Erreur lors de la récupération des matches:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json(
      { error: `Erreur lors de la récupération des matches: ${errorMessage}` },
      { status: 500 }
    );
  }
}
