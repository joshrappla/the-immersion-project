/**
 * /api/media — Proxy for GET (list) and POST (create) media items.
 *
 * Forwards requests to the AWS Lambda backend at LAMBDA_API_URL.
 * Passes through the full request body including new region fields:
 *   countryCodes, regionType, inferenceSource, inferenceConfidence,
 *   inferredAt, overriddenAt
 *
 * Required env var (server-side):
 *   LAMBDA_API_URL — full base URL of the API Gateway, e.g.
 *                    https://p3cf32ynjf.execute-api.us-east-2.amazonaws.com/prod
 */

import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLambdaUrl(): string {
  const url = process.env.LAMBDA_API_URL;
  if (!url) {
    throw new Error('LAMBDA_API_URL environment variable is not set');
  }
  return url.replace(/\/$/, ''); // strip trailing slash
}

function proxyError(message: string, status = 500) {
  console.error('[api/media]', message);
  return NextResponse.json({ error: message }, { status });
}

// ---------------------------------------------------------------------------
// GET /api/media — list all media items
// ---------------------------------------------------------------------------

export async function GET() {
  let lambdaBase: string;
  try {
    lambdaBase = getLambdaUrl();
  } catch (e) {
    return proxyError((e as Error).message, 503);
  }

  try {
    const res = await fetch(`${lambdaBase}/media`, {
      headers: { 'Content-Type': 'application/json' },
      // 10-second timeout via AbortController
      signal: AbortSignal.timeout(10_000),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[api/media] Lambda GET error', { status: res.status, data });
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (e) {
    return proxyError(`Failed to fetch media: ${(e as Error).message}`);
  }
}

// ---------------------------------------------------------------------------
// POST /api/media — create a new media item
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  let lambdaBase: string;
  try {
    lambdaBase = getLambdaUrl();
  } catch (e) {
    return proxyError((e as Error).message, 503);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return proxyError('Invalid JSON body', 400);
  }

  try {
    const res = await fetch(`${lambdaBase}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[api/media] Lambda POST error', { status: res.status, data });
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (e) {
    return proxyError(`Failed to create media: ${(e as Error).message}`);
  }
}
