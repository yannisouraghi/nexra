import { NextRequest, NextResponse } from 'next/server';

// Cache for 24 hours - timeline data is historical and never changes
export const revalidate = 86400;

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
  try {
    const searchParams = request.nextUrl.searchParams;
    const matchId = searchParams.get('matchId');
    const region = searchParams.get('region');

    if (!matchId || !region) {
      return NextResponse.json(
        { error: 'Match ID and region required' },
        { status: 400 }
      );
    }

    if (!RIOT_API_KEY) {
      return NextResponse.json(
        { error: 'Riot API key not configured' },
        { status: 500 }
      );
    }

    const routingRegion = getRoutingValue(region);

    // Fetch match timeline
    const timelineResponse = await fetch(
      `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`,
      {
        headers: {
          'X-Riot-Token': RIOT_API_KEY as string,
        },
      }
    );

    if (!timelineResponse.ok) {
      return NextResponse.json(
        { error: `Error retrieving timeline (${timelineResponse.status})` },
        { status: timelineResponse.status }
      );
    }

    const timelineData = await timelineResponse.json();

    // Extract relevant data from each frame
    const frames = timelineData.info.frames.map((frame: any) => {
      const timestamp = frame.timestamp;
      const participantFrames = frame.participantFrames;

      // Convert participant frames to array
      const players = Object.keys(participantFrames).map((key) => {
        const pf = participantFrames[key];
        return {
          participantId: pf.participantId,
          totalGold: pf.totalGold,
          level: pf.level,
          currentGold: pf.currentGold,
          xp: pf.xp,
          minionsKilled: pf.minionsKilled,
          jungleMinionsKilled: pf.jungleMinionsKilled,
          position: pf.position,
        };
      });

      return {
        timestamp,
        players,
      };
    });

    return NextResponse.json({ frames });
  } catch (error) {
    console.error('Error retrieving timeline:', error);
    return NextResponse.json(
      { error: 'Server error while retrieving timeline' },
      { status: 500 }
    );
  }
}
