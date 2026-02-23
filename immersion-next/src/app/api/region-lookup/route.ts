import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// In-memory rate limiter
// Resets on server restart; acceptable for a low-traffic admin tool.
// For multi-instance deployments, replace with Redis or Upstash.
// ---------------------------------------------------------------------------

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_MAX = 10;        // max requests
const RATE_LIMIT_WINDOW_MS = 60_000; // per 60 seconds

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const window = (rateLimitMap.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (window.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(ip, window);
    return false; // rate limited
  }
  window.push(now);
  rateLimitMap.set(ip, window);
  return true; // allowed
}

// ---------------------------------------------------------------------------
// Input sanitization
// ---------------------------------------------------------------------------

/** Strip control characters and limit length to prevent prompt injection. */
function sanitizeString(raw: string, maxLen = 100): string {
  return raw
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // control chars
    .replace(/[<>]/g, '')                   // HTML angle brackets
    .trim()
    .slice(0, maxLen);
}

/** Parse an optional integer query param; returns null if missing or invalid. */
function parseIntParam(raw: string | null): number | null {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return isFinite(n) ? n : null;
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

/** Basic prompt — used when no year range is provided (legacy path). */
function buildPrompt(timePeriod: string): string {
  return `You are a historical geography expert. Given: "${timePeriod}"
Determine:
	1.	Is this a specific COUNTRY, an EMPIRE/KINGDOM, or a historical ERA/PERIOD?
	2.	What modern-day country codes (ISO 3166-1 alpha-2) should be highlighted on a map?
	3.	What timeframe does this represent?
Respond ONLY with valid JSON, no markdown:
{
"type": "country" | "empire" | "era",
"countries": ["US", "FR", "GB"],
"timeframe": "793-1066 AD",
"description": "Brief context (max 20 words)",
"confidence": "high" | "medium" | "low",
"reasoning": "One sentence explaining country selection",
"suggestions": ["Alternative interpretation if ambiguous"]
}
Examples:
	∙	"France" → {"type":"country","countries":["FR"],"timeframe":"","description":"Modern European nation","confidence":"high","reasoning":"Direct country name match","suggestions":[]}
	∙	"Aztec Empire" → {"type":"empire","countries":["MX"],"timeframe":"1345-1521","description":"Pre-Columbian Mesoamerican civilization in central Mexico","confidence":"high","reasoning":"Aztec civilization was based in central Mexico","suggestions":[]}
	∙	"Silk Road" → {"type":"era","countries":["CN","KZ","UZ","IR","TR","IT"],"timeframe":"130 BC-1453 AD","description":"Ancient trade routes connecting East and West","confidence":"medium","reasoning":"Trade routes crossed multiple modern countries","suggestions":[]}`;
}

/** Year-aware prompt — used when startYear / endYear are provided. */
function buildYearAwarePrompt(
  era: string,
  startYear: number,
  endYear: number,
  title?: string,
): string {
  const yearLabel = (y: number) =>
    y < 0 ? `${Math.abs(y)} BC` : `${y} AD`;

  const titleLine = title ? `\n* Media Title: "${title}"` : '';

  return `You are a historical geography expert. Given:
* Era/Period: "${era}"
* Time Range: ${yearLabel(startYear)} to ${yearLabel(endYear)}${titleLine}

Determine which modern-day countries/regions were part of or affected by this historical context DURING THE SPECIFIC TIME RANGE given.

Consider:
* Empires expanded and contracted over time — use the SPECIFIC years, not the empire's full lifespan
* Wars and conflicts involved multiple nations simultaneously
* Trade routes and cultural movements spread across many regions
* Media titles may contain location clues (e.g. "Battle of Stalingrad" → Russia)

Respond ONLY with valid JSON, no markdown:
{
  "type": "country" | "empire" | "era",
  "countries": ["XX", "YY", "ZZ"],
  "timeframe": "startYear–endYear (human readable)",
  "description": "Brief context, max 20 words",
  "confidence": "high" | "medium" | "low",
  "reasoning": "One or two sentences explaining why these specific countries for this specific time range",
  "primaryRegion": "XX",
  "suggestions": ["Alternative if ambiguous"]
}

Confidence guide:
* "high" — era name and year range uniquely identify a well-documented territory
* "medium" — reasonable inference but some ambiguity
* "low" — very broad range (>500 years), unknown era, or conflicting signals`;
}

// ---------------------------------------------------------------------------
// Valid ISO 3166-1 alpha-2 codes (server-side allowlist)
// ---------------------------------------------------------------------------

const VALID_ISO_CODES = new Set([
  'AD','AE','AF','AG','AL','AM','AO','AR','AT','AU','AZ',
  'BA','BB','BD','BE','BF','BG','BH','BI','BJ','BN','BO','BR','BS','BT','BW','BY','BZ',
  'CA','CD','CF','CG','CH','CI','CL','CM','CN','CO','CR','CU','CV','CY','CZ',
  'DE','DJ','DK','DM','DO','DZ',
  'EC','EE','EG','ER','ES','ET',
  'FI','FJ','FM','FR','GA','GB','GD','GE','GH','GM','GN','GQ','GR','GT','GW','GY',
  'HN','HR','HT','HU',
  'ID','IE','IL','IN','IQ','IR','IS','IT',
  'JM','JO','JP',
  'KE','KG','KH','KI','KM','KN','KP','KR','KW','KZ',
  'LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY',
  'MA','MC','MD','ME','MG','MH','MK','ML','MM','MN','MR','MT','MU','MV','MW','MX','MY','MZ',
  'NA','NE','NG','NI','NL','NO','NP','NR','NZ',
  'OM','PA','PE','PG','PH','PK','PL','PS','PT','PW','PY',
  'QA','RO','RS','RU','RW',
  'SA','SB','SC','SD','SE','SG','SI','SK','SL','SM','SN','SO','SR','SS','ST','SV','SY','SZ',
  'TD','TG','TH','TJ','TL','TM','TN','TO','TR','TT','TV','TZ',
  'UA','UG','US','UY','UZ',
  'VA','VC','VE','VN','VU',
  'WS','XK','YE','ZA','ZM','ZW',
]);

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────────────────────────
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  if (!checkRateLimit(ip)) {
    console.warn('[region-lookup] rate limited', { ip });
    return NextResponse.json(
      { error: 'Too many requests — max 10 per minute' },
      {
        status: 429,
        headers: { 'Retry-After': '60' },
      }
    );
  }

  // ── Input validation & sanitization ───────────────────────────────────────
  const rawPeriod = req.nextUrl.searchParams.get('period') ?? '';
  const period = sanitizeString(rawPeriod, 100);

  if (!period) {
    return NextResponse.json({ error: 'Missing or empty period parameter' }, { status: 400 });
  }

  // Optional year-range params for year-aware inference
  const startYear = parseIntParam(req.nextUrl.searchParams.get('startYear'));
  const endYear   = parseIntParam(req.nextUrl.searchParams.get('endYear'));
  const rawTitle  = req.nextUrl.searchParams.get('title') ?? '';
  const title     = rawTitle ? sanitizeString(rawTitle, 120) : undefined;

  // ── API key ────────────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[region-lookup] ANTHROPIC_API_KEY not configured');
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }

  // ── Anthropic API call ────────────────────────────────────────────────────
  let raw: string;
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content:
              startYear !== null && endYear !== null
                ? buildYearAwarePrompt(period, startYear, endYear, title)
                : buildPrompt(period),
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error('[region-lookup] Anthropic API error', {
        status: response.status,
        period,
        body: body.slice(0, 200),
      });
      return NextResponse.json({ error: 'Upstream API error' }, { status: 502 });
    }

    const data = await response.json();
    raw = (data.content?.[0]?.text ?? '') as string;
  } catch (err) {
    console.error('[region-lookup] Network error', {
      period,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Network error contacting AI' }, { status: 502 });
  }

  // ── Parse & validate response ──────────────────────────────────────────────
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    const type =
      parsed.type === 'country' || parsed.type === 'empire' || parsed.type === 'era'
        ? parsed.type
        : 'era';

    // Server-side validation: only pass through known ISO codes
    const countries = Array.isArray(parsed.countries)
      ? (parsed.countries as unknown[])
          .filter((c): c is string => typeof c === 'string' && /^[A-Z]{2}$/.test(c))
          .filter((c) => VALID_ISO_CODES.has(c)) // allowlist validation
          .slice(0, 50)                            // hard cap at 50 countries
      : [];

    const timeframe =
      typeof parsed.timeframe === 'string' ? parsed.timeframe.slice(0, 100) : '';
    const description =
      typeof parsed.description === 'string' ? parsed.description.slice(0, 200) : '';

    // New year-aware fields (may be absent in legacy responses)
    const confidence =
      parsed.confidence === 'high' || parsed.confidence === 'medium'
        ? parsed.confidence
        : 'low';
    const reasoning =
      typeof parsed.reasoning === 'string' ? parsed.reasoning.slice(0, 400) : '';
    const suggestions = Array.isArray(parsed.suggestions)
      ? (parsed.suggestions as unknown[])
          .filter((s): s is string => typeof s === 'string')
          .slice(0, 3)
          .map((s) => s.slice(0, 200))
      : [];

    return NextResponse.json({
      type, countries, timeframe, description,
      confidence, reasoning, suggestions,
    });
  } catch (parseErr) {
    console.error('[region-lookup] Failed to parse AI response', {
      period,
      raw: raw.slice(0, 300),
      error: parseErr instanceof Error ? parseErr.message : String(parseErr),
    });
    return NextResponse.json({ type: 'era', countries: [], timeframe: '', description: '' });
  }
}
