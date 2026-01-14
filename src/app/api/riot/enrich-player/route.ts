import { NextRequest, NextResponse } from 'next/server';

const RIOT_API_KEY = process.env.RIOT_API_KEY;

if (!RIOT_API_KEY) {
  throw new Error('RIOT_API_KEY is not defined in environment variables');
}

// Mapping des régions
const REGION_TO_PLATFORM: { [key: string]: string } = {
  'americas': 'na1',
  'europe': 'euw1',
  'asia': 'kr',
};

// Normaliser les positions Riot en rôles standard
function normalizeRolePosition(position: string): 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT' {
  const positionMap: { [key: string]: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT' } = {
    'TOP': 'TOP',
    'JUNGLE': 'JUNGLE',
    'MIDDLE': 'MID',
    'MID': 'MID',
    'BOTTOM': 'ADC',
    'BOT': 'ADC',
    'UTILITY': 'SUPPORT',
    'SUPPORT': 'SUPPORT',
  };
  return positionMap[position] || 'MID';
}

interface EnrichPlayerRequest {
  summonerName: string;
  puuid: string;
  championName: string;
  region: string;
  tier?: string;
  division?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: EnrichPlayerRequest = await request.json();
    const { summonerName, puuid, championName, region, tier, division } = body;

    if (!puuid || !championName || !region) {
      return NextResponse.json(
        { error: 'Missing required fields: puuid, championName, region' },
        { status: 400 }
      );
    }

    const platform = REGION_TO_PLATFORM[region] || 'euw1';

    // 1. Récupérer les informations du summoner pour avoir l'encrypted summonerId
    const summonerResponse = await fetch(
      `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
      {
        headers: { 'X-Riot-Token': RIOT_API_KEY as string },
      }
    );

    if (!summonerResponse.ok) {
      console.error('Failed to fetch summoner:', await summonerResponse.text());
      return NextResponse.json(
        { error: 'Failed to fetch summoner data' },
        { status: summonerResponse.status }
      );
    }

    const summonerData = await summonerResponse.json();
    const encryptedSummonerId = summonerData.id;

    // 2. Récupérer la maîtrise du champion
    let championMastery = 0;
    let gamesOnChampion = 0;
    let championId = 0;

    // Récupérer l'ID du champion depuis Data Dragon
    try {
      const championsResponse = await fetch(
        'https://ddragon.leagueoflegends.com/cdn/15.1.1/data/en_US/champion.json'
      );
      const championsData = await championsResponse.json();

      const championData = Object.values(championsData.data).find(
        (champ: any) => champ.name === championName || champ.id === championName
      ) as any;

      if (championData) {
        championId = parseInt(championData.key);
      }
    } catch (error) {
      console.error('Error fetching champion data:', error);
    }

    if (championId) {
      try {
        const masteryResponse = await fetch(
          `https://${platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/by-champion/${championId}`,
          {
            headers: { 'X-Riot-Token': RIOT_API_KEY as string },
          }
        );

        if (masteryResponse.ok) {
          const masteryData = await masteryResponse.json();
          championMastery = masteryData.championLevel || 0;
          gamesOnChampion = masteryData.championPoints ? Math.floor(masteryData.championPoints / 1000) : 0;
        }
      } catch (error) {
        console.error('Error fetching champion mastery:', error);
      }
    }

    // 3. Récupérer l'historique de matchs (20 derniers matchs ranked)
    const matchHistoryResponse = await fetch(
      `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?type=ranked&start=0&count=20`,
      {
        headers: { 'X-Riot-Token': RIOT_API_KEY as string },
      }
    );

    let recentMatches: any[] = [];
    let totalGames = 0;
    let totalWins = 0;
    let gamesOnChampionCount = 0;
    let winsOnChampion = 0;
    let kdaOnChampion = 0;
    let recentWins = 0;
    let currentStreak = 0;
    let lastGameTimestamp = 0;
    let recentRoles: string[] = [];

    if (matchHistoryResponse.ok) {
      const matchIds = await matchHistoryResponse.json();
      totalGames = matchIds.length;

      // Récupérer les détails de chaque match
      for (const matchId of matchIds) {
        try {
          const matchResponse = await fetch(
            `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
            {
              headers: { 'X-Riot-Token': RIOT_API_KEY as string },
            }
          );

          if (matchResponse.ok) {
            const matchData = await matchResponse.json();
            const participant = matchData.info.participants.find(
              (p: any) => p.puuid === puuid
            );

            if (participant) {
              // Détecter le rôle joué (utiliser teamPosition ou individualPosition)
              const rolePosition = participant.teamPosition || participant.individualPosition || 'UTILITY';
              const normalizedRole = normalizeRolePosition(rolePosition);
              recentRoles.push(normalizedRole);

              recentMatches.push({
                championName: participant.championName,
                win: participant.win,
                kills: participant.kills,
                deaths: participant.deaths,
                assists: participant.assists,
                timestamp: matchData.info.gameCreation,
                role: normalizedRole,
              });

              // Compter les wins
              if (participant.win) {
                totalWins++;
              }

              // Stats sur le champion spécifique
              if (participant.championName === championName) {
                gamesOnChampionCount++;
                if (participant.win) {
                  winsOnChampion++;
                }
                const kda = (participant.kills + participant.assists) / Math.max(1, participant.deaths);
                kdaOnChampion += kda;
              }

              // Dernière game pour calcul inactivité
              if (matchData.info.gameCreation > lastGameTimestamp) {
                lastGameTimestamp = matchData.info.gameCreation;
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching match ${matchId}:`, error);
        }
      }

      // Calculer les 10 derniers matchs pour recent wins
      const last10 = recentMatches.slice(0, 10);
      recentWins = last10.filter(m => m.win).length;

      // Calculer le streak
      if (recentMatches.length > 0) {
        const lastResult = recentMatches[0].win;
        currentStreak = lastResult ? 1 : -1;

        for (let i = 1; i < recentMatches.length; i++) {
          if (recentMatches[i].win === lastResult) {
            currentStreak += lastResult ? 1 : -1;
          } else {
            break;
          }
        }
      }

      // Calculer KDA moyen sur champion
      if (gamesOnChampionCount > 0) {
        kdaOnChampion = kdaOnChampion / gamesOnChampionCount;
      }
    }

    // 4. Récupérer les informations de league (rank, LP)
    let leaguePoints = 0;
    let actualTier = tier || 'UNRANKED';
    let actualDivision = division || null;

    try {
      const leagueResponse = await fetch(
        `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encryptedSummonerId}`,
        {
          headers: { 'X-Riot-Token': RIOT_API_KEY as string },
        }
      );

      if (leagueResponse.ok) {
        const leagueData = await leagueResponse.json();
        const rankedSolo = leagueData.find((entry: any) => entry.queueType === 'RANKED_SOLO_5x5');

        if (rankedSolo) {
          actualTier = rankedSolo.tier;
          actualDivision = rankedSolo.rank;
          leaguePoints = rankedSolo.leaguePoints;
        }
      }
    } catch (error) {
      console.error('Error fetching league data:', error);
    }

    // Calculer les jours depuis la dernière game
    const daysSinceLastGame = lastGameTimestamp
      ? Math.floor((Date.now() - lastGameTimestamp) / (1000 * 60 * 60 * 24))
      : 999;

    // Construire la réponse enrichie
    const enrichedData = {
      summonerName: summonerName || summonerData.name,
      tier: actualTier,
      division: actualDivision,
      leaguePoints,
      championMastery,
      gamesOnChampion: Math.max(gamesOnChampionCount, gamesOnChampion),
      winrateOnChampion: gamesOnChampionCount > 0
        ? Math.round((winsOnChampion / gamesOnChampionCount) * 100)
        : 50,
      kdaOnChampion: kdaOnChampion > 0 ? Number(kdaOnChampion.toFixed(2)) : 2.0,
      globalWinrate: totalGames > 0
        ? Math.round((totalWins / totalGames) * 100)
        : 50,
      totalGames,
      recentWins,
      recentGames: Math.min(10, totalGames),
      currentStreak,
      daysSinceLastGame,
      recentRoles, // Historique des rôles joués
    };

    return NextResponse.json(enrichedData);

  } catch (error) {
    console.error('Error enriching player data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
