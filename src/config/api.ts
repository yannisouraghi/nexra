/**
 * Centralized API configuration
 * All API URLs and constants should be defined here
 */

// Nexra API URL - backend worker
// In production, this should always be set via environment variable
const PRODUCTION_API_URL = 'https://nexra-api.nexra-api.workers.dev';

export const NEXRA_API_URL =
  process.env.NEXT_PUBLIC_NEXRA_API_URL ||
  process.env.NEXRA_API_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:8787' : PRODUCTION_API_URL);

// Cache durations (in seconds)
export const CACHE_DURATIONS = {
  SUMMONER_DATA: 14400,      // 4 hours - profile data changes infrequently
  PLAYER_STATS: 7200,        // 2 hours - player stats based on recent matches
  MATCHES: 3600,             // 1 hour - new matches are frequent
  CHAMPION_DETAILS: 14400,   // 4 hours - champion mastery rarely changes
} as const;

// Riot API rate limiting
export const RIOT_API_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2000,
  CONSECUTIVE_ERROR_THRESHOLD: 3,
} as const;

// Data Dragon
export const DDRAGON_CONFIG = {
  FALLBACK_VERSION: '15.1.1',
  BASE_URL: 'https://ddragon.leagueoflegends.com',
} as const;
