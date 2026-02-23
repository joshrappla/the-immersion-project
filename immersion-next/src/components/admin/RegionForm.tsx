'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { REGION_MAPPINGS, getCustomMappings } from '@/utils/regionMappings';
import RegionMapPreview from './RegionMapPreview';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RegionFormData {
  period: string;
  countries: string[];
  timeframe: string;
  description: string;
}

interface Props {
  /** When set, the period field is locked (editing an existing entry). */
  initialPeriod?: string;
  initialData?: Omit<RegionFormData, 'period'>;
  onSave: (data: RegionFormData) => void;
  onCancel: () => void;
}

interface TestStep {
  label: string;
  status: 'hit' | 'miss' | 'pending' | 'error';
  detail: string;
  ms: number;
}

interface AIResult {
  type?: string;
  countries?: string[];
  timeframe?: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// ISO country code data  (alpha-2 → full name + continent)
// ---------------------------------------------------------------------------

type Continent = 'Africa' | 'Americas' | 'Asia' | 'Europe' | 'Oceania';

const ISO_CODES: Record<string, { name: string; continent: Continent }> = {
  // Africa
  DZ: { name: 'Algeria', continent: 'Africa' },
  AO: { name: 'Angola', continent: 'Africa' },
  BJ: { name: 'Benin', continent: 'Africa' },
  BW: { name: 'Botswana', continent: 'Africa' },
  BF: { name: 'Burkina Faso', continent: 'Africa' },
  BI: { name: 'Burundi', continent: 'Africa' },
  CM: { name: 'Cameroon', continent: 'Africa' },
  CF: { name: 'Central African Republic', continent: 'Africa' },
  TD: { name: 'Chad', continent: 'Africa' },
  CG: { name: 'Congo', continent: 'Africa' },
  CD: { name: 'DR Congo', continent: 'Africa' },
  DJ: { name: 'Djibouti', continent: 'Africa' },
  EG: { name: 'Egypt', continent: 'Africa' },
  ER: { name: 'Eritrea', continent: 'Africa' },
  ET: { name: 'Ethiopia', continent: 'Africa' },
  GA: { name: 'Gabon', continent: 'Africa' },
  GM: { name: 'Gambia', continent: 'Africa' },
  GH: { name: 'Ghana', continent: 'Africa' },
  GN: { name: 'Guinea', continent: 'Africa' },
  GW: { name: 'Guinea-Bissau', continent: 'Africa' },
  CI: { name: 'Ivory Coast', continent: 'Africa' },
  KE: { name: 'Kenya', continent: 'Africa' },
  LS: { name: 'Lesotho', continent: 'Africa' },
  LR: { name: 'Liberia', continent: 'Africa' },
  LY: { name: 'Libya', continent: 'Africa' },
  MG: { name: 'Madagascar', continent: 'Africa' },
  MW: { name: 'Malawi', continent: 'Africa' },
  ML: { name: 'Mali', continent: 'Africa' },
  MR: { name: 'Mauritania', continent: 'Africa' },
  MU: { name: 'Mauritius', continent: 'Africa' },
  MA: { name: 'Morocco', continent: 'Africa' },
  MZ: { name: 'Mozambique', continent: 'Africa' },
  NA: { name: 'Namibia', continent: 'Africa' },
  NE: { name: 'Niger', continent: 'Africa' },
  NG: { name: 'Nigeria', continent: 'Africa' },
  RW: { name: 'Rwanda', continent: 'Africa' },
  SN: { name: 'Senegal', continent: 'Africa' },
  SL: { name: 'Sierra Leone', continent: 'Africa' },
  SO: { name: 'Somalia', continent: 'Africa' },
  ZA: { name: 'South Africa', continent: 'Africa' },
  SS: { name: 'South Sudan', continent: 'Africa' },
  SD: { name: 'Sudan', continent: 'Africa' },
  SZ: { name: 'Eswatini', continent: 'Africa' },
  TZ: { name: 'Tanzania', continent: 'Africa' },
  TG: { name: 'Togo', continent: 'Africa' },
  TN: { name: 'Tunisia', continent: 'Africa' },
  UG: { name: 'Uganda', continent: 'Africa' },
  ZM: { name: 'Zambia', continent: 'Africa' },
  ZW: { name: 'Zimbabwe', continent: 'Africa' },
  // Americas
  AR: { name: 'Argentina', continent: 'Americas' },
  BO: { name: 'Bolivia', continent: 'Americas' },
  BR: { name: 'Brazil', continent: 'Americas' },
  CA: { name: 'Canada', continent: 'Americas' },
  CL: { name: 'Chile', continent: 'Americas' },
  CO: { name: 'Colombia', continent: 'Americas' },
  CR: { name: 'Costa Rica', continent: 'Americas' },
  CU: { name: 'Cuba', continent: 'Americas' },
  DO: { name: 'Dominican Republic', continent: 'Americas' },
  EC: { name: 'Ecuador', continent: 'Americas' },
  SV: { name: 'El Salvador', continent: 'Americas' },
  GT: { name: 'Guatemala', continent: 'Americas' },
  GY: { name: 'Guyana', continent: 'Americas' },
  HT: { name: 'Haiti', continent: 'Americas' },
  HN: { name: 'Honduras', continent: 'Americas' },
  JM: { name: 'Jamaica', continent: 'Americas' },
  MX: { name: 'Mexico', continent: 'Americas' },
  NI: { name: 'Nicaragua', continent: 'Americas' },
  PA: { name: 'Panama', continent: 'Americas' },
  PY: { name: 'Paraguay', continent: 'Americas' },
  PE: { name: 'Peru', continent: 'Americas' },
  TT: { name: 'Trinidad and Tobago', continent: 'Americas' },
  US: { name: 'United States', continent: 'Americas' },
  UY: { name: 'Uruguay', continent: 'Americas' },
  VE: { name: 'Venezuela', continent: 'Americas' },
  // Asia
  AF: { name: 'Afghanistan', continent: 'Asia' },
  AM: { name: 'Armenia', continent: 'Asia' },
  AZ: { name: 'Azerbaijan', continent: 'Asia' },
  BH: { name: 'Bahrain', continent: 'Asia' },
  BD: { name: 'Bangladesh', continent: 'Asia' },
  BT: { name: 'Bhutan', continent: 'Asia' },
  BN: { name: 'Brunei', continent: 'Asia' },
  KH: { name: 'Cambodia', continent: 'Asia' },
  CN: { name: 'China', continent: 'Asia' },
  GE: { name: 'Georgia', continent: 'Asia' },
  IN: { name: 'India', continent: 'Asia' },
  ID: { name: 'Indonesia', continent: 'Asia' },
  IR: { name: 'Iran', continent: 'Asia' },
  IQ: { name: 'Iraq', continent: 'Asia' },
  IL: { name: 'Israel', continent: 'Asia' },
  JP: { name: 'Japan', continent: 'Asia' },
  JO: { name: 'Jordan', continent: 'Asia' },
  KZ: { name: 'Kazakhstan', continent: 'Asia' },
  KW: { name: 'Kuwait', continent: 'Asia' },
  KG: { name: 'Kyrgyzstan', continent: 'Asia' },
  LA: { name: 'Laos', continent: 'Asia' },
  LB: { name: 'Lebanon', continent: 'Asia' },
  MY: { name: 'Malaysia', continent: 'Asia' },
  MV: { name: 'Maldives', continent: 'Asia' },
  MN: { name: 'Mongolia', continent: 'Asia' },
  MM: { name: 'Myanmar', continent: 'Asia' },
  NP: { name: 'Nepal', continent: 'Asia' },
  KP: { name: 'North Korea', continent: 'Asia' },
  OM: { name: 'Oman', continent: 'Asia' },
  PK: { name: 'Pakistan', continent: 'Asia' },
  PS: { name: 'Palestine', continent: 'Asia' },
  PH: { name: 'Philippines', continent: 'Asia' },
  QA: { name: 'Qatar', continent: 'Asia' },
  SA: { name: 'Saudi Arabia', continent: 'Asia' },
  SG: { name: 'Singapore', continent: 'Asia' },
  KR: { name: 'South Korea', continent: 'Asia' },
  LK: { name: 'Sri Lanka', continent: 'Asia' },
  SY: { name: 'Syria', continent: 'Asia' },
  TW: { name: 'Taiwan', continent: 'Asia' },
  TJ: { name: 'Tajikistan', continent: 'Asia' },
  TH: { name: 'Thailand', continent: 'Asia' },
  TL: { name: 'Timor-Leste', continent: 'Asia' },
  TM: { name: 'Turkmenistan', continent: 'Asia' },
  AE: { name: 'UAE', continent: 'Asia' },
  UZ: { name: 'Uzbekistan', continent: 'Asia' },
  VN: { name: 'Vietnam', continent: 'Asia' },
  YE: { name: 'Yemen', continent: 'Asia' },
  // Europe
  AL: { name: 'Albania', continent: 'Europe' },
  AD: { name: 'Andorra', continent: 'Europe' },
  AT: { name: 'Austria', continent: 'Europe' },
  BY: { name: 'Belarus', continent: 'Europe' },
  BE: { name: 'Belgium', continent: 'Europe' },
  BA: { name: 'Bosnia and Herzegovina', continent: 'Europe' },
  BG: { name: 'Bulgaria', continent: 'Europe' },
  HR: { name: 'Croatia', continent: 'Europe' },
  CY: { name: 'Cyprus', continent: 'Europe' },
  CZ: { name: 'Czech Republic', continent: 'Europe' },
  DK: { name: 'Denmark', continent: 'Europe' },
  EE: { name: 'Estonia', continent: 'Europe' },
  FI: { name: 'Finland', continent: 'Europe' },
  FR: { name: 'France', continent: 'Europe' },
  DE: { name: 'Germany', continent: 'Europe' },
  GR: { name: 'Greece', continent: 'Europe' },
  HU: { name: 'Hungary', continent: 'Europe' },
  IS: { name: 'Iceland', continent: 'Europe' },
  IE: { name: 'Ireland', continent: 'Europe' },
  IT: { name: 'Italy', continent: 'Europe' },
  XK: { name: 'Kosovo', continent: 'Europe' },
  LV: { name: 'Latvia', continent: 'Europe' },
  LI: { name: 'Liechtenstein', continent: 'Europe' },
  LT: { name: 'Lithuania', continent: 'Europe' },
  LU: { name: 'Luxembourg', continent: 'Europe' },
  MT: { name: 'Malta', continent: 'Europe' },
  MD: { name: 'Moldova', continent: 'Europe' },
  MC: { name: 'Monaco', continent: 'Europe' },
  ME: { name: 'Montenegro', continent: 'Europe' },
  NL: { name: 'Netherlands', continent: 'Europe' },
  MK: { name: 'North Macedonia', continent: 'Europe' },
  NO: { name: 'Norway', continent: 'Europe' },
  PL: { name: 'Poland', continent: 'Europe' },
  PT: { name: 'Portugal', continent: 'Europe' },
  RO: { name: 'Romania', continent: 'Europe' },
  RU: { name: 'Russia', continent: 'Europe' },
  SM: { name: 'San Marino', continent: 'Europe' },
  RS: { name: 'Serbia', continent: 'Europe' },
  SK: { name: 'Slovakia', continent: 'Europe' },
  SI: { name: 'Slovenia', continent: 'Europe' },
  ES: { name: 'Spain', continent: 'Europe' },
  SE: { name: 'Sweden', continent: 'Europe' },
  CH: { name: 'Switzerland', continent: 'Europe' },
  TR: { name: 'Turkey', continent: 'Europe' },
  UA: { name: 'Ukraine', continent: 'Europe' },
  GB: { name: 'United Kingdom', continent: 'Europe' },
  // Oceania
  AU: { name: 'Australia', continent: 'Oceania' },
  FJ: { name: 'Fiji', continent: 'Oceania' },
  KI: { name: 'Kiribati', continent: 'Oceania' },
  NZ: { name: 'New Zealand', continent: 'Oceania' },
  PG: { name: 'Papua New Guinea', continent: 'Oceania' },
  WS: { name: 'Samoa', continent: 'Oceania' },
  SB: { name: 'Solomon Islands', continent: 'Oceania' },
  TO: { name: 'Tonga', continent: 'Oceania' },
  TV: { name: 'Tuvalu', continent: 'Oceania' },
  VU: { name: 'Vanuatu', continent: 'Oceania' },
};

const KNOWN_CODES = new Set(Object.keys(ISO_CODES));
const CONTINENT_ORDER: Continent[] = ['Europe', 'Asia', 'Africa', 'Americas', 'Oceania'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseCodes(raw: string): string[] {
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z]{2}$/.test(s));
}

/** Returns tokens that were typed but failed to parse as valid 2-char codes. */
function getInvalidTokens(raw: string): string[] {
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !/^[A-Za-z]{2}$/.test(s));
}

/** Returns valid-format codes that aren't in the known ISO list. */
function getUnrecognizedCodes(codes: string[]): string[] {
  return codes.filter((c) => !KNOWN_CODES.has(c));
}

/** Simple fuzzy match: starts-with first, then includes. */
function fuzzyMatch(query: string, candidates: string[]): string[] {
  const q = query.toLowerCase();
  const startsWith = candidates.filter((c) => c.toLowerCase().startsWith(q));
  const includes = candidates.filter(
    (c) => !c.toLowerCase().startsWith(q) && c.toLowerCase().includes(q)
  );
  return [...startsWith, ...includes].slice(0, 8);
}

/** Simple Levenshtein distance for "did you mean?" suggestions. */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function getDidYouMean(query: string, candidates: string[]): string | null {
  if (query.length < 3) return null;
  const q = query.toLowerCase();
  const scored = candidates
    .map((c) => ({ c, d: levenshtein(q, c.toLowerCase()) }))
    .filter(({ d }) => d <= 3 && d > 0)
    .sort((a, b) => a.d - b.d);
  return scored[0]?.c ?? null;
}

// ---------------------------------------------------------------------------
// Sub-component: Country Code Picker
// ---------------------------------------------------------------------------

function CountryCodePicker({
  onSelect,
  onClose,
  existingCodes,
}: {
  onSelect: (code: string) => void;
  onClose: () => void;
  existingCodes: Set<string>;
}) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = Object.entries(ISO_CODES).filter(([code, { name }]) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return code.toLowerCase().includes(q) || name.toLowerCase().includes(q);
  });

  // Group by continent
  const byContinent: Partial<Record<Continent, [string, { name: string; continent: Continent }][]>> = {};
  for (const entry of filtered) {
    const cont = entry[1].continent;
    if (!byContinent[cont]) byContinent[cont] = [];
    byContinent[cont]!.push(entry);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-700">
          <h3 className="text-white font-semibold text-sm">Country Code Picker</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-800">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search country or code…"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        {/* Grid of codes */}
        <div className="overflow-y-auto flex-1 p-4 space-y-5">
          {CONTINENT_ORDER.map((cont) => {
            const entries = byContinent[cont];
            if (!entries?.length) return null;
            return (
              <div key={cont}>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">{cont}</p>
                <div className="flex flex-wrap gap-1.5">
                  {entries.map(([code, { name }]) => {
                    const selected = existingCodes.has(code);
                    return (
                      <button
                        key={code}
                        onClick={() => onSelect(code)}
                        title={name}
                        className={`px-2.5 py-1 rounded text-xs font-mono border transition ${
                          selected
                            ? 'bg-teal-900/50 text-teal-300 border-teal-700 ring-1 ring-teal-600'
                            : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <span className="font-bold">{code}</span>
                        <span className="text-gray-500 ml-1 font-normal hidden sm:inline">
                          {name.length > 12 ? name.slice(0, 12) + '…' : name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">No codes match "{search}"</p>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-700 text-xs text-gray-500 text-center">
          Click a code to add/remove it. Currently selected codes are highlighted.
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step-by-step test resolution component
// ---------------------------------------------------------------------------

function TestStepRow({ step, index }: { step: TestStep; index: number }) {
  const icon =
    step.status === 'pending' ? (
      <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
    ) : step.status === 'hit' ? (
      <span className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center text-white text-[10px] font-bold">✓</span>
    ) : step.status === 'error' ? (
      <span className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-white text-[10px] font-bold">✕</span>
    ) : (
      <span className="w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-[10px]">–</span>
    );

  return (
    <div className={`flex items-start gap-3 py-2 ${index > 0 ? 'border-t border-gray-800' : ''}`}>
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-200 text-xs font-medium">{step.label}</p>
        <p className={`text-xs mt-0.5 ${step.status === 'hit' ? 'text-green-400' : step.status === 'error' ? 'text-red-400' : 'text-gray-500'}`}>
          {step.detail}
        </p>
      </div>
      {step.status !== 'pending' && step.ms > 0 && (
        <span className="text-gray-600 text-xs whitespace-nowrap">{step.ms}ms</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function RegionForm({ initialPeriod, initialData, onSave, onCancel }: Props) {
  const [period, setPeriod] = useState(initialPeriod ?? '');
  const [countriesRaw, setCountriesRaw] = useState(initialData?.countries.join(', ') ?? '');
  const [timeframe, setTimeframe] = useState(initialData?.timeframe ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [showPreview, setShowPreview] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // Suggestions & conflict
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [conflictSource, setConflictSource] = useState<null | 'static' | 'custom'>(null);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // AI test state (standard)
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [aiError, setAiError] = useState('');

  // Step-by-step test mode
  const [testMode, setTestMode] = useState(false);
  const [testSteps, setTestSteps] = useState<TestStep[]>([]);
  const [testRunning, setTestRunning] = useState(false);

  const codes = parseCodes(countriesRaw);
  const invalidTokens = getInvalidTokens(countriesRaw);
  const unrecognizedCodes = getUnrecognizedCodes(codes);
  const duplicateCodes = codes.filter((c, i) => codes.indexOf(c) !== i);
  const codeSet = new Set(codes);

  // Derived warnings (non-blocking)
  const warnings: string[] = [];
  if (codes.length > 15) warnings.push(`This mapping covers ${codes.length} countries — unusually broad. Verify this is intentional.`);
  if (duplicateCodes.length > 0) warnings.push(`Duplicate code${duplicateCodes.length > 1 ? 's' : ''} will be removed: ${[...new Set(duplicateCodes)].join(', ')}.`);
  if (unrecognizedCodes.length > 0) warnings.push(`Unrecognized code${unrecognizedCodes.length > 1 ? 's' : ''} (may still be valid): ${unrecognizedCodes.join(', ')}.`);

  // All candidate period names for suggestions / conflict check
  const allPeriodNames = [
    ...Object.keys(REGION_MAPPINGS),
    ...Object.keys(getCustomMappings()),
  ];

  // ── Period field change ────────────────────────────────────────────────────

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    setErrors((prev) => ({ ...prev, period: '' }));

    if (initialPeriod) return; // locked when editing

    // Conflict detection
    const trimmed = value.trim();
    const staticMatch = Object.keys(REGION_MAPPINGS).find(
      (k) => k.toLowerCase() === trimmed.toLowerCase()
    );
    const customMatch = Object.keys(getCustomMappings()).find(
      (k) => k.toLowerCase() === trimmed.toLowerCase()
    );
    setConflictSource(staticMatch ? 'static' : customMatch ? 'custom' : null);

    // Suggestions (show after 2 chars)
    if (trimmed.length >= 2) {
      const matches = fuzzyMatch(trimmed, allPeriodNames);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
      // "Did you mean?" when no direct match but close one exists
      const exact = allPeriodNames.find((p) => p.toLowerCase() === trimmed.toLowerCase());
      setDidYouMean(!exact && matches.length === 0 ? getDidYouMean(trimmed, allPeriodNames) : null);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setDidYouMean(null);
    }
  };

  const applySuggestion = (s: string) => {
    setPeriod(s);
    setShowSuggestions(false);
    setSuggestions([]);
    // Recheck conflict for the applied suggestion
    const staticMatch = Object.keys(REGION_MAPPINGS).find(
      (k) => k.toLowerCase() === s.toLowerCase()
    );
    const customMatch = Object.keys(getCustomMappings()).find(
      (k) => k.toLowerCase() === s.toLowerCase()
    );
    setConflictSource(staticMatch ? 'static' : customMatch ? 'custom' : null);
    setDidYouMean(null);
  };

  // ── Country code picker toggle ─────────────────────────────────────────────

  const handlePickerSelect = (code: string) => {
    const current = parseCodes(countriesRaw);
    if (current.includes(code)) {
      // Remove it
      const next = current.filter((c) => c !== code);
      setCountriesRaw(next.join(', '));
    } else {
      // Add it
      setCountriesRaw((prev) => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed}, ${code}` : code;
      });
    }
  };

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!period.trim()) newErrors.period = 'Period name is required';
    if (codes.length === 0 && invalidTokens.length === 0) {
      newErrors.countries = 'At least one valid ISO alpha-2 code is required';
    } else if (codes.length === 0 && invalidTokens.length > 0) {
      newErrors.countries = `None of the entered values are valid 2-letter ISO codes: ${invalidTokens.slice(0, 4).join(', ')}`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [period, codes, invalidTokens]);

  // ── Ctrl+S to save ─────────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (validate()) {
          onSave({
            period: period.trim(),
            countries: [...new Set(codes)],
            timeframe: timeframe.trim(),
            description: description.trim(),
          });
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [period, codes, timeframe, description, validate, onSave]);

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({
      period: period.trim(),
      countries: [...new Set(codes)], // deduplicate on save
      timeframe: timeframe.trim(),
      description: description.trim(),
    });
  };

  // ── Standard AI test ───────────────────────────────────────────────────────

  const testWithAI = async () => {
    const p = period.trim();
    if (!p) { setAiError('Enter a period name first.'); return; }
    setAiLoading(true);
    setAiResult(null);
    setAiError('');
    try {
      const res = await fetch(`/api/region-lookup?period=${encodeURIComponent(p)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as AIResult;
      setAiResult(data);
      if (data.countries?.length && !countriesRaw.trim()) setCountriesRaw(data.countries.join(', '));
      if (data.timeframe && !timeframe.trim()) setTimeframe(data.timeframe);
      if (data.description && !description.trim()) setDescription(data.description);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI lookup failed');
    } finally {
      setAiLoading(false);
    }
  };

  const applyAISuggestion = () => {
    if (!aiResult) return;
    if (aiResult.countries?.length) setCountriesRaw(aiResult.countries.join(', '));
    if (aiResult.timeframe) setTimeframe(aiResult.timeframe);
    if (aiResult.description) setDescription(aiResult.description);
    setAiResult(null);
  };

  // ── Step-by-step test ──────────────────────────────────────────────────────

  const runStepTest = async () => {
    const p = period.trim();
    if (!p) { setAiError('Enter a period name first.'); return; }
    setTestRunning(true);
    setTestSteps([]);

    const pushStep = (step: TestStep) =>
      setTestSteps((prev) => [...prev.filter((s) => s.label !== step.label), step]);

    // Step 1: Hardcoded REGION_MAPPINGS
    pushStep({ label: '1. Hardcoded REGION_MAPPINGS', status: 'pending', detail: 'Checking…', ms: 0 });
    await new Promise((r) => setTimeout(r, 80));
    const t1 = Date.now();
    const hardcoded = REGION_MAPPINGS[p] ??
      Object.entries(REGION_MAPPINGS).find(([k]) => k.toLowerCase() === p.toLowerCase())?.[1];
    const ms1 = Date.now() - t1;
    if (hardcoded) {
      pushStep({ label: '1. Hardcoded REGION_MAPPINGS', status: 'hit', detail: `Found: [${hardcoded.join(', ')}]`, ms: ms1 });
      setTestRunning(false);
      return;
    }
    pushStep({ label: '1. Hardcoded REGION_MAPPINGS', status: 'miss', detail: 'Not found', ms: ms1 });

    // Step 2: Custom mappings
    pushStep({ label: '2. Custom Mappings', status: 'pending', detail: 'Checking…', ms: 0 });
    await new Promise((r) => setTimeout(r, 60));
    const t2 = Date.now();
    const customMaps = getCustomMappings();
    const custom = customMaps[p] ??
      Object.entries(customMaps).find(([k]) => k.toLowerCase() === p.toLowerCase())?.[1];
    const ms2 = Date.now() - t2;
    if (custom) {
      pushStep({ label: '2. Custom Mappings', status: 'hit', detail: `Found: [${custom.countries.join(', ')}]`, ms: ms2 });
      setTestRunning(false);
      return;
    }
    pushStep({ label: '2. Custom Mappings', status: 'miss', detail: 'Not found', ms: ms2 });

    // Step 3: Per-entry localStorage cache (regionCache_*)
    pushStep({ label: '3. Per-entry Cache (regionCache_*)', status: 'pending', detail: 'Checking localStorage…', ms: 0 });
    await new Promise((r) => setTimeout(r, 60));
    const t3 = Date.now();
    let perEntry: string[] | null = null;
    try {
      const raw = localStorage.getItem(`regionCache_${p}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.countries)) perEntry = parsed.countries;
      }
    } catch { /* ignore */ }
    const ms3 = Date.now() - t3;
    if (perEntry) {
      pushStep({ label: '3. Per-entry Cache (regionCache_*)', status: 'hit', detail: `Found: [${perEntry.join(', ')}]`, ms: ms3 });
      setTestRunning(false);
      return;
    }
    pushStep({ label: '3. Per-entry Cache (regionCache_*)', status: 'miss', detail: 'Not found', ms: ms3 });

    // Step 4: Legacy regionCache object
    pushStep({ label: '4. Legacy Cache (regionCache)', status: 'pending', detail: 'Checking localStorage…', ms: 0 });
    await new Promise((r) => setTimeout(r, 60));
    const t4 = Date.now();
    let legacyHit: string[] | null = null;
    try {
      const raw = localStorage.getItem('regionCache');
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj[p]?.countries) legacyHit = obj[p].countries;
      }
    } catch { /* ignore */ }
    const ms4 = Date.now() - t4;
    if (legacyHit) {
      pushStep({ label: '4. Legacy Cache (regionCache)', status: 'hit', detail: `Found: [${legacyHit.join(', ')}]`, ms: ms4 });
      setTestRunning(false);
      return;
    }
    pushStep({ label: '4. Legacy Cache (regionCache)', status: 'miss', detail: 'Not found', ms: ms4 });

    // Step 5: AI API call
    pushStep({ label: '5. AI API (/api/region-lookup)', status: 'pending', detail: 'Calling Claude…', ms: 0 });
    const t5 = Date.now();
    try {
      const res = await fetch(`/api/region-lookup?period=${encodeURIComponent(p)}`);
      const ms5 = Date.now() - t5;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as AIResult;
      pushStep({
        label: '5. AI API (/api/region-lookup)',
        status: 'hit',
        detail: data.countries?.length
          ? `Returned: [${data.countries.join(', ')}] (${data.type ?? 'era'}) — result will be cached`
          : 'Returned empty countries list',
        ms: ms5,
      });
      // Auto-fill
      if (data.countries?.length && !countriesRaw.trim()) setCountriesRaw(data.countries.join(', '));
      if (data.timeframe && !timeframe.trim()) setTimeframe(data.timeframe);
      if (data.description && !description.trim()) setDescription(data.description);
    } catch (err) {
      const ms5 = Date.now() - t5;
      pushStep({
        label: '5. AI API (/api/region-lookup)',
        status: 'error',
        detail: err instanceof Error ? err.message : 'Failed',
        ms: ms5,
      });
    }
    setTestRunning(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Period name */}
      <div className="relative">
        <label className="block text-sm font-medium mb-1 text-gray-300">
          Period / Civilization <span className="text-red-400">*</span>
        </label>

        <div className="flex gap-2">
          <input
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value)}
            onFocus={() => period.length >= 2 && setShowSuggestions(suggestions.length > 0)}
            onBlur={() => {
              blurTimerRef.current = setTimeout(() => setShowSuggestions(false), 150);
            }}
            disabled={!!initialPeriod}
            placeholder="e.g. Ottoman Empire, Feudal Japan, Silk Road"
            className={`flex-1 px-3 py-2 bg-gray-800 border text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none disabled:opacity-50 ${
              errors.period ? 'border-red-500' : 'border-gray-700'
            }`}
          />
          {/* AI test button */}
          {!testMode ? (
            <button
              type="button"
              onClick={testWithAI}
              disabled={aiLoading || !period.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition whitespace-nowrap flex items-center gap-1.5"
            >
              {aiLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
              <span className="hidden sm:inline">{aiLoading ? 'Asking…' : 'Test AI'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={runStepTest}
              disabled={testRunning || !period.trim()}
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition whitespace-nowrap flex items-center gap-1.5"
            >
              {testRunning ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              )}
              <span className="hidden sm:inline">{testRunning ? 'Running…' : 'Run Steps'}</span>
            </button>
          )}
          {/* Toggle step mode */}
          <button
            type="button"
            onClick={() => { setTestMode((v) => !v); setTestSteps([]); setAiResult(null); setAiError(''); }}
            title={testMode ? 'Switch to quick AI test' : 'Switch to step-by-step test mode'}
            className={`px-2.5 py-2 rounded-lg text-xs border transition ${
              testMode
                ? 'bg-indigo-900/50 text-indigo-300 border-indigo-700'
                : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
            }`}
          >
            {testMode ? '→ Quick' : '↳ Steps'}
          </button>
        </div>

        {errors.period && <p className="text-red-400 text-xs mt-1">{errors.period}</p>}

        {/* Conflict warning */}
        {!initialPeriod && conflictSource && (
          <div className="mt-2 flex items-start gap-2 bg-amber-900/20 border border-amber-700/50 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-amber-300 text-xs">
              {conflictSource === 'static'
                ? 'A built-in static mapping already exists for this period. Saving will create a custom override that takes priority.'
                : 'A custom mapping for this period already exists — saving will replace it.'}
            </p>
          </div>
        )}

        {/* "Did you mean?" */}
        {didYouMean && (
          <p className="mt-1.5 text-xs text-gray-400">
            Did you mean{' '}
            <button
              type="button"
              onClick={() => applySuggestion(didYouMean)}
              className="text-purple-400 underline hover:text-purple-300"
            >
              {didYouMean}
            </button>
            ?
          </p>
        )}

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onMouseDown={() => {
                    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
                    applySuggestion(s);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 transition flex items-center justify-between"
                >
                  <span>{s}</span>
                  {REGION_MAPPINGS[s] ? (
                    <span className="text-xs text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded">static</span>
                  ) : (
                    <span className="text-xs text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded">custom</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Standard AI result panel */}
      {!testMode && aiError && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
          AI error: {aiError}
        </div>
      )}
      {!testMode && aiResult && (
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-blue-300 text-sm font-semibold">AI Suggestion</p>
            <span className="text-xs text-blue-400 bg-blue-900/40 px-2 py-0.5 rounded-full border border-blue-800/50">
              {aiResult.type ?? 'era'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {(aiResult.countries ?? []).map((c) => (
              <span key={c} className="px-2 py-0.5 bg-blue-900/40 text-teal-300 rounded text-xs font-mono border border-blue-800/50">{c}</span>
            ))}
            {!aiResult.countries?.length && <span className="text-gray-500 text-xs italic">no countries returned</span>}
          </div>
          {aiResult.timeframe && <p className="text-gray-400 text-xs">{aiResult.timeframe}</p>}
          {aiResult.description && <p className="text-gray-400 text-xs">{aiResult.description}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={applyAISuggestion} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition">Apply</button>
            <button type="button" onClick={() => setAiResult(null)} className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded text-xs hover:bg-gray-600 transition">Dismiss</button>
          </div>
        </div>
      )}

      {/* Step-by-step test panel */}
      {testMode && testSteps.length > 0 && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-300 text-xs font-semibold uppercase tracking-wider">Resolution Trace</p>
            <button type="button" onClick={() => setTestSteps([])} className="text-gray-600 hover:text-gray-400 text-xs">Clear</button>
          </div>
          {testSteps.map((step, i) => (
            <TestStepRow key={step.label} step={step} index={i} />
          ))}
        </div>
      )}

      {/* Country codes */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-300">
            Countries <span className="text-gray-500 font-normal">(ISO alpha-2, comma-separated)</span>{' '}
            <span className="text-red-400">*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="text-xs text-purple-400 hover:text-purple-300 transition flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Country picker
          </button>
        </div>

        <input
          value={countriesRaw}
          onChange={(e) => { setCountriesRaw(e.target.value); setErrors((prev) => ({ ...prev, countries: '' })); }}
          placeholder="TR, EG, GR, RS, BG, HU, RO"
          className={`w-full px-3 py-2 bg-gray-800 border text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none font-mono ${
            errors.countries ? 'border-red-500' : 'border-gray-700'
          }`}
        />

        {errors.countries && <p className="text-red-400 text-xs mt-1">{errors.countries}</p>}

        {/* Invalid (non-2-char) tokens */}
        {invalidTokens.length > 0 && (
          <p className="text-red-400 text-xs mt-1">
            Invalid token{invalidTokens.length > 1 ? 's' : ''} (not 2-letter codes): {invalidTokens.join(', ')}
          </p>
        )}

        {/* Code badges */}
        {codes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {codes.map((c, i) => {
              const isDupe = codes.indexOf(c) !== i;
              const isUnknown = !KNOWN_CODES.has(c);
              return (
                <span
                  key={`${c}-${i}`}
                  title={ISO_CODES[c]?.name ?? (isUnknown ? 'Unrecognized code' : c)}
                  className={`px-2 py-0.5 rounded text-xs font-mono border ${
                    isDupe
                      ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700/50'
                      : isUnknown
                      ? 'bg-orange-900/30 text-orange-400 border-orange-700/50'
                      : 'bg-teal-900/40 text-teal-300 border-teal-800/50'
                  }`}
                >
                  {c}
                  {ISO_CODES[c] && <span className="text-gray-500 ml-1 hidden sm:inline">{ISO_CODES[c].name.split(' ')[0]}</span>}
                </span>
              );
            })}
            <span className="text-gray-600 text-xs self-center ml-0.5">
              {[...new Set(codes)].length} unique
            </span>
          </div>
        )}

        {/* Warnings */}
        {warnings.map((w) => (
          <div key={w} className="mt-2 flex items-start gap-2 bg-amber-900/20 border border-amber-700/40 rounded px-3 py-2">
            <svg className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-amber-300 text-xs">{w}</p>
          </div>
        ))}
      </div>

      {/* Timeframe */}
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-300">
          Timeframe <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <input
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          placeholder="e.g. 1299–1922"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-300">
          Description <span className="text-gray-500 font-normal">(optional, max 120 chars)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 120))}
          rows={2}
          maxLength={120}
          placeholder="Brief description of this period or civilization"
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
        />
        <p className="text-gray-600 text-xs mt-0.5 text-right">{description.length}/120</p>
      </div>

      {/* Map preview toggle */}
      {codes.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="text-sm text-purple-400 hover:text-purple-300 transition flex items-center gap-1"
          >
            <svg className={`w-4 h-4 transition-transform ${showPreview ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {showPreview ? 'Hide' : 'Show'} map preview
          </button>
          {showPreview && <div className="mt-2"><RegionMapPreview countries={codes} height={160} /></div>}
        </div>
      )}

      {/* Save / Cancel */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={handleSubmit} className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-bold hover:bg-purple-700 transition">
          Save Mapping
        </button>
        <button type="button" onClick={onCancel} className="flex-1 bg-gray-700 text-gray-200 py-2 rounded-lg font-bold hover:bg-gray-600 transition">
          Cancel
        </button>
      </div>

      <p className="text-gray-600 text-xs text-center">Ctrl+S / ⌘+S to save</p>

      {/* Country Code Picker modal */}
      {showPicker && (
        <CountryCodePicker
          onSelect={handlePickerSelect}
          onClose={() => setShowPicker(false)}
          existingCodes={codeSet}
        />
      )}
    </div>
  );
}
