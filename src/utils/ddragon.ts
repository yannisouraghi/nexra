// Data Dragon version management and image URL utilities

import { DDRAGON_CONFIG } from '@/config/api';

let cachedVersion: string | null = null;

/**
 * Fetches and caches the latest Data Dragon version
 */
export async function getLatestDDragonVersion(): Promise<string> {
  if (cachedVersion) {
    return cachedVersion;
  }

  try {
    const response = await fetch(`${DDRAGON_CONFIG.BASE_URL}/api/versions.json`);
    const versions = await response.json();
    if (versions && versions.length > 0) {
      cachedVersion = versions[0];
      return versions[0];
    }
  } catch (err) {
    console.error('Failed to fetch DDragon version:', err);
  }

  // Fallback version
  cachedVersion = DDRAGON_CONFIG.FALLBACK_VERSION;
  return DDRAGON_CONFIG.FALLBACK_VERSION;
}

/**
 * Normalizes champion names for Data Dragon URLs
 */
export function normalizeChampionName(name: string): string {
  const specialCases: { [key: string]: string } = {
    // Apostrophes and special characters
    'Bel\'Veth': 'Belveth',
    'Cho\'Gath': 'Chogath',
    'Kai\'Sa': 'Kaisa',
    'Kha\'Zix': 'Khazix',
    'Kog\'Maw': 'KogMaw',
    'Rek\'Sai': 'RekSai',
    'Vel\'Koz': 'Velkoz',
    'K\'Sante': 'KSante',
    // Spaces in names
    'Dr. Mundo': 'DrMundo',
    'Jarvan IV': 'JarvanIV',
    'Lee Sin': 'LeeSin',
    'Master Yi': 'MasterYi',
    'Miss Fortune': 'MissFortune',
    'Renata Glasc': 'Renata',
    'Tahm Kench': 'TahmKench',
    'Twisted Fate': 'TwistedFate',
    'Xin Zhao': 'XinZhao',
    'Aurelion Sol': 'AurelionSol',
    // Special naming conventions
    'Nunu & Willump': 'Nunu',
    'Wukong': 'MonkeyKing',
    // Capitalization issues
    'FiddleSticks': 'Fiddlesticks',
    'Fiddlesticks': 'Fiddlesticks',
    'LeBlanc': 'Leblanc',
    'VelKoz': 'Velkoz',
  };

  // Check for exact match first
  if (specialCases[name]) {
    return specialCases[name];
  }

  // Try case-insensitive match
  const lowerName = name.toLowerCase();
  for (const [key, value] of Object.entries(specialCases)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }

  // Default: remove spaces and apostrophes
  return name.replace(/\s+/g, '').replace(/'/g, '');
}

/**
 * Gets the champion image URL using the latest Data Dragon version
 */
export function getChampionImageUrl(championName: string, version?: string): string {
  const normalized = normalizeChampionName(championName);
  const v = version || cachedVersion || DDRAGON_CONFIG.FALLBACK_VERSION;
  return `${DDRAGON_CONFIG.BASE_URL}/cdn/${v}/img/champion/${normalized}.png`;
}

/**
 * Gets the item image URL using the latest Data Dragon version
 * Returns null for invalid item IDs (0, -1, negative numbers)
 */
export function getItemImageUrl(itemId: number, version?: string): string | null {
  // Validate item ID - return null for invalid IDs
  if (itemId <= 0) {
    return null;
  }
  const v = version || cachedVersion || DDRAGON_CONFIG.FALLBACK_VERSION;
  return `${DDRAGON_CONFIG.BASE_URL}/cdn/${v}/img/item/${itemId}.png`;
}

/**
 * Gets the summoner spell image URL using the latest Data Dragon version
 */
export function getSummonerSpellImageUrl(spellName: string, version?: string): string {
  const v = version || cachedVersion || DDRAGON_CONFIG.FALLBACK_VERSION;
  return `${DDRAGON_CONFIG.BASE_URL}/cdn/${v}/img/spell/${spellName}.png`;
}

/**
 * Gets the champion splash art URL (loading screen style)
 */
export function getChampionSplashUrl(championName: string, skinNum: number = 0): string {
  const normalized = normalizeChampionName(championName);
  return `${DDRAGON_CONFIG.BASE_URL}/cdn/img/champion/loading/${normalized}_${skinNum}.jpg`;
}

/**
 * Gets the champion centered splash art URL (for card backgrounds)
 */
export function getChampionCenteredSplashUrl(championName: string): string {
  const normalized = normalizeChampionName(championName);
  return `${DDRAGON_CONFIG.BASE_URL}/cdn/img/champion/splash/${normalized}_0.jpg`;
}
