import { NextRequest, NextResponse } from 'next/server';

const RIOT_API_KEY = process.env.RIOT_API_KEY;

// Types for timeline events
interface TimelineEvent {
  timestamp: number; // milliseconds from game start
  type: string;
  killerId?: number;
  victimId?: number;
  assistingParticipantIds?: number[];
  position?: { x: number; y: number };
  monsterType?: string;
  monsterSubType?: string;
  buildingType?: string;
  teamId?: number;
}

interface TimelineFrame {
  timestamp: number;
  participantFrames: {
    [key: string]: {
      participantId: number;
      position: { x: number; y: number };
      currentGold: number;
      totalGold: number;
      level: number;
      xp: number;
      minionsKilled: number;
      jungleMinionsKilled: number;
    };
  };
  events: TimelineEvent[];
}

interface MatchTimeline {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    frameInterval: number;
    frames: TimelineFrame[];
    participants: Array<{
      participantId: number;
      puuid: string;
    }>;
  };
}

// Important event types for clip extraction
interface ImportantEvent {
  type: 'death' | 'kill' | 'multikill' | 'objective' | 'tower';
  timestamp: number; // in seconds
  description: string;
  severity: 'critical' | 'high' | 'medium';
  involvedChampions?: string[];
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
  return regionMap[platformRegion.toLowerCase()] || 'europe';
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const matchId = searchParams.get('matchId');
  const puuid = searchParams.get('puuid');
  const platformRegion = searchParams.get('region') || 'euw1';
  const region = getRoutingValue(platformRegion);

  if (!matchId || !puuid) {
    return NextResponse.json(
      { error: 'matchId and puuid are required' },
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
    // Fetch match details first to get champion names
    const matchResponse = await fetch(
      `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
      {
        headers: { 'X-Riot-Token': RIOT_API_KEY },
      }
    );

    if (!matchResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch match data: ${matchResponse.status}` },
        { status: matchResponse.status }
      );
    }

    const matchData = await matchResponse.json();

    // Create participant ID to champion name mapping
    const participantMap = new Map<number, { championName: string; puuid: string; teamId: number }>();
    matchData.info.participants.forEach((p: any) => {
      participantMap.set(p.participantId, {
        championName: p.championName,
        puuid: p.puuid,
        teamId: p.teamId,
      });
    });

    // Find the player's participant ID
    const playerParticipant = matchData.info.participants.find((p: any) => p.puuid === puuid);
    if (!playerParticipant) {
      return NextResponse.json(
        { error: 'Player not found in match' },
        { status: 404 }
      );
    }
    const playerParticipantId = playerParticipant.participantId;
    const playerTeamId = playerParticipant.teamId;

    // Fetch timeline
    const timelineResponse = await fetch(
      `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`,
      {
        headers: { 'X-Riot-Token': RIOT_API_KEY },
      }
    );

    if (!timelineResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch timeline: ${timelineResponse.status}` },
        { status: timelineResponse.status }
      );
    }

    const timeline: MatchTimeline = await timelineResponse.json();

    // Extract important events for the player
    const importantEvents: ImportantEvent[] = [];

    for (const frame of timeline.info.frames) {
      for (const event of frame.events) {
        const timestampSeconds = Math.floor(event.timestamp / 1000);

        // Player deaths - CRITICAL (most important for coaching)
        if (event.type === 'CHAMPION_KILL' && event.victimId === playerParticipantId) {
          const killer = participantMap.get(event.killerId || 0);
          importantEvents.push({
            type: 'death',
            timestamp: timestampSeconds,
            description: `Mort par ${killer?.championName || 'Unknown'}`,
            severity: 'critical',
            involvedChampions: [killer?.championName || 'Unknown'],
          });
        }

        // Player kills
        if (event.type === 'CHAMPION_KILL' && event.killerId === playerParticipantId) {
          const victim = participantMap.get(event.victimId || 0);
          importantEvents.push({
            type: 'kill',
            timestamp: timestampSeconds,
            description: `Kill sur ${victim?.championName || 'Unknown'}`,
            severity: 'medium',
            involvedChampions: [victim?.championName || 'Unknown'],
          });
        }

        // Player assists on kills (for context)
        if (event.type === 'CHAMPION_KILL' &&
            event.assistingParticipantIds?.includes(playerParticipantId)) {
          const victim = participantMap.get(event.victimId || 0);
          const killer = participantMap.get(event.killerId || 0);
          importantEvents.push({
            type: 'kill',
            timestamp: timestampSeconds,
            description: `Assist sur ${victim?.championName || 'Unknown'} (kill par ${killer?.championName || 'Unknown'})`,
            severity: 'medium',
            involvedChampions: [victim?.championName || 'Unknown', killer?.championName || 'Unknown'],
          });
        }

        // Team's objective kills (dragon, baron, herald)
        if (event.type === 'ELITE_MONSTER_KILL') {
          const killerInfo = participantMap.get(event.killerId || 0);
          const isPlayerTeam = killerInfo?.teamId === playerTeamId;
          const isPlayerKill = event.killerId === playerParticipantId;

          let monsterName = event.monsterType || 'Unknown';
          if (event.monsterSubType) {
            monsterName = `${event.monsterSubType} ${monsterName}`;
          }

          // Only include if player was involved or it's an important objective
          if (isPlayerKill || (isPlayerTeam && ['BARON_NASHOR', 'DRAGON', 'RIFTHERALD'].includes(event.monsterType || ''))) {
            importantEvents.push({
              type: 'objective',
              timestamp: timestampSeconds,
              description: `${isPlayerTeam ? 'Prise' : 'Perte'} de ${monsterName}`,
              severity: event.monsterType === 'BARON_NASHOR' ? 'critical' : 'high',
            });
          }
        }

        // Tower kills involving player's team
        if (event.type === 'BUILDING_KILL' && event.buildingType === 'TOWER_BUILDING') {
          const isPlayerTeamTower = event.teamId !== playerTeamId;
          if (isPlayerTeamTower) {
            importantEvents.push({
              type: 'tower',
              timestamp: timestampSeconds,
              description: 'Tour détruite par ton équipe',
              severity: 'medium',
            });
          }
        }

        // Multikills (detected from CHAMPION_KILL events within short timeframe)
        // This is handled by looking for multiple kills by the same player within 10 seconds
      }
    }

    // Detect multikills (multiple kills within 10 seconds)
    const playerKills = importantEvents
      .filter(e => e.type === 'kill' && e.description.startsWith('Kill sur'))
      .sort((a, b) => a.timestamp - b.timestamp);

    let multiKillCount = 0;
    let multiKillStart = 0;

    for (let i = 0; i < playerKills.length; i++) {
      if (i === 0 || playerKills[i].timestamp - playerKills[i - 1].timestamp > 10) {
        if (multiKillCount >= 2) {
          const multiKillNames = ['', '', 'Double Kill', 'Triple Kill', 'Quadra Kill', 'PENTA KILL'];
          importantEvents.push({
            type: 'multikill',
            timestamp: multiKillStart,
            description: multiKillNames[Math.min(multiKillCount, 5)],
            severity: multiKillCount >= 4 ? 'critical' : 'high',
          });
        }
        multiKillCount = 1;
        multiKillStart = playerKills[i].timestamp;
      } else {
        multiKillCount++;
      }
    }
    // Don't forget the last multikill
    if (multiKillCount >= 2) {
      const multiKillNames = ['', '', 'Double Kill', 'Triple Kill', 'Quadra Kill', 'PENTA KILL'];
      importantEvents.push({
        type: 'multikill',
        timestamp: multiKillStart,
        description: multiKillNames[Math.min(multiKillCount, 5)],
        severity: multiKillCount >= 4 ? 'critical' : 'high',
      });
    }

    // Sort by timestamp
    importantEvents.sort((a, b) => a.timestamp - b.timestamp);

    // Generate clip timestamps (15 seconds before to 10 seconds after each event)
    const clips = importantEvents.map((event, index) => ({
      id: `clip-${index}`,
      ...event,
      startTime: Math.max(0, event.timestamp - 15),
      endTime: event.timestamp + 10,
      duration: 25,
    }));

    // Merge overlapping clips
    const mergedClips: typeof clips = [];
    for (const clip of clips) {
      const lastClip = mergedClips[mergedClips.length - 1];
      if (lastClip && clip.startTime <= lastClip.endTime + 5) {
        // Merge clips that are within 5 seconds of each other
        lastClip.endTime = Math.max(lastClip.endTime, clip.endTime);
        lastClip.duration = lastClip.endTime - lastClip.startTime;
        if (clip.severity === 'critical') lastClip.severity = 'critical';
        lastClip.description += ` + ${clip.description}`;
      } else {
        mergedClips.push({ ...clip });
      }
    }

    return NextResponse.json({
      matchId,
      playerChampion: playerParticipant.championName,
      gameDuration: matchData.info.gameDuration,
      events: importantEvents,
      clips: mergedClips,
      totalDeaths: importantEvents.filter(e => e.type === 'death').length,
      totalKills: importantEvents.filter(e => e.type === 'kill' && e.description.startsWith('Kill sur')).length,
    });

  } catch (error) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline data' },
      { status: 500 }
    );
  }
}
