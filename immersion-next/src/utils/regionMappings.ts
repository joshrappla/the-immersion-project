// Maps historical periods / empires to the ISO 3166-1 alpha-2 codes of the
// modern countries that made up (or were significantly influenced by) that era.
export const REGION_MAPPINGS: Record<string, string[]> = {
  'Roman Empire':    ['IT', 'FR', 'ES', 'GR', 'TR', 'EG', 'GB'],
  'Viking Age':      ['NO', 'SE', 'DK', 'IS', 'GB', 'IE'],
  'British Empire':  ['GB', 'IN', 'CA', 'AU', 'ZA', 'NZ'],
  'Medieval Europe': ['FR', 'DE', 'IT', 'ES', 'GB'],
  'Ancient Greece':  ['GR', 'TR', 'IT'],
};

/**
 * Returns an array of ISO 3166-1 alpha-2 country codes for a given period /
 * empire / civilisation string.
 *
 * Resolution order:
 *  1. Exact key match in REGION_MAPPINGS
 *  2. Case-insensitive key match in REGION_MAPPINGS
 *  3. If the string is already a 2-character code, return it as-is
 *  4. Empty array (no mapping found)
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
