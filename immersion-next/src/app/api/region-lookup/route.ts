import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are a geographic historian. Given a historical time period, empire, or civilization name, identify which modern countries correspond to that region. Always respond with a valid JSON object only — no markdown fences, no explanation.

JSON shape:
{
  "countries": ["XX", "YY"],
  "timeframe": "approximate dates (e.g. 27 BC – 476 AD)",
  "description": "brief one-line description"
}

Rules:
- Use ISO 3166-1 alpha-2 codes only (2-letter uppercase codes).
- Include only countries that were significantly part of this civilization or period.
- If the input is unrecognizable as a historical period or place, return {"countries":[],"timeframe":"unknown","description":"unknown"}.`;

export async function GET(req: NextRequest) {
  const period = req.nextUrl.searchParams.get('period')?.trim();

  if (!period) {
    return NextResponse.json({ error: 'Missing period parameter' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 });
  }

  const userMessage = `Time period / civilization: "${period}"`;

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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error('Anthropic API error', response.status, body);
      return NextResponse.json({ error: 'Upstream API error' }, { status: 502 });
    }

    const data = await response.json();
    raw = data.content?.[0]?.text ?? '';
  } catch (err) {
    console.error('region-lookup fetch failed', err);
    return NextResponse.json({ error: 'Network error contacting AI' }, { status: 502 });
  }

  // Parse JSON from the model's response
  try {
    // Strip any accidental markdown code fences the model may produce
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned) as {
      countries?: unknown;
      timeframe?: unknown;
      description?: unknown;
    };

    const countries = Array.isArray(parsed.countries)
      ? (parsed.countries as unknown[])
          .filter((c): c is string => typeof c === 'string' && c.length === 2)
          .map((c) => c.toUpperCase())
      : [];

    return NextResponse.json({
      countries,
      timeframe: typeof parsed.timeframe === 'string' ? parsed.timeframe : '',
      description: typeof parsed.description === 'string' ? parsed.description : '',
    });
  } catch {
    // Model returned non-JSON — treat as unknown region
    return NextResponse.json({ countries: [], timeframe: '', description: '' });
  }
}
