// Objective Analyzer - Analyzes objective control (Dragon, Baron, Herald)

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

// Objective positions
const DRAGON_PIT = { x: 9866, y: 4414 };
const BARON_PIT = { x: 5007, y: 10471 };

function calculateDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function analyzeObjectives(
  frames: TimelineFrame[],
  participants: MatchParticipant[],
  playerPuuid: string
): DetectorResult {
  const errors: DetectedError[] = [];
  const stats = {
    dragonsContested: 0,
    dragonsLost: 0,
    baronsContested: 0,
    baronsLost: 0,
    heraldsContested: 0,
  };

  const playerParticipant = participants.find(p => p.puuid === playerPuuid);
  if (!playerParticipant) {
    return { errors, stats };
  }

  const playerParticipantId = playerParticipant.participantId;
  const playerTeamId = playerParticipant.teamId;
  const isJungler = playerParticipant.teamPosition === 'JUNGLE';

  // Find recent deaths to check if player was dead during objective
  const playerDeaths: { timestamp: number; deathTimer: number }[] = [];

  for (const frame of frames) {
    for (const event of frame.events) {
      if (event.type === 'CHAMPION_KILL' && event.victimId === playerParticipantId) {
        const gamePhase = getGamePhase(event.timestamp);
        // Death timers vary by game time and level
        const deathTimer = gamePhase === 'early' ? 15000 :
                          gamePhase === 'mid' ? 30000 : 50000;
        playerDeaths.push({
          timestamp: event.timestamp,
          deathTimer,
        });
      }
    }
  }

  // Check if player was dead at a given timestamp
  function wasPlayerDead(timestamp: number): boolean {
    return playerDeaths.some(death =>
      timestamp > death.timestamp && timestamp < death.timestamp + death.deathTimer
    );
  }

  // Analyze objective events
  for (const frame of frames) {
    for (const event of frame.events) {
      if (event.type !== 'ELITE_MONSTER_KILL') continue;

      const timestamp = event.timestamp;
      const gamePhase = getGamePhase(timestamp);
      const takenByEnemy = event.killerTeamId !== playerTeamId;

      if (!takenByEnemy) continue; // Only analyze lost objectives

      const minuteTimestamp = Math.floor(timestamp / 60000);
      const secondTimestamp = Math.floor((timestamp % 60000) / 1000);
      const timeStr = `${minuteTimestamp}:${secondTimestamp.toString().padStart(2, '0')}`;

      // Get player position at this time
      const frameIndex = Math.floor(timestamp / 60000);
      const currentFrame = frames[frameIndex] || frame;
      const playerFrame = currentFrame.participantFrames[playerParticipantId.toString()];
      const playerPos = playerFrame?.position || { x: 7500, y: 7500 };

      const wasDead = wasPlayerDead(timestamp);

      // Analyze by objective type
      switch (event.monsterType) {
        case 'DRAGON':
        case 'ELDER_DRAGON': {
          const isElder = event.monsterType === 'ELDER_DRAGON';
          const distance = calculateDistance(playerPos, DRAGON_PIT);
          stats.dragonsLost++;

          if (!wasDead && distance > 4000) {
            const severity = isElder ? 'critical' : gamePhase === 'late' ? 'high' : 'medium';

            errors.push({
              type: 'objective',
              severity,
              timestamp: Math.floor(timestamp / 1000),
              title: isElder ? 'Elder Dragon lost' : `${event.monsterSubType?.replace('_DRAGON', '') || ''} Dragon lost`,
              description: `The enemy took ${isElder ? 'Elder Dragon' : 'Dragon'} at ${timeStr}. You were ${Math.round(distance)} units away (${wasDead ? 'dead' : 'alive'}).`,
              suggestion: isJungler
                ? 'As a jungler, you must time objectives and be present. Ward the area 1 min before spawn.'
                : 'Be ready to rotate to Dragon when it spawns. Communicate with your team.',
              coachingNote: isElder
                ? 'Elder Dragon is often game-deciding. Everything should be organized around this objective.'
                : `Dragon gives permanent buffs to your team. ${distance > 6000 ? 'You were way too far to contest.' : 'Get closer earlier to have priority.'}`,
              context: {
                mapState: {
                  zone: 'danger',
                  playerPosition: playerPos,
                },
                gamePhase,
              },
            });
          }
          break;
        }

        case 'BARON_NASHOR': {
          const distance = calculateDistance(playerPos, BARON_PIT);
          stats.baronsLost++;

          if (!wasDead && distance > 4000) {
            errors.push({
              type: 'objective',
              severity: 'critical',
              timestamp: Math.floor(timestamp / 1000),
              title: 'Baron Nashor lost',
              description: `The enemy took Baron at ${timeStr}. You were ${Math.round(distance)} units away.`,
              suggestion: 'Baron is the most important mid/late game objective. Group with your team to contest or take it.',
              coachingNote: 'Baron gives a huge advantage in siege and gold. Losing Baron without contesting is often a negative turning point.',
              context: {
                mapState: {
                  zone: 'danger',
                  playerPosition: playerPos,
                },
                gamePhase,
              },
            });
          }
          break;
        }

        case 'RIFTHERALD': {
          const distance = calculateDistance(playerPos, BARON_PIT); // Herald spawns at Baron pit
          stats.heraldsContested++;

          if (!wasDead && distance > 5000 && gamePhase === 'early') {
            errors.push({
              type: 'objective',
              severity: 'medium',
              timestamp: Math.floor(timestamp / 1000),
              title: 'Herald lost',
              description: `The enemy took Herald at ${timeStr}. You were ${Math.round(distance)} units away.`,
              suggestion: 'Herald can destroy an entire tower. Help your jungler secure it or at least contest it.',
              coachingNote: 'Herald is very useful to accelerate early game. One less tower opens up the map for your team.',
              context: {
                mapState: {
                  zone: 'neutral',
                  playerPosition: playerPos,
                },
                gamePhase,
              },
            });
          }
          break;
        }
      }
    }
  }

  return { errors, stats };
}
