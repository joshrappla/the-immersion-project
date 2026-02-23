/**
 * mediaHandler.js — AWS Lambda handler for /media CRUD operations
 *
 * Supported fields (stored in DynamoDB):
 *   Core: mediaId, title, mediaType, timePeriod, startYear, endYear,
 *         description, imageUrl, streamingUrl
 *   Location: country, latitude, longitude
 *   Region inference (NEW): countryCodes, regionType, inferenceSource,
 *                           inferenceConfidence, inferredAt, overriddenAt
 *
 * Deploy: zip -r lambda.zip mediaHandler.js node_modules && upload to AWS Lambda
 * Runtime: Node.js 18.x or 20.x
 * Handler: mediaHandler.handler
 *
 * Required env vars:
 *   TABLE_NAME  — DynamoDB table name (default: "immersion-media")
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  GetCommand,
} = require('@aws-sdk/lib-dynamodb');

// ---------------------------------------------------------------------------
// DynamoDB client
// ---------------------------------------------------------------------------

const raw = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(raw, {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLE_NAME = process.env.TABLE_NAME || 'immersion-media';

// ---------------------------------------------------------------------------
// CORS headers — returned on every response
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Content-Type': 'application/json',
};

// ---------------------------------------------------------------------------
// Field allowlist — the complete set of fields accepted for write operations.
// Any field NOT in this set is silently stripped before writing to DynamoDB.
// ---------------------------------------------------------------------------

const WRITABLE_FIELDS = new Set([
  // Core
  'mediaId',
  'title',
  'mediaType',
  'timePeriod',
  'startYear',
  'endYear',
  'description',
  'imageUrl',
  'streamingUrl',
  // Location
  'country',
  'latitude',
  'longitude',
  // Region inference
  'countryCodes',       // string[]  — ISO 3166-1 alpha-2 codes, e.g. ["IT","FR"]
  'regionType',         // string    — "country" | "empire" | "era"
  'inferenceSource',    // string    — "temporal" | "ai" | "manual" | "hardcoded" | …
  'inferenceConfidence',// string    — "high" | "medium" | "low"
  'inferredAt',         // number    — Unix ms timestamp of last AI inference
  'overriddenAt',       // number    — Unix ms timestamp of last manual override
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ok(body) {
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

function err(statusCode, message) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: message }),
  };
}

/** Strip any fields not in WRITABLE_FIELDS. */
function sanitize(item) {
  const clean = {};
  for (const [k, v] of Object.entries(item)) {
    if (WRITABLE_FIELDS.has(k) && v !== undefined && v !== null) {
      // Validate countryCodes: must be an array of 2-letter uppercase strings
      if (k === 'countryCodes') {
        if (!Array.isArray(v)) continue;
        const codes = v.filter(
          (c) => typeof c === 'string' && /^[A-Z]{2}$/.test(c)
        );
        if (codes.length > 0) clean[k] = codes;
        continue;
      }
      // Validate regionType
      if (k === 'regionType') {
        if (!['country', 'empire', 'era'].includes(v)) continue;
      }
      // Validate inferenceSource
      if (k === 'inferenceSource') {
        const valid = ['temporal','ai','manual','hardcoded','custom','title-analysis','fallback'];
        if (!valid.includes(v)) continue;
      }
      // Validate inferenceConfidence
      if (k === 'inferenceConfidence') {
        if (!['high','medium','low'].includes(v)) continue;
      }
      // Validate numeric timestamps
      if (k === 'inferredAt' || k === 'overriddenAt') {
        if (typeof v !== 'number' || !isFinite(v)) continue;
      }
      clean[k] = v;
    }
  }
  return clean;
}

/** Build a DynamoDB UpdateExpression from a plain object (excluding the key). */
function buildUpdateExpression(item, keyField = 'mediaId') {
  const names = {};
  const values = {};
  const parts = [];

  for (const [k, v] of Object.entries(item)) {
    if (k === keyField) continue;
    const nameKey = `#f_${k}`;
    const valueKey = `:v_${k}`;
    names[nameKey] = k;
    values[valueKey] = v;
    parts.push(`${nameKey} = ${valueKey}`);
  }

  return {
    UpdateExpression: `SET ${parts.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  };
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

async function handleGet(event) {
  const mediaId = event.pathParameters?.id;

  if (mediaId) {
    // GET /media/{id}
    const result = await docClient.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { mediaId } })
    );
    if (!result.Item) return err(404, 'Item not found');
    return ok(result.Item);
  }

  // GET /media — list all
  const result = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
  return ok({ items: result.Items ?? [] });
}

async function handlePost(event) {
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return err(400, 'Invalid JSON body');
  }

  if (!body.title || !body.mediaType || !body.timePeriod) {
    return err(400, 'Missing required fields: title, mediaType, timePeriod');
  }

  const item = sanitize({
    mediaId: body.mediaId || `media_${Date.now()}`,
    ...body,
  });

  await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return ok({ message: 'Created', item });
}

async function handlePut(event) {
  const mediaId = event.pathParameters?.id;
  if (!mediaId) return err(400, 'Missing mediaId in path');

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return err(400, 'Invalid JSON body');
  }

  const clean = sanitize(body);
  // Ensure mediaId matches path
  clean.mediaId = mediaId;

  const { UpdateExpression, ExpressionAttributeNames, ExpressionAttributeValues } =
    buildUpdateExpression(clean);

  if (!UpdateExpression.includes('=')) {
    return err(400, 'No updatable fields provided');
  }

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { mediaId },
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    })
  );

  return ok({ message: 'Updated', mediaId });
}

async function handleDelete(event) {
  const mediaId = event.pathParameters?.id;
  if (!mediaId) return err(400, 'Missing mediaId in path');

  await docClient.send(
    new DeleteCommand({ TableName: TABLE_NAME, Key: { mediaId } })
  );
  return ok({ message: 'Deleted', mediaId });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  try {
    switch (event.httpMethod) {
      case 'GET':    return await handleGet(event);
      case 'POST':   return await handlePost(event);
      case 'PUT':    return await handlePut(event);
      case 'DELETE': return await handleDelete(event);
      default:
        return err(405, `Method ${event.httpMethod} not allowed`);
    }
  } catch (e) {
    console.error('[mediaHandler] Unhandled error', e);
    return err(500, 'Internal server error');
  }
};
