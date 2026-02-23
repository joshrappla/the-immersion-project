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
function sanitizePeriod(raw: string): string {
  return raw
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // control chars
    .replace(/[<>]/g, '')                   // HTML angle brackets
    .trim()
    .slice(0, 100);                          // hard max length
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

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
"description": "Brief context (max 20 words)"
}
Examples:
	∙	"France" → {"type":"country","countries":["FR"],"timeframe":"","description":"Modern European nation"}
	∙	"Aztec Empire" → {"type":"empire","countries":["MX"],"timeframe":"1345-1521","description":"Pre-Columbian Mesoamerican civilization in central Mexico"}
	∙	"Silk Road" → {"type":"era","countries":["CN","KZ","UZ","IR","TR","IT"],"timeframe":"130 BC-1453 AD","description":"Ancient trade routes connecting East and West"}`;
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
  const period = sanitizePeriod(rawPeriod);

  if (!period) {
    return NextResponse.json({ error: 'Missing or empty period parameter' }, { status: 400 });
  }

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
        max_tokens: 300,
        messages: [{ role: 'user', content: buildPrompt(period) }],
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

    return NextResponse.json({ type, countries, timeframe, description });
  } catch (parseErr) {
    console.error('[region-lookup] Failed to parse AI response', {
      period,
      raw: raw.slice(0, 300),
      error: parseErr instanceof Error ? parseErr.message : String(parseErr),
    });
    return NextResponse.json({ type: 'era', countries: [], timeframe: '', description: '' });
  }
}
