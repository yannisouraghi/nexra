import { NextRequest, NextResponse } from 'next/server';

// Cache for 2 hours - rank can change after each game
export const revalidate = 7200;

const RIOT_API_KEY = process.env.RIOT_API_KEY;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const summonerId = searchParams.get('summonerId');
  const platformRegion = searchParams.get('region') || 'euw1';

  if (!RIOT_API_KEY) {
    return NextResponse.json(
      { error: 'Riot API key not configured' },
      { status: 500 }
    );
  }

  if (!summonerId) {
    return NextResponse.json(
      { error: 'summonerId required' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `https://${platformRegion}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`,
      {
        headers: {
          'X-Riot-Token': RIOT_API_KEY as string,
        },
      }
    );

    if (!response.ok) {
      console.error(`Riot API Rank Error: ${response.status}`);
      return NextResponse.json(
        { tier: 'UNRANKED', rank: '', leaguePoints: 0 },
        { status: 200 }
      );
    }

    const leagues = await response.json();

    // Find RANKED_SOLO_5x5 rank
    const soloQueue = leagues.find((league: any) => league.queueType === 'RANKED_SOLO_5x5');

    if (soloQueue) {
      return NextResponse.json({
        tier: soloQueue.tier, // IRON, BRONZE, SILVER, GOLD, PLATINUM, DIAMOND, MASTER, GRANDMASTER, CHALLENGER
        rank: soloQueue.rank, // I, II, III, IV
        leaguePoints: soloQueue.leaguePoints,
      });
    }

    return NextResponse.json({
      tier: 'UNRANKED',
      rank: '',
      leaguePoints: 0,
    });
  } catch (error) {
    console.error('Error retrieving rank:', error);
    return NextResponse.json(
      { tier: 'UNRANKED', rank: '', leaguePoints: 0 },
      { status: 200 }
    );
  }
}
