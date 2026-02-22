// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RegionCacheEntry {
  countries: string[];
  timeframe: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Static mappings
// ---------------------------------------------------------------------------

// Maps historical periods / empires to the ISO 3166-1 alpha-2 codes of the
// modern countries that made up (or were significantly influenced by) that era.
export const REGION_MAPPINGS: Record<string, string[]> = {
  'Roman Empire':    ['IT', 'FR', 'ES', 'GR', 'TR', 'EG', 'GB'],
  'Viking Age':      ['NO', 'SE', 'DK', 'IS', 'GB', 'IE'],
  'British Empire':  ['GB', 'IN', 'CA', 'AU', 'ZA', 'NZ'],
  'Medieval Europe': ['FR', 'DE', 'IT', 'ES', 'GB'],
  'Ancient Greece':  ['GR', 'TR', 'IT'],
};

// ---------------------------------------------------------------------------
// Static lookup
// ---------------------------------------------------------------------------

/**
 * Returns an array of ISO 3166-1 alpha-2 country codes for a given period /
 * empire / civilisation string.
 *
 * Resolution order:
 *  1. Exact key match in REGION_MAPPINGS
 *  2. Case-insensitive key match in REGION_MAPPINGS
 *  3. If the string is already a 2-character code, return it as-is
 *  4. Empty array → caller should try the AI fallback
 */
export function getCountriesForPeriod(timePeriod: string): string[] {
  if (!timePeriod) return [];

  // 1. Exact match
  if (REGION_MAPPINGS[timePeriod]) {
    return REGION_MAPPINGS[timePeriod];
  }

  // 2. Case-insensitive match
  const lower = timePeriod.toLowerCase();
  const caseInsensitiveKey = Object.keys(REGION_MAPPINGS).find(
    (k) => k.toLowerCase() === lower
  );
  if (caseInsensitiveKey) {
    return REGION_MAPPINGS[caseInsensitiveKey];
  }

  // 3. Treat as a bare ISO alpha-2 code
  if (timePeriod.trim().length === 2) {
    return [timePeriod.trim().toUpperCase()];
  }

  return [];
}

// ---------------------------------------------------------------------------
// localStorage cache helpers (client-side only)
// ---------------------------------------------------------------------------

const CACHE_STORAGE_KEY = 'regionCache';

/** Read the full cache object from localStorage (safe — returns {} on error). */
function readCache(): Record<string, RegionCacheEntry> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(CACHE_STORAGE_KEY) ?? '{}') as Record<
      string,
      RegionCacheEntry
    >;
  } catch {
    return {};
  }
}

/**
 * Returns the cached `RegionCacheEntry` for a time period, or `null` if it
 * has not been resolved yet.
 */
export function getCachedRegion(timePeriod: string): RegionCacheEntry | null {
  return readCache()[timePeriod] ?? null;
}

/**
 * Persists an AI-resolved `RegionCacheEntry` to localStorage so subsequent
 * page loads skip the API round-trip.
 */
export function setCachedRegion(timePeriod: string, entry: RegionCacheEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const cache = readCache();
    cache[timePeriod] = entry;
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Storage quota exceeded or private-browsing restriction — silently ignore.
  }
}
