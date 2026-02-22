/**
 * regionAI.ts
 * Client-side utility for resolving historical time periods to country codes.
 *
 * Resolution pipeline (in order):
 *  1. Static REGION_MAPPINGS (instant, no network)
 *  2. Per-entry localStorage cache (`regionCache_<period>`, with timestamp)
 *  3. AI API call via /api/region-lookup (10-second timeout)
 *  4. Intelligent name-matching fallback (no crash guarantee)
 */

import { REGION_MAPPINGS, REGION_TIMEFRAMES } from '@/utils/regionMappings';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AIRegionResult {
  type: 'country' | 'empire' | 'era';
  countries: string[];
  timeframe: string;
  description: string;
  /** How this result was resolved. */
  source: 'hardcoded' | 'cache' | 'ai' | 'fallback';
}

interface CacheEntry {
  type: 'country' | 'empire' | 'era';
  countries: string[];
  timeframe: string;
  description: string;
  /** Unix ms timestamp of when this entry was written. */
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Cache helpers  (key per entry: "regionCache_<timePeriod>")
// ---------------------------------------------------------------------------

const CACHE_PREFIX = 'regionCache_';
const API_TIMEOUT_MS = 10_000;

function cacheKey(timePeriod: string): string {
  return `${CACHE_PREFIX}${timePeriod}`;
}

function readCacheEntry(timePeriod: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(cacheKey(timePeriod));
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

function writeCacheEntry(
  timePeriod: string,
  data: Omit<CacheEntry, 'timestamp'>
): void {
  try {
    const entry: CacheEntry = { ...data, timestamp: Date.now() };
    localStorage.setItem(cacheKey(timePeriod), JSON.stringify(entry));
  } catch {
    /* quota exceeded or private-browsing — ignore */
  }
}

// ---------------------------------------------------------------------------
// Intelligent fallback (used when the AI API is unavailable)
// ---------------------------------------------------------------------------

/** Common country / region name → ISO alpha-2 mappings for the fallback path. */
const NAME_TO_CODE: Record<string, string> = {
  // Europe
  france: 'FR', germany: 'DE', spain: 'ES', italy: 'IT', portugal: 'PT',
  greece: 'GR', turkey: 'TR', russia: 'RU', ukraine: 'UA', poland: 'PL',
  austria: 'AT', switzerland: 'CH', netherlands: 'NL', belgium: 'BE',
  sweden: 'SE', norway: 'NO', denmark: 'DK', finland: 'FI', ireland: 'IE',
  iceland: 'IS', hungary: 'HU', romania: 'RO', bulgaria: 'BG', serbia: 'RS',
  // Middle East / North Africa
  egypt: 'EG', iran: 'IR', iraq: 'IQ', syria: 'SY', jordan: 'JO',
  'saudi arabia': 'SA', israel: 'IL', lebanon: 'LB',
  libya: 'LY', tunisia: 'TN', algeria: 'DZ', morocco: 'MA',
  // Central / East Asia
  china: 'CN', japan: 'JP', korea: 'KR', mongolia: 'MN',
  kazakhstan: 'KZ', uzbekistan: 'UZ', afghanistan: 'AF', pakistan: 'PK',
  india: 'IN', vietnam: 'VN', thailand: 'TH', indonesia: 'ID',
  // Africa
  'south africa': 'ZA', nigeria: 'NG', ethiopia: 'ET', kenya: 'KE',
  // Americas
  'united states': 'US', usa: 'US', america: 'US', canada: 'CA',
  mexico: 'MX', brazil: 'BR', argentina: 'AR', peru: 'PE', colombia: 'CO',
  // Oceania
  australia: 'AU', 'new zealand': 'NZ',
  // British Isles
  england: 'GB', britain: 'GB', 'great britain': 'GB',
  'united kingdom': 'GB', scotland: 'GB', wales: 'GB',
};

function guessFallback(timePeriod: string): AIRegionResult {
  const lower = timePeriod.toLowerCase();

  // 1. Try substring match against known country names
  for (const [name, code] of Object.entries(NAME_TO_CODE)) {
    if (lower.includes(name)) {
      console.log(`[regionAI] fallback matched "${name}" → ${code} for "${timePeriod}"`);
      return {
        type: 'country',
        countries: [code],
        timeframe: '',
        description: `Matched "${name}" in period name`,
        source: 'fallback',
      };
    }
  }

  // 2. Extract bare uppercase 2-letter code from the text
  const codeMatch = timePeriod.match(/\b([A-Z]{2})\b/);
  if (codeMatch) {
    return {
      type: 'country',
      countries: [codeMatch[1]],
      timeframe: '',
      description: `Extracted code from "${timePeriod}"`,
      source: 'fallback',
    };
  }

  // 3. Give up — no countries, type era (map shows nothing but doesn't crash)
  console.warn(`[regionAI] fallback could not determine region for "${timePeriod}"`);
  return { type: 'era', countries: [], timeframe: '', description: timePeriod, source: 'fallback' };
}

// ---------------------------------------------------------------------------
// Main public function
// ---------------------------------------------------------------------------

/**
 * Resolves a historical time-period string to an {@link AIRegionResult}.
 *
 * Logs the resolution source to the console so you can verify:
 *   hardcoded / cache / ai / fallback
 */
export async function getRegionsFromAI(timePeriod: string): Promise<AIRegionResult> {
  // ── 1. Static REGION_MAPPINGS ─────────────────────────────────────────────
  const staticKey =
    REGION_MAPPINGS[timePeriod] !== undefined
      ? timePeriod
      : Object.keys(REGION_MAPPINGS).find(
          (k) => k.toLowerCase() === timePeriod.toLowerCase()
        );

  if (staticKey) {
    console.log(`[regionAI] hardcoded: "${timePeriod}"`);
    return {
      type: 'empire',
      countries: REGION_MAPPINGS[staticKey],
      timeframe: REGION_TIMEFRAMES[staticKey] ?? '',
      description: `${staticKey} — hardcoded mapping`,
      source: 'hardcoded',
    };
  }

  // Bare ISO alpha-2 code
  if (timePeriod.trim().length === 2) {
    console.log(`[regionAI] hardcoded (bare code): "${timePeriod}"`);
    return {
      type: 'country',
      countries: [timePeriod.trim().toUpperCase()],
      timeframe: '',
      description: '',
      source: 'hardcoded',
    };
  }

  // ── 2. localStorage cache ─────────────────────────────────────────────────
  const cached = readCacheEntry(timePeriod);
  if (cached) {
    console.log(`[regionAI] cache: "${timePeriod}" (cached at ${new Date(cached.timestamp).toISOString()})`);
    return { ...cached, source: 'cache' };
  }

  // ── 3. AI API call ────────────────────────────────────────────────────────
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    console.warn(`[regionAI] timeout after ${API_TIMEOUT_MS}ms for "${timePeriod}"`);
  }, API_TIMEOUT_MS);

  try {
    console.log(`[regionAI] calling AI for "${timePeriod}"…`);

    const res = await fetch(
      `/api/region-lookup?period=${encodeURIComponent(timePeriod)}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = (await res.json()) as {
      type?: string;
      countries?: string[];
      timeframe?: string;
      description?: string;
    };

    const type: AIRegionResult['type'] =
      data.type === 'country' || data.type === 'empire' || data.type === 'era'
        ? data.type
        : 'era';

    const result: AIRegionResult = {
      type,
      countries: Array.isArray(data.countries)
        ? data.countries.filter((c): c is string => typeof c === 'string' && c.length === 2)
        : [],
      timeframe: typeof data.timeframe === 'string' ? data.timeframe : '',
      description: typeof data.description === 'string' ? data.description : '',
      source: 'ai',
    };

    console.log(`[regionAI] ai: "${timePeriod}"`, result);

    // Persist to per-entry cache
    writeCacheEntry(timePeriod, {
      type: result.type,
      countries: result.countries,
      timeframe: result.timeframe,
      description: result.description,
    });

    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof DOMException && err.name === 'AbortError';
    console.error(
      `[regionAI] ${isTimeout ? 'timeout' : 'error'} for "${timePeriod}":`,
      err
    );
    return guessFallback(timePeriod);
  }
}

// ---------------------------------------------------------------------------
// Cache management utilities
// ---------------------------------------------------------------------------

export interface CacheStats {
  entries: number;
  /** Total size of all regionCache_ entries in kilobytes. */
  size: number;
  oldest: number | null;
  newest: number | null;
}

/** Returns statistics about the AI region cache. */
export function getCacheStats(): CacheStats {
  if (typeof window === 'undefined') return { entries: 0, size: 0, oldest: null, newest: null };

  let totalBytes = 0;
  const timestamps: number[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(CACHE_PREFIX)) continue;
    const raw = localStorage.getItem(key) ?? '';
    totalBytes += raw.length;
    try {
      const parsed = JSON.parse(raw) as Partial<CacheEntry>;
      if (typeof parsed.timestamp === 'number') timestamps.push(parsed.timestamp);
    } catch {
      /* skip corrupt entries */
    }
  }

  return {
    entries: timestamps.length,
    size: Math.round((totalBytes / 1024) * 10) / 10,
    oldest: timestamps.length ? Math.min(...timestamps) : null,
    newest: timestamps.length ? Math.max(...timestamps) : null,
  };
}

/** Removes all `regionCache_*` entries from localStorage. */
export function clearCache(): void {
  if (typeof window === 'undefined') return;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) keysToRemove.push(key);
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
  console.log(`[regionAI] cleared ${keysToRemove.length} cache entries`);
}

/** Removes a single cached entry by time period name. */
export function clearCacheEntry(timePeriod: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(cacheKey(timePeriod));
  console.log(`[regionAI] cleared cache entry for "${timePeriod}"`);
}
