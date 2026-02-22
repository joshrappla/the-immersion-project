import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

/** Build the exact prompt template requested, with the period interpolated. */
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

export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get('period')?.trim();

  if (!period) {
    return NextResponse.json({ error: 'Missing period parameter' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }

  let raw: string;
  try {
    const response = await fetch(ANTHROPIC_API_URL, {
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
      console.error('Anthropic API error', response.status, body);
      return NextResponse.json({ error: 'Upstream API error' }, { status: 502 });
    }

    const data = await response.json();
    raw = (data.content?.[0]?.text ?? '') as string;
  } catch (err) {
    console.error('region-lookup fetch failed', err);
    return NextResponse.json({ error: 'Network error contacting AI' }, { status: 502 });
  }

  // Parse JSON — strip markdown code fences if the model adds them
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

    const countries = Array.isArray(parsed.countries)
      ? (parsed.countries as unknown[])
          .filter((c): c is string => typeof c === 'string' && c.length === 2)
          .map((c) => c.toUpperCase())
      : [];

    return NextResponse.json({
      type,
      countries,
      timeframe: typeof parsed.timeframe === 'string' ? parsed.timeframe : '',
      description: typeof parsed.description === 'string' ? parsed.description : '',
    });
  } catch {
    return NextResponse.json({ type: 'era', countries: [], timeframe: '', description: '' });
  }
}
