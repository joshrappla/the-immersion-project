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
// Static + custom lookup
// ---------------------------------------------------------------------------

/**
 * Returns ISO 3166-1 alpha-2 country codes for a given time period string.
 *
 * Resolution order (highest → lowest priority):
 *  1. Custom overrides stored in localStorage (user-managed)
 *  2. Exact key match in REGION_MAPPINGS
 *  3. Case-insensitive key match in REGION_MAPPINGS
 *  4. Treat the input as a bare 2-character ISO code
 *  5. Empty array → caller should fall back to the AI lookup
 */
export function getCountriesForPeriod(timePeriod: string): string[] {
  if (!timePeriod) return [];

  // 1. Custom overrides (client-side only, highest priority)
  if (typeof window !== 'undefined') {
    const custom = getCustomMappings();
    const customEntry =
      custom[timePeriod] ??
      custom[
        Object.keys(custom).find((k) => k.toLowerCase() === timePeriod.toLowerCase()) ?? ''
      ];
    if (customEntry?.countries?.length) return customEntry.countries;
  }

  // 2. Exact static match
  if (REGION_MAPPINGS[timePeriod]) return REGION_MAPPINGS[timePeriod];

  // 3. Case-insensitive static match
  const lower = timePeriod.toLowerCase();
  const ciKey = Object.keys(REGION_MAPPINGS).find((k) => k.toLowerCase() === lower);
  if (ciKey) return REGION_MAPPINGS[ciKey];

  // 4. Bare ISO alpha-2 code
  if (timePeriod.trim().length === 2) return [timePeriod.trim().toUpperCase()];

  return [];
}

// ---------------------------------------------------------------------------
// localStorage helpers — AI cache  (key: "regionCache")
// ---------------------------------------------------------------------------

const AI_CACHE_KEY = 'regionCache';

function readAICache(): Record<string, RegionCacheEntry> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(AI_CACHE_KEY) ?? '{}') as Record<
      string,
      RegionCacheEntry
    >;
  } catch {
    return {};
  }
}

/** Returns the cached entry for a period, or null on a miss. */
export function getCachedRegion(timePeriod: string): RegionCacheEntry | null {
  return readAICache()[timePeriod] ?? null;
}

/** Persists an AI-resolved entry to localStorage. */
export function setCachedRegion(timePeriod: string, entry: RegionCacheEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const cache = readAICache();
    cache[timePeriod] = entry;
    localStorage.setItem(AI_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* quota / private-browsing — ignore */
  }
}

/** Returns every AI-cached entry as a plain object. */
export function getAllCachedRegions(): Record<string, RegionCacheEntry> {
  return readAICache();
}

/** Removes a single AI-cached entry. */
export function deleteCachedRegion(timePeriod: string): void {
  if (typeof window === 'undefined') return;
  try {
    const cache = readAICache();
    delete cache[timePeriod];
    localStorage.setItem(AI_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}

/** Removes the entire AI cache. */
export function clearAICache(): void {
  if (typeof window !== 'undefined') {
    try { localStorage.removeItem(AI_CACHE_KEY); } catch { /* ignore */ }
  }
}

// ---------------------------------------------------------------------------
// localStorage helpers — custom mappings  (key: "customRegionMappings")
// ---------------------------------------------------------------------------

const CUSTOM_MAPPINGS_KEY = 'customRegionMappings';

function readCustom(): Record<string, RegionCacheEntry> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_MAPPINGS_KEY) ?? '{}') as Record<
      string,
      RegionCacheEntry
    >;
  } catch {
    return {};
  }
}

/** Returns every custom mapping as a plain object. */
export function getCustomMappings(): Record<string, RegionCacheEntry> {
  return readCustom();
}

/** Saves or updates a custom mapping entry. */
export function setCustomMapping(timePeriod: string, entry: RegionCacheEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const custom = readCustom();
    custom[timePeriod] = entry;
    localStorage.setItem(CUSTOM_MAPPINGS_KEY, JSON.stringify(custom));
  } catch {
    /* ignore */
  }
}

/** Removes a single custom mapping entry. */
export function deleteCustomMapping(timePeriod: string): void {
  if (typeof window === 'undefined') return;
  try {
    const custom = readCustom();
    delete custom[timePeriod];
    localStorage.setItem(CUSTOM_MAPPINGS_KEY, JSON.stringify(custom));
  } catch {
    /* ignore */
  }
}

/** Removes all custom mappings. */
export function clearCustomMappings(): void {
  if (typeof window !== 'undefined') {
    try { localStorage.removeItem(CUSTOM_MAPPINGS_KEY); } catch { /* ignore */ }
  }
}
