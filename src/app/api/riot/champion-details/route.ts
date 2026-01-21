import { NextRequest, NextResponse } from 'next/server';

// Cache for 4 hours - champion stats over 30 matches are stable
export const revalidate = 14400;

const RIOT_API_KEY = process.env.RIOT_API_KEY;

if (!RIOT_API_KEY) {
  throw new Error('RIOT_API_KEY is not defined in environment variables');
}

interface Matchup {
  championName: string;
  games: number;
  wins: number;
  winrate: number;
}

interface ChampionDetail {
  championName: string;
  games: number;
  wins: number;
  losses: number;
  winrate: number;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  averageKills: number;
  averageDeaths: number;
  averageAssists: number;
  averageCs: number;
  averageVisionScore: number;
  averageGold: number;
  averageDamage: number;
  damagePerMinute: number;
  totalPlayTime: number; // en minutes
  bestMatchups: Matchup[];
  worstMatchups: Matchup[];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const puuid = searchParams.get('puuid');
    const region = searchParams.get('region') || 'europe';

    if (!puuid) {
      return NextResponse.json(
        { error: 'Missing required parameter: puuid' },
        { status: 400 }
      );
    }

    // Récupérer les 30 derniers matchs ranked (réduit pour éviter rate limiting)
    const matchHistoryResponse = await fetch(
      `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?type=ranked&start=0&count=30`,
      {
        headers: { 'X-Riot-Token': RIOT_API_KEY as string },
      }
    );

    if (!matchHistoryResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch match history' },
        { status: matchHistoryResponse.status }
      );
    }

    const matchIds = await matchHistoryResponse.json();

    // Attendre 2 secondes pour laisser les autres endpoints se terminer
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Structure pour tracker les stats par champion
    const championStats: {
      [key: string]: {
        games: number;
        wins: number;
        kills: number;
        deaths: number;
        assists: number;
        cs: number;
        visionScore: number;
        gold: number;
        damage: number;
        playTime: number;
        matchups: {
          [enemyChampion: string]: {
            games: number;
            wins: number;
          };
        };
      };
    } = {};

    // Récupérer les détails de chaque match avec retry sur 429
    let consecutiveErrors = 0;
    for (const matchId of matchIds) {
      try {
        let matchResponse;
        let retryCount = 0;
        const maxRetries = 3;

        // Retry logic for 429 errors
        while (retryCount < maxRetries) {
          matchResponse = await fetch(
            `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
            {
              headers: { 'X-Riot-Token': RIOT_API_KEY as string },
            }
          );

          if (matchResponse.status === 429) {
            retryCount++;
            const waitTime = Math.min(2000 * retryCount, 5000); // Backoff exponentiel
            console.log(`Rate limited, waiting ${waitTime}ms before retry ${retryCount}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            break;
          }
        }

        if (matchResponse && matchResponse.ok) {
          const matchData = await matchResponse.json();
          const participant = matchData.info.participants.find(
            (p: any) => p.puuid === puuid
          );

          if (participant) {
            const championName = participant.championName;
            const playerTeamId = participant.teamId;
            const playerPosition = participant.teamPosition || participant.individualPosition;

            if (!championStats[championName]) {
              championStats[championName] = {
                games: 0,
                wins: 0,
                kills: 0,
                deaths: 0,
                assists: 0,
                cs: 0,
                visionScore: 0,
                gold: 0,
                damage: 0,
                playTime: 0,
                matchups: {},
              };
            }

            championStats[championName].games++;
            if (participant.win) {
              championStats[championName].wins++;
            }
            championStats[championName].kills += participant.kills || 0;
            championStats[championName].deaths += participant.deaths || 0;
            championStats[championName].assists += participant.assists || 0;
            championStats[championName].cs += (participant.totalMinionsKilled || 0) + (participant.neutralMinionsKilled || 0);
            championStats[championName].visionScore += participant.visionScore || 0;
            championStats[championName].gold += participant.goldEarned || 0;
            championStats[championName].damage += participant.totalDamageDealtToChampions || 0;
            championStats[championName].playTime += (matchData.info.gameDuration || 0) / 60; // convertir en minutes

            // Tracker le matchup contre l'adversaire en lane (même position)
            let laneOpponent = null;

            if (playerPosition) {
              laneOpponent = matchData.info.participants.find(
                (p: any) =>
                  p.teamId !== playerTeamId &&
                  (p.teamPosition === playerPosition || p.individualPosition === playerPosition)
              );
            }

            // Fallback: si pas de position ou pas d'adversaire trouvé, prendre un adversaire par défaut
            // (utile pour les anciens matchs ou modes sans positions)
            if (!laneOpponent) {
              const enemyParticipants = matchData.info.participants.filter(
                (p: any) => p.teamId !== playerTeamId
              );
              // Prendre l'adversaire avec le même index de lane approximatif
              const playerIndex = matchData.info.participants.findIndex((p: any) => p.puuid === puuid);
              const enemyIndex = playerIndex >= 5 ? playerIndex - 5 : playerIndex + 5;
              laneOpponent = enemyParticipants[enemyIndex % 5] || enemyParticipants[0];
            }

            if (laneOpponent) {
              const enemyChampion = laneOpponent.championName;
              if (!championStats[championName].matchups[enemyChampion]) {
                championStats[championName].matchups[enemyChampion] = {
                  games: 0,
                  wins: 0,
                };
              }
              championStats[championName].matchups[enemyChampion].games++;
              if (participant.win) {
                championStats[championName].matchups[enemyChampion].wins++;
              }
            }
          }

          consecutiveErrors = 0; // Reset sur succès
        } else {
          consecutiveErrors++;
          console.error(`Failed to fetch match ${matchId}, status: ${matchResponse?.status}`);

          // If too many consecutive errors, stop
          if (consecutiveErrors >= 3) {
            console.error('Too many consecutive errors, stopping match fetching');
            break;
          }

          // Si c'est un 429 même après retries, augmenter le délai
          if (matchResponse?.status === 429) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }

        // Délai pour éviter le rate limit (200ms = max 5 requêtes/sec)
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        consecutiveErrors++;
        console.error(`Error fetching match ${matchId}:`, error);

        // Si trop d'erreurs consécutives, on arrête
        if (consecutiveErrors >= 3) {
          console.error('Too many consecutive errors, stopping match fetching');
          break;
        }
      }
    }

    // Calculer les statistiques détaillées pour chaque champion
    const championDetails: ChampionDetail[] = Object.entries(championStats)
      .map(([championName, stats]) => {
        const games = stats.games;
        const kda = stats.deaths === 0
          ? stats.kills + stats.assists
          : (stats.kills + stats.assists) / stats.deaths;

        // Calculer les meilleurs et pires matchups
        const matchupsList = Object.entries(stats.matchups)
          .filter(([_, matchup]) => matchup.games >= 1) // Au moins 1 game (on track que la lane maintenant)
          .map(([enemyChampion, matchup]) => ({
            championName: enemyChampion,
            games: matchup.games,
            wins: matchup.wins,
            winrate: Math.round((matchup.wins / matchup.games) * 100),
          }))
          .sort((a, b) => b.winrate - a.winrate);

        // Si moins de 4 matchups, on ne peut pas séparer best/worst proprement
        let bestMatchups: Matchup[] = [];
        let worstMatchups: Matchup[] = [];

        if (matchupsList.length >= 4) {
          bestMatchups = matchupsList.slice(0, 3); // Top 3 meilleurs
          worstMatchups = matchupsList.slice(-3).reverse(); // Top 3 pires (inversé pour avoir le pire en premier)
        } else if (matchupsList.length > 0) {
          // Si peu de matchups, afficher tous dans best ou worst selon le winrate
          const avgWinrate = matchupsList.reduce((sum, m) => sum + m.winrate, 0) / matchupsList.length;
          bestMatchups = matchupsList.filter(m => m.winrate >= avgWinrate);
          worstMatchups = matchupsList.filter(m => m.winrate < avgWinrate);
        }

        // Calculer les dégâts par minute
        const damagePerMinute = stats.playTime > 0
          ? Math.round(stats.damage / stats.playTime)
          : 0;

        return {
          championName,
          games,
          wins: stats.wins,
          losses: games - stats.wins,
          winrate: Math.round((stats.wins / games) * 100),
          kills: stats.kills,
          deaths: stats.deaths,
          assists: stats.assists,
          kda: Number(kda.toFixed(2)),
          averageKills: Number((stats.kills / games).toFixed(1)),
          averageDeaths: Number((stats.deaths / games).toFixed(1)),
          averageAssists: Number((stats.assists / games).toFixed(1)),
          averageCs: Math.round(stats.cs / games),
          averageVisionScore: Math.round(stats.visionScore / games),
          averageGold: Math.round(stats.gold / games),
          averageDamage: Math.round(stats.damage / games),
          damagePerMinute,
          totalPlayTime: Math.round(stats.playTime),
          bestMatchups,
          worstMatchups,
        };
      })
      .sort((a, b) => b.games - a.games); // Trier par nombre de games

    return NextResponse.json({
      champions: championDetails,
      totalChampions: championDetails.length,
      totalMatches: matchIds.length,
    });

  } catch (error) {
    console.error('Error fetching champion details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
