import { NextRequest, NextResponse } from 'next/server';

// Cache for 2 hours - player stats based on recent matches
export const revalidate = 7200;

const RIOT_API_KEY = process.env.RIOT_API_KEY;

// Batch fetch configuration
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 50;

if (!RIOT_API_KEY) {
  throw new Error('RIOT_API_KEY is not defined in environment variables');
}

interface ChampionStats {
  championName: string;
  games: number;
  wins: number;
  losses: number;
  winrate: number;
}

interface PlayerStatsResponse {
  topChampions: ChampionStats[];
  recentMatchResults: boolean[]; // true = win, false = loss
  mainRole: string;
  totalGames: number;
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

    // Récupérer les 20 derniers matchs ranked
    const matchHistoryResponse = await fetch(
      `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?type=ranked&start=0&count=20`,
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

    // Structures pour tracker les stats
    const championStats: { [key: string]: { games: number; wins: number } } = {};
    const roleCount: { [key: string]: number } = {};
    const recentMatchResults: boolean[] = [];

    // Helper function to fetch a single match
    const fetchSingleMatch = async (matchId: string): Promise<any | null> => {
      try {
        const matchResponse = await fetch(
          `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
          {
            headers: { 'X-Riot-Token': RIOT_API_KEY as string },
          }
        );

        if (matchResponse.ok) {
          return await matchResponse.json();
        }
        return null;
      } catch (error) {
        console.error(`Error fetching match ${matchId}:`, error);
        return null;
      }
    };

    // Fetch matches in batches concurrently
    const matchDataList: any[] = [];
    for (let i = 0; i < matchIds.length; i += BATCH_SIZE) {
      const batch = matchIds.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((matchId: string) => fetchSingleMatch(matchId))
      );
      matchDataList.push(...batchResults);

      // Add delay between batches (not after the last batch)
      if (i + BATCH_SIZE < matchIds.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    // Process all match data
    for (const matchData of matchDataList) {
      if (!matchData) continue;

      const participant = matchData.info.participants.find(
        (p: any) => p.puuid === puuid
      );

      if (participant) {
        // Tracker les champions
        const championName = participant.championName;
        if (!championStats[championName]) {
          championStats[championName] = { games: 0, wins: 0 };
        }
        championStats[championName].games++;
        if (participant.win) {
          championStats[championName].wins++;
        }

        // Tracker les rôles
        const role = participant.teamPosition || participant.individualPosition || 'UNKNOWN';
        roleCount[role] = (roleCount[role] || 0) + 1;

        // Tracker les résultats récents
        recentMatchResults.push(participant.win);
      }
    }

    // Calculer le top 3 des champions
    const topChampions: ChampionStats[] = Object.entries(championStats)
      .map(([championName, stats]) => ({
        championName,
        games: stats.games,
        wins: stats.wins,
        losses: stats.games - stats.wins,
        winrate: Math.round((stats.wins / stats.games) * 100),
      }))
      .sort((a, b) => b.games - a.games)
      .slice(0, 3);

    // Déterminer le rôle principal
    const mainRole = Object.entries(roleCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'UNKNOWN';

    const response: PlayerStatsResponse = {
      topChampions,
      recentMatchResults: recentMatchResults.slice(0, 10), // Les 10 derniers matchs
      mainRole,
      totalGames: matchIds.length,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching player stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
