import { NextRequest, NextResponse } from 'next/server';

// Cache for 4 hours - profile data changes infrequently
export const revalidate = 14400;

const RIOT_API_KEY = process.env.RIOT_API_KEY;

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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const gameName = searchParams.get('gameName');
  const tagLine = searchParams.get('tagLine');
  const platformRegion = searchParams.get('region') || 'euw1';
  const region = getRoutingValue(platformRegion);

  if (!gameName || !tagLine) {
    return NextResponse.json(
      { error: 'gameName and tagLine are required' },
      { status: 400 }
    );
  }

  if (!RIOT_API_KEY) {
    return NextResponse.json(
      { error: 'Riot API key not configured' },
      { status: 500 }
    );
  }

  try {
    // 1. Get the player's PUUID
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
          { error: 'Riot account not found' },
          { status: 404 }
        );
      }
      if (accountResponse.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit reached. Please try again in a few seconds.' },
          { status: 429 }
        );
      }
      console.error(`Riot API Account Error: ${accountResponse.status} - ${accountResponse.statusText}`);
      return NextResponse.json(
        { error: `Riot API Error (${accountResponse.status})` },
        { status: accountResponse.status }
      );
    }

    const accountData = await accountResponse.json();
    const puuid = accountData.puuid;

    // 2. Fetch summoner info and rank in parallel (both use PUUID)
    const [summonerResponse, rankedResponse] = await Promise.all([
      fetch(
        `https://${platformRegion}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
        {
          headers: {
            'X-Riot-Token': RIOT_API_KEY as string,
          },
        }
      ),
      fetch(
        `https://${platformRegion}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`,
        {
          headers: {
            'X-Riot-Token': RIOT_API_KEY as string,
          },
        }
      ),
    ]);

    if (!summonerResponse.ok) {
      throw new Error(`Riot API Summoner Error: ${summonerResponse.status}`);
    }

    const summonerData = await summonerResponse.json();

    // Process rank data
    let rankedData = null;
    if (rankedResponse.ok) {
      try {
        const rankedArray = await rankedResponse.json();
        const soloQueue = rankedArray.find(
          (entry: any) => entry.queueType === 'RANKED_SOLO_5x5'
        );

        if (soloQueue) {
          rankedData = {
            tier: soloQueue.tier,
            rank: soloQueue.rank,
            leaguePoints: soloQueue.leaguePoints,
            wins: soloQueue.wins,
            losses: soloQueue.losses,
          };
        }
      } catch (err) {
        // Silently fail for rank - player might be unranked
      }
    }

    return NextResponse.json({
      puuid: summonerData.puuid,
      profileIconId: summonerData.profileIconId,
      summonerLevel: summonerData.summonerLevel,
      gameName,
      tagLine,
      rank: rankedData,
    });
  } catch (error) {
    console.error('Error fetching summoner:', error);
    return NextResponse.json(
      { error: 'Error fetching summoner' },
      { status: 500 }
    );
  }
}
