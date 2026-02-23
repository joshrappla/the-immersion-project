/**
 * regionInference.ts
 * Main inference engine for automatic country/region determination.
 *
 * Resolution pipeline (highest → lowest priority):
 *  1. Check inference cache (localStorage)
 *  2. Temporal modifiers (year-aware, HIGH confidence)
 *  3. Custom mappings (MEDIUM confidence)
 *  4. Static REGION_MAPPINGS (MEDIUM confidence)
 *  5. Title / description analysis (boosts confidence when combined)
 *  6. AI API with year-aware prompt (MEDIUM/LOW based on AI response)
 *  7. Fallback (LOW confidence)
 */

import { REGION_MAPPINGS } from '@/utils/regionMappings';
import { getCustomMappings } from '@/utils/regionMappings';
import { TEMPORAL_MODIFIERS, resolveTemporalRegion } from '@/data/temporalRegions';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface InferenceParams {
  era: string;
  startYear: number;
  endYear: number;
  title?: string;
  description?: string;
}

export interface InferenceResult {
  countries: string[];
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  suggestions?: string[];
  source: 'temporal' | 'hardcoded' | 'custom' | 'ai' | 'title-analysis' | 'fallback';
  inferredAt: number;
}

// ---------------------------------------------------------------------------
// Inference cache
// ---------------------------------------------------------------------------

const INFERENCE_CACHE_PREFIX = 'inference_';
const INFERENCE_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days for AI results

interface CachedInference extends InferenceResult {
  cachedAt: number;
}

function inferenceKey(params: InferenceParams): string {
  const eraSlug = params.era.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `${INFERENCE_CACHE_PREFIX}${eraSlug}_${params.startYear}_${params.endYear}`;
}

function readInferenceCache(key: string): InferenceResult | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CachedInference;
    // Hardcoded / temporal / custom sources never expire; AI results expire in 30 days
    if (
      entry.source === 'ai' &&
      Date.now() - entry.cachedAt > INFERENCE_CACHE_TTL_MS
    ) {
      localStorage.removeItem(key);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

function writeInferenceCache(key: string, result: InferenceResult): void {
  try {
    const entry: CachedInference = { ...result, cachedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // quota or private-browsing — ignore
  }
}

// ---------------------------------------------------------------------------
// Title / description location analysis
// ---------------------------------------------------------------------------

/** Known city → ISO alpha-2 mappings for text extraction. */
const CITY_TO_COUNTRY: Record<string, string> = {
  rome: 'IT', florence: 'IT', venice: 'IT', naples: 'IT', milan: 'IT',
  paris: 'FR', versailles: 'FR', lyon: 'FR',
  london: 'GB', edinburgh: 'GB', oxford: 'GB', york: 'GB',
  berlin: 'DE', munich: 'DE', hamburg: 'DE', vienna: 'AT',
  moscow: 'RU', leningrad: 'RU', stalingrad: 'RU', 'saint petersburg': 'RU',
  'st. petersburg': 'RU', 'st petersburg': 'RU',
  beijing: 'CN', peking: 'CN', shanghai: 'CN', xian: 'CN', nanjing: 'CN',
  tokyo: 'JP', kyoto: 'JP', osaka: 'JP', edo: 'JP',
  cairo: 'EG', alexandria: 'EG', memphis: 'EG',
  athens: 'GR', sparta: 'GR', corinth: 'GR',
  carthage: 'TN', istanbul: 'TR', constantinople: 'TR', byzantium: 'TR',
  'new york': 'US', washington: 'US', boston: 'US', philadelphia: 'US',
  baghdad: 'IQ', babylon: 'IQ', nineveh: 'IQ',
  jerusalem: 'IL', bethlehem: 'IL',
  damascus: 'SY', aleppo: 'SY',
  delhi: 'IN', agra: 'IN', bombay: 'IN', mumbai: 'IN', calcutta: 'IN',
  amsterdam: 'NL', antwerp: 'BE', brussels: 'BE',
  madrid: 'ES', seville: 'ES', barcelona: 'ES', toledo: 'ES',
  lisbon: 'PT', samarkand: 'UZ', bukhara: 'UZ',
  timbuktu: 'ML',
};

/** Battle / event name → involved countries. */
const EVENT_TO_COUNTRIES: Array<{ pattern: RegExp; countries: string[] }> = [
  { pattern: /\bstalingrad\b/i,             countries: ['RU', 'DE'] },
  { pattern: /\bconstantinople\b/i,         countries: ['TR', 'GR'] },
  { pattern: /\bpearl harbor\b/i,           countries: ['US', 'JP'] },
  { pattern: /\bwaterloo\b/i,              countries: ['BE', 'FR', 'GB', 'NL'] },
  { pattern: /\bgettysburg\b/i,            countries: ['US'] },
  { pattern: /\btrafalgar\b/i,             countries: ['GB', 'FR', 'ES'] },
  { pattern: /\bd-day|normandy landing/i,  countries: ['FR', 'DE', 'GB', 'US', 'CA'] },
  { pattern: /\bhiroshima|nagasaki\b/i,    countries: ['JP', 'US'] },
  { pattern: /\bmarathon\b/i,              countries: ['GR', 'IR'] },
  { pattern: /\bthermopylae\b/i,           countries: ['GR', 'IR'] },
  { pattern: /\bhastings\b/i,              countries: ['GB', 'FR'] },
  { pattern: /\bmos(cow|kva)\b/i,          countries: ['RU', 'FR'] },
  { pattern: /\bamerican revolution/i,     countries: ['US', 'GB'] },
  { pattern: /\bfrench revolution/i,       countries: ['FR'] },
  { pattern: /\brussi(a|an) revolution/i,  countries: ['RU'] },
  { pattern: /\bcivil war\b/i,             countries: ['US'] },
  { pattern: /\bcrimean\b/i,               countries: ['UA', 'RU', 'TR', 'GB', 'FR'] },
  { pattern: /\bspanish armada\b/i,        countries: ['ES', 'GB'] },
  { pattern: /\bnapoleon.{0,20}russia/i,   countries: ['FR', 'RU'] },
  { pattern: /\bjapan(ese)? samurai\b/i,   countries: ['JP'] },
  { pattern: /\bsamurai.{0,20}japan/i,     countries: ['JP'] },
  { pattern: /\bpharaoh|sphinx|pyramid/i,  countries: ['EG'] },
  { pattern: /\bviking.{0,20}raid/i,       countries: ['NO', 'SE', 'DK', 'GB'] },
  { pattern: /\bcrusad/i,                  countries: ['IL', 'LB', 'SY', 'FR', 'DE', 'GB'] },
  { pattern: /\bblack plague|black death\b/i, countries: ['FR', 'DE', 'IT', 'GB', 'ES'] },
  { pattern: /\bopium war\b/i,             countries: ['CN', 'GB'] },
  { pattern: /\bboxer rebellion\b/i,       countries: ['CN', 'GB', 'US', 'DE', 'FR'] },
];

/** Known country / civilization names in text → ISO codes. */
const TEXT_COUNTRY_PATTERNS: Array<{ pattern: RegExp; countries: string[] }> = [
  { pattern: /\brome\b|\broman\b/i,          countries: ['IT'] },
  { pattern: /\bgreek\b|\bgreece\b|\bhellen/i, countries: ['GR'] },
  { pattern: /\begypt(ian)?\b/i,             countries: ['EG'] },
  { pattern: /\bpersia(n)?\b/i,              countries: ['IR'] },
  { pattern: /\bchina\b|\bchinese\b|\bhan dynasty\b/i, countries: ['CN'] },
  { pattern: /\bjapan(ese)?\b/i,             countries: ['JP'] },
  { pattern: /\bmesopotamia\b/i,             countries: ['IQ', 'SY'] },
  { pattern: /\bbabylon(ian)?\b/i,           countries: ['IQ'] },
  { pattern: /\baztec\b/i,                   countries: ['MX'] },
  { pattern: /\binca\b/i,                    countries: ['PE'] },
  { pattern: /\bmaya\b/i,                    countries: ['MX', 'GT', 'BZ'] },
  { pattern: /\bindian?\b|\bindus\b/i,       countries: ['IN'] },
  { pattern: /\bafrica(n)?\b/i,              countries: ['EG', 'NG', 'ET', 'ZA'] },
  { pattern: /\bscandina(via|vian)\b/i,      countries: ['NO', 'SE', 'DK'] },
  { pattern: /\bviking\b/i,                  countries: ['NO', 'SE', 'DK'] },
  { pattern: /\bbyzantin(e|um)\b/i,          countries: ['TR', 'GR'] },
  { pattern: /\bmongol\b/i,                  countries: ['MN', 'CN'] },
  { pattern: /\bkievan rus\b/i,              countries: ['UA', 'RU'] },
  { pattern: /\barab(ic|ia)?\b/i,            countries: ['SA', 'IQ', 'SY', 'EG'] },
  { pattern: /\bamerica(n)?\b|\busa\b|\bu\.s\.a?\.\b/i, countries: ['US'] },
  { pattern: /\bkolkata|bengal\b/i,          countries: ['IN', 'BD'] },
  { pattern: /\bkhmer\b/i,                   countries: ['KH'] },
  { pattern: /\bmughal\b/i,                  countries: ['IN', 'PK', 'AF'] },
  { pattern: /\bsong dynasty\b/i,            countries: ['CN'] },
  { pattern: /\btang dynasty\b/i,            countries: ['CN'] },
];

/**
 * Extracts country codes from a text string using city names, event patterns,
 * and country name patterns. Returns unique codes only.
 */
function extractCountriesFromText(text: string): string[] {
  const found = new Set<string>();
  const lower = text.toLowerCase();

  // City names
  for (const [city, code] of Object.entries(CITY_TO_COUNTRY)) {
    if (lower.includes(city)) found.add(code);
  }

  // Battle / event patterns
  for (const { pattern, countries } of EVENT_TO_COUNTRIES) {
    if (pattern.test(text)) countries.forEach((c) => found.add(c));
  }

  // Country / civilisation name patterns
  for (const { pattern, countries } of TEXT_COUNTRY_PATTERNS) {
    if (pattern.test(text)) countries.forEach((c) => found.add(c));
  }

  return [...found];
}

// ---------------------------------------------------------------------------
// AI API call (year-aware)
// ---------------------------------------------------------------------------

const API_TIMEOUT_MS = 12_000;

interface AIRegionResponse {
  countries: string[];
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  suggestions?: string[];
}

async function fetchAIRegions(params: InferenceParams): Promise<AIRegionResponse | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  const url = new URL('/api/region-lookup', window.location.origin);
  url.searchParams.set('period', params.era);
  url.searchParams.set('startYear', String(params.startYear));
  url.searchParams.set('endYear', String(params.endYear));
  if (params.title) url.searchParams.set('title', params.title.slice(0, 120));

  try {
    console.log(
      `[regionInference] calling AI for "${params.era}" (${params.startYear}–${params.endYear})…`,
    );

    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[regionInference] API returned ${res.status}`);
      return null;
    }

    const data = (await res.json()) as Record<string, unknown>;

    return {
      countries: Array.isArray(data.countries)
        ? (data.countries as unknown[]).filter(
            (c): c is string => typeof c === 'string' && /^[A-Z]{2}$/.test(c),
          )
        : [],
      confidence:
        data.confidence === 'high' || data.confidence === 'medium'
          ? data.confidence
          : 'low',
      reasoning: typeof data.reasoning === 'string' ? data.reasoning : '',
      suggestions: Array.isArray(data.suggestions)
        ? (data.suggestions as unknown[]).filter((s): s is string => typeof s === 'string')
        : undefined,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof DOMException && err.name === 'AbortError';
    console.warn(
      `[regionInference] ${isTimeout ? 'timeout' : 'error'} for "${params.era}":`,
      err,
    );
    return null;
  }
}

// ---------------------------------------------------------------------------
// Confidence helpers
// ---------------------------------------------------------------------------

function computeConfidence(
  params: InferenceParams,
  source: InferenceResult['source'],
  temporalNote?: string,
): 'high' | 'medium' | 'low' {
  const yearSpan = params.endYear - params.startYear;

  if (source === 'temporal') {
    // HIGH if the temporal note describes a specific slice (not "default")
    return temporalNote && !temporalNote.includes('Default') ? 'high' : 'medium';
  }
  if (source === 'hardcoded' || source === 'custom') return 'medium';
  if (source === 'title-analysis') return yearSpan < 100 ? 'medium' : 'low';
  if (source === 'ai')           return 'medium';
  return 'low';
}

// ---------------------------------------------------------------------------
// Main export — inferRegions
// ---------------------------------------------------------------------------

/**
 * Infers country codes for a historical media item given its era and year range.
 *
 * Logs the resolution path and timing to the console.
 */
export async function inferRegions(params: InferenceParams): Promise<InferenceResult> {
  const t0 = performance.now();
  const key = inferenceKey(params);

  // ── 0. Cache ──────────────────────────────────────────────────────────────
  const cached = readInferenceCache(key);
  if (cached) {
    console.log(
      `[regionInference] cache hit: "${params.era}" (${params.startYear}–${params.endYear})`,
      `source=${cached.source} confidence=${cached.confidence}`,
      `countries=[${cached.countries.join(',')}]`,
    );
    return cached;
  }

  let result: InferenceResult;

  // ── 1. Temporal modifiers (year-aware) ────────────────────────────────────
  const temporal = resolveTemporalRegion(params.era, params.startYear, params.endYear);
  if (temporal) {
    const confidence = computeConfidence(params, 'temporal', temporal.note);
    result = {
      countries: temporal.countries,
      confidence,
      reasoning: temporal.note,
      source: 'temporal',
      inferredAt: Date.now(),
    };
    console.log(
      `[regionInference] temporal: "${params.era}" (${params.startYear}–${params.endYear})`,
      `→ ${result.countries.length} countries, confidence=${confidence}`,
      `note="${temporal.note}"`,
      `(${(performance.now() - t0).toFixed(0)}ms)`,
    );
    writeInferenceCache(key, result);
    return result;
  }

  // ── 2. Custom mappings ────────────────────────────────────────────────────
  if (typeof window !== 'undefined') {
    const custom = getCustomMappings();
    const customKey = Object.keys(custom).find(
      (k) => k.toLowerCase() === params.era.toLowerCase(),
    );
    if (customKey && custom[customKey]?.countries?.length) {
      result = {
        countries: custom[customKey].countries,
        confidence: 'medium',
        reasoning: `Custom mapping for "${customKey}"`,
        source: 'custom',
        inferredAt: Date.now(),
      };
      console.log(
        `[regionInference] custom: "${params.era}"`,
        `→ ${result.countries.length} countries`,
        `(${(performance.now() - t0).toFixed(0)}ms)`,
      );
      writeInferenceCache(key, result);
      return result;
    }
  }

  // ── 3. Static REGION_MAPPINGS ─────────────────────────────────────────────
  const staticKey = Object.keys(REGION_MAPPINGS).find(
    (k) => k.toLowerCase() === params.era.toLowerCase(),
  );
  if (staticKey) {
    result = {
      countries: REGION_MAPPINGS[staticKey],
      confidence: 'medium',
      reasoning: `Hardcoded mapping for "${staticKey}" (not year-adjusted)`,
      source: 'hardcoded',
      inferredAt: Date.now(),
    };
    console.log(
      `[regionInference] hardcoded: "${params.era}"`,
      `→ ${result.countries.length} countries`,
      `(${(performance.now() - t0).toFixed(0)}ms)`,
    );
    writeInferenceCache(key, result);
    return result;
  }

  // ── 4. Title / description analysis ──────────────────────────────────────
  const textToAnalyze = [params.era, params.title ?? '', params.description ?? ''].join(' ');
  const textCountries = extractCountriesFromText(textToAnalyze);

  if (textCountries.length > 0) {
    const yearSpan = params.endYear - params.startYear;
    const confidence = computeConfidence(params, 'title-analysis');
    result = {
      countries: textCountries,
      confidence,
      reasoning: `Extracted location hints from title/description text`,
      source: 'title-analysis',
      inferredAt: Date.now(),
    };

    // If the year span is short and we found countries, escalate to HIGH
    if (yearSpan <= 50 && textCountries.length <= 5) {
      result.confidence = 'high';
    }

    console.log(
      `[regionInference] title-analysis: "${params.era}" + "${params.title ?? ''}"`,
      `→ ${textCountries.join(',')} confidence=${result.confidence}`,
      `(${(performance.now() - t0).toFixed(0)}ms)`,
    );

    // Still call AI to potentially refine, but use text result as suggestions
    // if AI fails
    const aiData = await fetchAIRegions(params);
    if (aiData && aiData.countries.length > 0) {
      result = {
        countries: aiData.countries,
        confidence: aiData.confidence,
        reasoning: aiData.reasoning || result.reasoning,
        suggestions: textCountries.length ? [textCountries.join(', ')] : aiData.suggestions,
        source: 'ai',
        inferredAt: Date.now(),
      };
      console.log(
        `[regionInference] ai (after text): "${params.era}"`,
        `→ ${result.countries.length} countries confidence=${result.confidence}`,
        `(${(performance.now() - t0).toFixed(0)}ms)`,
      );
    }

    writeInferenceCache(key, result);
    return result;
  }

  // ── 5. AI API (year-aware, unknown era) ───────────────────────────────────
  const aiData = await fetchAIRegions(params);
  if (aiData && aiData.countries.length > 0) {
    result = {
      countries: aiData.countries,
      confidence: aiData.confidence,
      reasoning: aiData.reasoning || `AI inference for "${params.era}" (${params.startYear}–${params.endYear})`,
      suggestions: aiData.suggestions,
      source: 'ai',
      inferredAt: Date.now(),
    };
    console.log(
      `[regionInference] ai: "${params.era}" (${params.startYear}–${params.endYear})`,
      `→ ${result.countries.length} countries confidence=${result.confidence}`,
      `(${(performance.now() - t0).toFixed(0)}ms)`,
    );
    writeInferenceCache(key, result);
    return result;
  }

  // ── 6. Fallback ───────────────────────────────────────────────────────────
  console.warn(
    `[regionInference] fallback (no data found): "${params.era}"`,
    `(${(performance.now() - t0).toFixed(0)}ms)`,
  );
  result = {
    countries: [],
    confidence: 'low',
    reasoning: `No mapping found for "${params.era}" in the ${params.startYear}–${params.endYear} range`,
    source: 'fallback',
    inferredAt: Date.now(),
  };
  // Don't cache fallback results so retries can succeed
  return result;
}

// ---------------------------------------------------------------------------
// Cache management helpers
// ---------------------------------------------------------------------------

/** Removes all inference cache entries from localStorage. */
export function clearInferenceCache(): void {
  if (typeof window === 'undefined') return;
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(INFERENCE_CACHE_PREFIX)) toRemove.push(k);
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
  console.log(`[regionInference] cleared ${toRemove.length} inference cache entries`);
}

/** Removes the cached inference for specific parameters. */
export function clearInferenceCacheEntry(params: InferenceParams): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(inferenceKey(params));
}

/** Returns all known temporal era names (for autocomplete). */
export function getKnownEraNames(): string[] {
  return [...Object.keys(TEMPORAL_MODIFIERS), ...Object.keys(REGION_MAPPINGS)];
}
