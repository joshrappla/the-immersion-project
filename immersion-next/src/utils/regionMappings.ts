// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RegionCacheEntry {
  countries: string[];
  timeframe: string;
  description: string;
}

/** Rich result returned by {@link getRegionInfo}. */
export interface RegionInfo {
  /** How the timePeriod string was resolved. */
  type: 'period' | 'country' | 'unknown';
  /** ISO 3166-1 alpha-2 codes for the resolved countries. */
  countries: string[];
  /** Approximate historical timeframe, if known. */
  timeframe?: string;
  /** The canonical name of the period or country (equals the input for countries). */
  name: string;
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
  'Ottoman Empire':  ['TR', 'EG', 'GR', 'RS', 'BG', 'HU', 'RO', 'SA', 'IQ', 'SY', 'LY', 'TN', 'DZ', 'JO'],
  'Mongol Empire':   ['MN', 'CN', 'RU', 'KZ', 'KG', 'UZ', 'TM', 'AF', 'IR', 'UA'],
};

/**
 * Approximate timeframes for every key in {@link REGION_MAPPINGS}.
 * Used by {@link getRegionInfo} and the admin Region Mappings panel.
 */
export const REGION_TIMEFRAMES: Record<string, string> = {
  'Roman Empire':    '27 BC – 476 AD',
  'Viking Age':      '793 – 1066 AD',
  'British Empire':  '1583 – 1997',
  'Medieval Europe': '500 – 1500 AD',
  'Ancient Greece':  '800 – 146 BC',
  'Ottoman Empire':  '1299 – 1922',
  'Mongol Empire':   '1206 – 1368',
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

/**
 * Returns rich information about a time period string.
 *
 * Resolution order (same as {@link getCountriesForPeriod}):
 *  1. Custom localStorage overrides
 *  2. Static REGION_MAPPINGS
 *  3. Bare ISO alpha-2 country code
 *  4. Unknown (no mapping found)
 */
export function getRegionInfo(timePeriod: string): RegionInfo {
  if (!timePeriod) return { type: 'unknown', countries: [], name: '' };

  // 1. Custom overrides
  if (typeof window !== 'undefined') {
    const custom = getCustomMappings();
    const ciKey = Object.keys(custom).find(
      (k) => k.toLowerCase() === timePeriod.toLowerCase()
    );
    const entry = custom[timePeriod] ?? (ciKey ? custom[ciKey] : undefined);
    if (entry?.countries?.length) {
      return {
        type: 'period',
        countries: entry.countries,
        timeframe: entry.timeframe || undefined,
        name: timePeriod,
      };
    }
  }

  // 2. Static REGION_MAPPINGS (exact + case-insensitive)
  const staticKey =
    REGION_MAPPINGS[timePeriod] !== undefined
      ? timePeriod
      : Object.keys(REGION_MAPPINGS).find(
          (k) => k.toLowerCase() === timePeriod.toLowerCase()
        );
  if (staticKey && REGION_MAPPINGS[staticKey]) {
    return {
      type: 'period',
      countries: REGION_MAPPINGS[staticKey],
      timeframe: REGION_TIMEFRAMES[staticKey],
      name: staticKey,
    };
  }

  // 3. Bare ISO alpha-2 code
  if (timePeriod.trim().length === 2) {
    return { type: 'country', countries: [timePeriod.trim().toUpperCase()], name: timePeriod.trim().toUpperCase() };
  }

  return { type: 'unknown', countries: [], name: timePeriod };
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
