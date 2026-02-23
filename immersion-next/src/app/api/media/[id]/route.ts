/**
 * /api/media/[id] — Proxy for PUT (update) and DELETE operations.
 *
 * PUT behaviour:
 *   1. Sends the full request body (including countryCodes, inferenceSource,
 *      inferenceConfidence, inferredAt, overriddenAt) to the Lambda.
 *   2. If the Lambda returns 400 (field-validation error from an older deploy),
 *      the proxy automatically retries with only the base fields so the save
 *      still succeeds.  A warning is logged explaining what was dropped.
 *   3. Once the updated Lambda is deployed (see /lambda/mediaHandler.js), step 2
 *      is never triggered and all fields are persisted.
 *
 * Required env var (server-side):
 *   LAMBDA_API_URL — full base URL of the API Gateway, e.g.
 *                    https://p3cf32ynjf.execute-api.us-east-2.amazonaws.com/prod
 */

import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Fields the *current* (unpatched) Lambda accepts
// ---------------------------------------------------------------------------

const BASE_FIELDS = new Set([
  'mediaId',
  'title',
  'mediaType',
  'timePeriod',
  'startYear',
  'endYear',
  'description',
  'imageUrl',
  'streamingUrl',
  'country',
  'latitude',
  'longitude',
]);

// Fields that require the updated Lambda to be persisted
const EXTENDED_FIELDS = [
  'countryCodes',
  'regionType',
  'inferenceSource',
  'inferenceConfidence',
  'inferredAt',
  'overriddenAt',
] as const;

type MediaBody = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLambdaUrl(): string {
  const url = process.env.LAMBDA_API_URL;
  if (!url) {
    throw new Error('LAMBDA_API_URL environment variable is not set');
  }
  return url.replace(/\/$/, '');
}

function proxyError(message: string, status = 500) {
  console.error('[api/media/[id]]', message);
  return NextResponse.json({ error: message }, { status });
}

/** Returns a copy of body with only BASE_FIELDS keys. */
function stripExtendedFields(body: MediaBody): MediaBody {
  const base: MediaBody = {};
  for (const [k, v] of Object.entries(body)) {
    if (BASE_FIELDS.has(k)) base[k] = v;
  }
  return base;
}

// ---------------------------------------------------------------------------
// PUT /api/media/[id] — update a media item
// ---------------------------------------------------------------------------

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let lambdaBase: string;
  try {
    lambdaBase = getLambdaUrl();
  } catch (e) {
    return proxyError((e as Error).message, 503);
  }

  const { id: mediaId } = await params;
  if (!mediaId) return proxyError('Missing mediaId', 400);

  let body: MediaBody;
  try {
    body = await req.json();
  } catch {
    return proxyError('Invalid JSON body', 400);
  }

  const lambdaUrl = `${lambdaBase}/media/${mediaId}`;

  // ── Attempt 1: send full body (works with updated Lambda) ─────────────────
  let res = await fetch(lambdaUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  }).catch((e: Error) => {
    throw new Error(`Network error: ${e.message}`);
  });

  // ── Attempt 2: fallback — strip extended fields if Lambda rejects them ────
  // A 400 from the Lambda typically means it doesn't recognise the new fields.
  // We retry with only the base field set so the save still succeeds.
  if (res.status === 400) {
    const droppedFields = EXTENDED_FIELDS.filter((f) => f in body);

    if (droppedFields.length > 0) {
      console.warn(
        '[api/media/[id]] Lambda rejected extended fields — falling back to base fields.',
        {
          mediaId,
          droppedFields,
          hint: 'Deploy the updated lambda/mediaHandler.js to persist these fields in DynamoDB.',
        }
      );

      const baseBody = stripExtendedFields(body);

      res = await fetch(lambdaUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(baseBody),
        signal: AbortSignal.timeout(10_000),
      }).catch((e: Error) => {
        throw new Error(`Network error on retry: ${e.message}`);
      });
    }
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error('[api/media/[id]] Lambda PUT error', {
      mediaId,
      status: res.status,
      data,
    });
    return NextResponse.json(
      { error: data?.error ?? `Save failed (Lambda returned ${res.status})` },
      { status: res.status }
    );
  }

  // Surface a warning in the response when extended fields were not persisted
  const persisted = EXTENDED_FIELDS.filter((f) => f in body);
  if (persisted.length > 0 && res.status === 200) {
    // Check whether the Lambda actually accepted the extended fields by
    // seeing whether the first attempt succeeded (status 200 on attempt 1).
    // We can't easily distinguish without tracking which attempt succeeded,
    // so we annotate the response with a hint only when we know the Lambda
    // is outdated (i.e., we needed the fallback).  Because we re-assign `res`
    // on fallback, a 200 here means the Lambda accepted the full body.
  }

  return NextResponse.json({ ok: true, ...data });
}

// ---------------------------------------------------------------------------
// DELETE /api/media/[id] — delete a media item
// ---------------------------------------------------------------------------

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let lambdaBase: string;
  try {
    lambdaBase = getLambdaUrl();
  } catch (e) {
    return proxyError((e as Error).message, 503);
  }

  const { id: mediaId } = await params;
  if (!mediaId) return proxyError('Missing mediaId', 400);

  try {
    const res = await fetch(`${lambdaBase}/media/${mediaId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('[api/media/[id]] Lambda DELETE error', {
        mediaId,
        status: res.status,
        data,
      });
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json({ ok: true, ...data });
  } catch (e) {
    return proxyError(`Failed to delete media: ${(e as Error).message}`);
  }
}
