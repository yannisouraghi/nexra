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
  if (teamPosition) {
    return normalizeRole(teamPosition);
  }
  // Smite = Jungle
  if (spell1Id === 11 || spell2Id === 11) return 'JUNGLE';
  return 'UNKNOWN';
};

// Helper to add delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch with retry for rate limiting
async function fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const response = await fetch(url, options);
    if (response.status === 429 && i < retries) {
      // Rate limited, wait and retry
      const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
      await delay(retryAfter * 1000 + 100);
      continue;
    }
    return response;
  }
  return fetch(url, options); // Final attempt
}

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
    const routingRegion = getRoutingValue(platformRegion);

    // Process participants in batches of 2 to avoid rate limiting
    const participants = gameData.participants;
    const enrichedParticipants: any[] = [];

    for (let i = 0; i < participants.length; i += 2) {
      const batch = participants.slice(i, i + 2);

      const batchResults = await Promise.all(
        batch.map(async (participant: any) => {
          try {
            const enrichedData: any = {
              ...participant,
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

            // Step 1: Get summoner data (needed for league API)
            let encryptedSummonerId = participant.summonerId;
            try {
              const summonerResponse = await fetchWithRetry(
                `https://${platformRegion}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${participant.puuid}`,
                { headers: { 'X-Riot-Token': RIOT_API_KEY as string } }
              );
              if (summonerResponse.ok) {
                const summonerData = await summonerResponse.json();
                encryptedSummonerId = summonerData.id;
                if (summonerData.name) {
                  enrichedData.gameName = summonerData.name;
                }
              }
            } catch (e) {
              console.error('Error fetching summoner:', e);
            }

            // Step 2: Fetch account info, rank, mastery in parallel
            const [accountResult, rankResult, masteryResult] = await Promise.allSettled([
              // Account info for gameName
              fetchWithRetry(
                `https://${routingRegion}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${participant.puuid}`,
                { headers: { 'X-Riot-Token': RIOT_API_KEY as string } }
              ).then(r => r.ok ? r.json() : null),

              // Rank info using encrypted summoner ID
              fetchWithRetry(
                `https://${platformRegion}.api.riotgames.com/lol/league/v4/entries/by-summoner/${encryptedSummonerId}`,
                { headers: { 'X-Riot-Token': RIOT_API_KEY as string } }
              ).then(r => r.ok ? r.json() : null),

              // Champion mastery
              fetchWithRetry(
                `https://${platformRegion}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${participant.puuid}/by-champion/${participant.championId}`,
                { headers: { 'X-Riot-Token': RIOT_API_KEY as string } }
              ).then(r => r.ok ? r.json() : null),
            ]);

            // Process account info
            if (accountResult.status === 'fulfilled' && accountResult.value) {
              enrichedData.gameName = accountResult.value.gameName || enrichedData.gameName;
              enrichedData.tagLine = accountResult.value.tagLine || '';
            }

            // Process rank info
            if (rankResult.status === 'fulfilled' && rankResult.value && Array.isArray(rankResult.value)) {
              const soloQueue = rankResult.value.find((entry: any) => entry.queueType === 'RANKED_SOLO_5x5');
              const flexQueue = rankResult.value.find((entry: any) => entry.queueType === 'RANKED_FLEX_SR');
              const rankedData = soloQueue || flexQueue;

              if (rankedData) {
                const wins = rankedData.wins || 0;
                const losses = rankedData.losses || 0;
                const total = wins + losses;
                enrichedData.rankInfo = {
                  tier: rankedData.tier,
                  rank: rankedData.rank,
                  leaguePoints: rankedData.leaguePoints,
                  wins: wins,
                  losses: losses,
                  winrate: total > 0 ? Math.round((wins / total) * 100) : 50,
                  queueType: rankedData.queueType === 'RANKED_SOLO_5x5' ? 'Solo/Duo' : 'Flex',
                };
              }
            }

            // Process champion mastery
            if (masteryResult.status === 'fulfilled' && masteryResult.value) {
              enrichedData.championMastery = masteryResult.value.championLevel || 0;
              enrichedData.championPoints = masteryResult.value.championPoints || 0;
            }

            // Step 3: Fetch recent matches (with small delay to avoid rate limit)
            await delay(50);

            try {
              const matchIdsResponse = await fetchWithRetry(
                `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${participant.puuid}/ids?start=0&count=10`,
                { headers: { 'X-Riot-Token': RIOT_API_KEY as string } }
              );

              if (matchIdsResponse.ok) {
                const matchIds = await matchIdsResponse.json();

                if (matchIds && matchIds.length > 0) {
                  // Fetch only 3 match details to reduce API calls
                  const matchDetailsResults = await Promise.allSettled(
                    matchIds.slice(0, 3).map((matchId: string) =>
                      fetchWithRetry(
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

                        if (role !== 'UNKNOWN') {
                          roleCount[role] = (roleCount[role] || 0) + 1;
                        }

                        if (playerData.championId === participant.championId) {
                          championGames++;
                          if (playerData.win) championWins++;
                          championKDA += (playerData.kills + playerData.assists) / Math.max(1, playerData.deaths);
                        }
                      }
                    }
                  }

                  if (matches.length > 0) {
                    enrichedData.recentForm = matches.map(m => m.win);
                    const recentWins = matches.filter(m => m.win).length;
                    enrichedData.recentWinrate = Math.round((recentWins / matches.length) * 100);

                    // Calculate streak
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

                    // Main role
                    const sortedRoles = Object.entries(roleCount).sort((a, b) => b[1] - a[1]);
                    if (sortedRoles.length > 0) {
                      enrichedData.mainRole = sortedRoles[0][0];
                      if (enrichedData.currentRole !== 'UNKNOWN' && enrichedData.mainRole !== 'UNKNOWN') {
                        enrichedData.isAutofill = enrichedData.currentRole !== enrichedData.mainRole;
                      }
                    }

                    // Champion stats
                    if (championGames > 0) {
                      enrichedData.gamesOnChampion = championGames;
                      enrichedData.winrateOnChampion = Math.round((championWins / championGames) * 100);
                      enrichedData.kdaOnChampion = Number((championKDA / championGames).toFixed(2));
                    }
                  }
                }
              }
            } catch (e) {
              console.error('Error fetching matches:', e);
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

      enrichedParticipants.push(...batchResults);

      // Add delay between batches to respect rate limits
      if (i + 2 < participants.length) {
        await delay(100);
      }
    }

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
