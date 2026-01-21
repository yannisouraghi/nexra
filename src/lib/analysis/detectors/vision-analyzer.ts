// Vision Analyzer - Analyzes ward placement and vision control

import {
  TimelineFrame,
  TimelineEvent,
  MatchParticipant,
  DetectedError,
  DetectorResult,
} from '../types';

function getGamePhase(timestampMs: number): 'early' | 'mid' | 'late' {
  const minutes = timestampMs / 60000;
  if (minutes < 14) return 'early';
  if (minutes < 25) return 'mid';
  return 'late';
}

// Vision benchmarks per game phase (wards placed per 5 min)
const VISION_BENCHMARKS = {
  early: { good: 5, average: 3, poor: 1 },
  mid: { good: 8, average: 5, poor: 2 },
  late: { good: 10, average: 6, poor: 3 },
};

export function analyzeVision(
  frames: TimelineFrame[],
  participants: MatchParticipant[],
  playerPuuid: string
): DetectorResult {
  const errors: DetectedError[] = [];
  const stats = {
    totalWardsPlaced: 0,
    totalWardsKilled: 0,
    controlWardsPlaced: 0,
    wardsPerMinute: 0,
  };

  const playerParticipant = participants.find(p => p.puuid === playerPuuid);
  if (!playerParticipant) {
    return { errors, stats };
  }

  const playerParticipantId = playerParticipant.participantId;
  const isSupport = playerParticipant.teamPosition === 'UTILITY';

  // Track wards in time windows
  const wardsByWindow: { [key: number]: { placed: number; killed: number; control: number } } = {};

  // Process all events
  for (const frame of frames) {
    const windowKey = Math.floor(frame.timestamp / 300000); // 5-minute windows

    if (!wardsByWindow[windowKey]) {
      wardsByWindow[windowKey] = { placed: 0, killed: 0, control: 0 };
    }

    for (const event of frame.events) {
      // Ward placed
      if (event.type === 'WARD_PLACED' && event.creatorId === playerParticipantId) {
        stats.totalWardsPlaced++;
        wardsByWindow[windowKey].placed++;

        if (event.wardType === 'CONTROL_WARD') {
          stats.controlWardsPlaced++;
          wardsByWindow[windowKey].control++;
        }
      }

      // Ward killed
      if (event.type === 'WARD_KILL' && event.killerId === playerParticipantId) {
        stats.totalWardsKilled++;
        wardsByWindow[windowKey].killed++;
      }
    }
  }

  // Analyze each 5-minute window
  for (const [windowKey, data] of Object.entries(wardsByWindow)) {
    const minuteStart = parseInt(windowKey) * 5;
    const minuteEnd = minuteStart + 5;
    const gamePhase = getGamePhase(minuteStart * 60000);
    const benchmark = VISION_BENCHMARKS[gamePhase];

    // Check ward placement
    const adjustedBenchmark = isSupport ? benchmark : {
      good: benchmark.good * 0.6,
      average: benchmark.average * 0.6,
      poor: benchmark.poor * 0.6
    };

    if (data.placed < adjustedBenchmark.poor && minuteStart >= 10) {
      const severity = gamePhase === 'late' ? 'high' : 'medium';

      errors.push({
        type: 'vision',
        severity,
        timestamp: minuteStart * 60,
        title: `Lack of vision (${minuteStart}-${minuteEnd} min)`,
        description: `You only placed ${data.placed} ward(s) between ${minuteStart} and ${minuteEnd} min. ${
          isSupport
            ? 'As a support, vision is your main responsibility.'
            : 'Even as a laner, you should contribute to vision control.'
        }`,
        suggestion: isSupport
          ? 'Place strategic wards: river, enemy jungle, objectives. Use your Oracle Lens to deward.'
          : 'Buy Control Wards regularly. A ward can save your life or your team\'s.',
        coachingNote: `Vision wins games. ${data.placed} ward(s) in 5 min is not enough to have good map awareness.`,
        context: {
          visionState: {
            playerWardsActive: data.placed,
            areaWarded: data.placed >= adjustedBenchmark.average,
          },
          gamePhase,
        },
      });
    }

    // Check control ward usage in mid/late game
    if (gamePhase !== 'early' && data.control === 0 && minuteStart >= 10) {
      errors.push({
        type: 'vision',
        severity: 'low',
        timestamp: minuteStart * 60,
        title: `No Control Ward (${minuteStart}-${minuteEnd} min)`,
        description: `You didn't place any Control Ward between ${minuteStart} and ${minuteEnd} min.`,
        suggestion: 'Control Wards are essential to control key zones (dragon, baron, jungle). Buy one on every back.',
        coachingNote: 'A Control Ward costs 75 gold but can save your life or reveal ambushes. It\'s one of the best investments in the game.',
        context: {
          visionState: {
            playerWardsActive: data.placed,
            areaWarded: false,
          },
          gamePhase,
        },
      });
    }
  }

  // Calculate wards per minute
  const gameMinutes = frames.length;
  if (gameMinutes > 0) {
    stats.wardsPerMinute = Math.round((stats.totalWardsPlaced / gameMinutes) * 10) / 10;
  }

  return { errors, stats };
}
