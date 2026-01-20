import { NextRequest, NextResponse } from 'next/server';

const RIOT_API_KEY = process.env.RIOT_API_KEY;

// Map platform region codes to routing values for account API
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

// Normalize role positions
const normalizeRole = (position: string): string => {
  const positionMap: { [key: string]: string } = {
    'TOP': 'TOP',
    'JUNGLE': 'JUNGLE',
    'MIDDLE': 'MID',
    'MID': 'MID',
    'BOTTOM': 'ADC',
    'BOT': 'ADC',
    'UTILITY': 'SUPPORT',
    'SUPPORT': 'SUPPORT',
  };
  return positionMap[position] || 'UNKNOWN';
};

// Detect role from champion and spells (heuristic)
const detectRoleFromSpells = (spell1Id: number, spell2Id: number, teamPosition?: string): string => {
  // If we have team position from spectator, use it
  if (teamPosition) {
    return normalizeRole(teamPosition);
  }

  // Smite = Jungle
  if (spell1Id === 11 || spell2Id === 11) return 'JUNGLE';

  // Default to unknown
  return 'UNKNOWN';
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const puuid = searchParams.get('puuid');
  const platformRegion = searchParams.get('region') || 'euw1';

  if (!puuid) {
    return NextResponse.json(
      { error: 'puuid is required' },
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
    // Use the Spectator v5 endpoint to get current game info
    const spectatorResponse = await fetch(
      `https://${platformRegion}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(puuid)}`,
      {
        headers: {
          'X-Riot-Token': RIOT_API_KEY as string,
        },
        cache: 'no-store',
      }
    );

    if (spectatorResponse.status === 404) {
      // Player is not in a game
      return NextResponse.json({
        inGame: false,
        gameData: null,
      });
    }

    if (!spectatorResponse.ok) {
      if (spectatorResponse.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a few seconds.' },
          { status: 429 }
        );
      }
      console.error(`Spectator API error: ${spectatorResponse.status}`);
      return NextResponse.json(
        { error: `Riot API error (${spectatorResponse.status})` },
        { status: spectatorResponse.status }
      );
    }

    const gameData = await spectatorResponse.json();

    // Enrich participant data with comprehensive stats
    const routingRegion = getRoutingValue(platformRegion);

    const enrichedParticipants = await Promise.all(
      gameData.participants.map(async (participant: any) => {
        try {
          const enrichedData: any = {
            ...participant,
            // Try to get name from spectator data first
            gameName: participant.riotId?.gameName || participant.summonerName || participant.summonerId,
            tagLine: participant.riotId?.tagLine || '',
            rankInfo: null,
            championMastery: 0,
            championPoints: 0,
            gamesOnChampion: 0,
            winrateOnChampion: 50,
            kdaOnChampion: 0,
            recentWinrate: 50,
            currentStreak: 0,
            mainRole: 'UNKNOWN',
            currentRole: detectRoleFromSpells(participant.spell1Id, participant.spell2Id, participant.teamPosition),
            isAutofill: false,
            recentForm: [] as boolean[],
          };

          // First, get summoner data to ensure we have the correct summonerId
          let summonerId = participant.summonerId;
          try {
            const summonerResponse = await fetch(
              `https://${platformRegion}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${participant.puuid}`,
              { headers: { 'X-Riot-Token': RIOT_API_KEY as string } }
            );
            if (summonerResponse.ok) {
              const summonerData = await summonerResponse.json();
              summonerId = summonerData.id;
              // Use summoner name as fallback for gameName
              if (summonerData.name) {
                enrichedData.gameName = summonerData.name;
              }
            } else {
              console.error(`Summoner API error for ${participant.puuid}: ${summonerResponse.status}`);
            }
          } catch (e) {
            console.error('Error fetching summoner data:', e);
          }

          // Parallel fetch: account info, rank info, champion mastery, recent matches
          const [accountResult, rankResult, masteryResult, matchesResult] = await Promise.allSettled([
            // 1. Get account info (gameName, tagLine)
            fetch(
              `https://${routingRegion}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${participant.puuid}`,
              { headers: { 'X-Riot-Token': RIOT_API_KEY as string } }
            ).then(r => r.ok ? r.json() : null),

            // 2. Get rank info (using summonerId from summoner API)
            summonerId ? fetch(
              `https://${platformRegion}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`,
              { headers: { 'X-Riot-Token': RIOT_API_KEY as string } }
            ).then(r => {
              if (!r.ok) {
                console.error(`League API error for ${summonerId}: ${r.status}`);
                return null;
              }
              return r.json();
            }) : Promise.resolve(null),

            // 3. Get champion mastery
            fetch(
              `https://${platformRegion}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${participant.puuid}/by-champion/${participant.championId}`,
              { headers: { 'X-Riot-Token': RIOT_API_KEY as string } }
            ).then(r => r.ok ? r.json() : null),

            // 4. Get recent match IDs (all types, not just ranked)
            fetch(
              `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${participant.puuid}/ids?start=0&count=10`,
              { headers: { 'X-Riot-Token': RIOT_API_KEY as string } }
            ).then(r => r.ok ? r.json() : null),
          ]);

          // Process account info
          if (accountResult.status === 'fulfilled' && accountResult.value) {
            enrichedData.gameName = accountResult.value.gameName || participant.summonerId;
            enrichedData.tagLine = accountResult.value.tagLine || '';
          }

          // Process rank info
          if (rankResult.status === 'fulfilled' && rankResult.value && Array.isArray(rankResult.value)) {
            // Try solo queue first, then flex
            const soloQueue = rankResult.value.find((entry: any) => entry.queueType === 'RANKED_SOLO_5x5');
            const flexQueue = rankResult.value.find((entry: any) => entry.queueType === 'RANKED_FLEX_SR');
            const rankedData = soloQueue || flexQueue;

            if (rankedData) {
              enrichedData.rankInfo = {
                tier: rankedData.tier,
                rank: rankedData.rank,
                leaguePoints: rankedData.leaguePoints,
                wins: rankedData.wins,
                losses: rankedData.losses,
                winrate: Math.round((rankedData.wins / (rankedData.wins + rankedData.losses)) * 100),
                queueType: rankedData.queueType === 'RANKED_SOLO_5x5' ? 'Solo/Duo' : 'Flex',
              };
            } else if (rankResult.value.length === 0) {
              // Player has no ranked data (unranked in both queues)
              // This is expected for unranked players
            }
          } else if (rankResult.status === 'rejected') {
            console.error(`Rank fetch rejected for ${summonerId}:`, rankResult.reason);
          }

          // Process champion mastery
          if (masteryResult.status === 'fulfilled' && masteryResult.value) {
            enrichedData.championMastery = masteryResult.value.championLevel || 0;
            enrichedData.championPoints = masteryResult.value.championPoints || 0;
          }

          // Process recent matches for detailed stats
          if (matchesResult.status === 'fulfilled' && matchesResult.value && matchesResult.value.length > 0) {
            const matchIds = matchesResult.value;

            // Fetch match details in parallel (limit to 5 to reduce load)
            const matchDetailsResults = await Promise.allSettled(
              matchIds.slice(0, 5).map((matchId: string) =>
                fetch(
                  `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
                  { headers: { 'X-Riot-Token': RIOT_API_KEY as string } }
                ).then(r => r.ok ? r.json() : null)
              )
            );

            const matches: any[] = [];
            const roleCount: { [key: string]: number } = {};
            let championGames = 0;
            let championWins = 0;
            let championKDA = 0;

            for (const result of matchDetailsResults) {
              if (result.status === 'fulfilled' && result.value) {
                const matchData = result.value;
                const playerData = matchData.info?.participants?.find(
                  (p: any) => p.puuid === participant.puuid
                );

                if (playerData) {
                  const role = normalizeRole(playerData.teamPosition || playerData.individualPosition || '');
                  matches.push({
                    win: playerData.win,
                    championName: playerData.championName,
                    role,
                    kills: playerData.kills,
                    deaths: playerData.deaths,
                    assists: playerData.assists,
                  });

                  // Count roles
                  if (role !== 'UNKNOWN') {
                    roleCount[role] = (roleCount[role] || 0) + 1;
                  }

                  // Track champion-specific stats
                  if (playerData.championId === participant.championId) {
                    championGames++;
                    if (playerData.win) championWins++;
                    championKDA += (playerData.kills + playerData.assists) / Math.max(1, playerData.deaths);
                  }
                }
              }
            }

            // Calculate stats
            if (matches.length > 0) {
              // Recent form (last 5 results)
              enrichedData.recentForm = matches.slice(0, 5).map(m => m.win);

              // Recent winrate
              const recentWins = matches.filter(m => m.win).length;
              enrichedData.recentWinrate = Math.round((recentWins / matches.length) * 100);

              // Current streak
              let streak = 0;
              const firstResult = matches[0]?.win;
              for (const m of matches) {
                if (m.win === firstResult) {
                  streak += firstResult ? 1 : -1;
                } else {
                  break;
                }
              }
              enrichedData.currentStreak = streak;

              // Main role (most played)
              const sortedRoles = Object.entries(roleCount).sort((a, b) => b[1] - a[1]);
              if (sortedRoles.length > 0) {
                enrichedData.mainRole = sortedRoles[0][0];

                // Detect autofill
                if (enrichedData.currentRole !== 'UNKNOWN' && enrichedData.mainRole !== 'UNKNOWN') {
                  enrichedData.isAutofill = enrichedData.currentRole !== enrichedData.mainRole;
                }
              }

              // Champion-specific stats
              if (championGames > 0) {
                enrichedData.gamesOnChampion = championGames;
                enrichedData.winrateOnChampion = Math.round((championWins / championGames) * 100);
                enrichedData.kdaOnChampion = Number((championKDA / championGames).toFixed(2));
              }
            }
          }

          return enrichedData;
        } catch (e) {
          console.error('Error enriching participant:', e);
          return {
            ...participant,
            gameName: participant.summonerId,
            tagLine: '',
            rankInfo: null,
          };
        }
      })
    );

    return NextResponse.json({
      inGame: true,
      gameData: {
        gameId: gameData.gameId,
        gameType: gameData.gameType,
        gameStartTime: gameData.gameStartTime,
        mapId: gameData.mapId,
        gameLength: gameData.gameLength,
        gameMode: gameData.gameMode,
        gameQueueConfigId: gameData.gameQueueConfigId,
        bannedChampions: gameData.bannedChampions,
        participants: enrichedParticipants,
      },
    });
  } catch (error) {
    console.error('Error fetching live game:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live game data' },
      { status: 500 }
    );
  }
}
