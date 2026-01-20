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
      { error: 'gameName et tagLine sont requis' },
      { status: 400 }
    );
  }

  if (!RIOT_API_KEY) {
    return NextResponse.json(
      { error: 'API key Riot non configurée' },
      { status: 500 }
    );
  }

  try {
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
      throw new Error(`Erreur API Riot Summoner: ${summonerResponse.status}`);
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
    console.error('Erreur lors de la récupération du summoner:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du summoner' },
      { status: 500 }
    );
  }
}
