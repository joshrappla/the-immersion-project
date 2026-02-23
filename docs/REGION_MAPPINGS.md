# Region Mappings System

This document explains how The Immersion Project resolves historical time periods to sets of
country codes for map highlighting.

---

## Table of Contents

1. [Overview](#overview)
2. [Resolution Pipeline](#resolution-pipeline)
3. [Hardcoded Mappings](#hardcoded-mappings)
4. [Custom Mappings](#custom-mappings)
5. [AI Fallback](#ai-fallback)
6. [Cache Management](#cache-management)
7. [Adding New Mappings](#adding-new-mappings)
8. [Admin Interface](#admin-interface)
9. [API Reference](#api-reference)
10. [Troubleshooting](#troubleshooting)

---

## Overview

When a media item is tagged with a historical period (e.g. "Viking Age", "Ottoman Empire"),
the app needs to know which countries to highlight on the interactive world map.

The system resolves a period string → `string[]` of ISO 3166-1 alpha-2 country codes through
a four-step fallback chain, from fastest to slowest:

```
Hardcoded → Custom (localStorage) → Cache (localStorage) → AI API
```

---

## Resolution Pipeline

Implemented in `immersion-next/src/lib/regionAI.ts`.

### Step 1 — Hardcoded (`REGION_MAPPINGS`)

A compile-time constant mapping defined directly in `regionAI.ts`.

- Zero latency, no network required.
- Highest priority; always consulted first.
- Covers well-known, stable periods.
- Must be edited in source code and redeployed to change.

### Step 2 — Custom Mappings (`localStorage`)

User-defined overrides stored under the key `regionCustomMappings` in the browser's
`localStorage`.

- Survives page reloads; lost on clearing browser storage.
- Takes precedence over the AI cache but not over hardcoded mappings.
- Managed via the Admin → Regions → Add/Edit form.

### Step 3 — AI Response Cache (`localStorage`)

Previous AI lookups stored as individual per-entry keys `regionCache_<normalized-period>`.

- Avoids repeat API calls for the same period.
- A legacy `regionCache` object key may also exist from older app versions.
- Entries can be promoted to custom mappings or deleted via the admin interface.

### Step 4 — AI API (`/api/region-lookup`)

Falls back to the Anthropic `claude-sonnet-4-5-20250929` model when no local data exists.

- Requires `ANTHROPIC_API_KEY` environment variable on the server.
- Subject to rate limiting (10 requests / 60 seconds per IP).
- Results are automatically stored in the AI cache for future requests.

---

## Hardcoded Mappings

Location: `immersion-next/src/lib/regionAI.ts` — `REGION_MAPPINGS` constant.

Current entries (as of last update):

| Period              | Countries                                               |
|---------------------|---------------------------------------------------------|
| Viking Age          | NO, SE, DK, IS, GB, IE, FR, RU                         |
| Roman Empire        | IT, FR, ES, GB, DE, GR, TR, EG, MA, RO, BG, RS, HU    |
| Ancient Egypt       | EG                                                      |
| Medieval Europe     | FR, DE, GB, IT, ES, PT, PL, CZ, AT, CH, BE, NL        |
| Byzantine Empire    | TR, GR, BG, RS, RO, EG, IL, LB, SY                    |
| Ottoman Empire      | TR, GR, BG, RS, RO, HU, EG, IL, LB, SY, IQ, SA, JO   |
| Silk Road           | CN, KZ, UZ, TM, IR, TR, IQ, SY, IL, IT                |

### Matching Logic

Period lookup is **case-insensitive** and normalizes whitespace. Example:
`"  Viking age  "` → matches `"Viking Age"`.

---

## Custom Mappings

Stored in `localStorage` as JSON under the key `regionCustomMappings`:

```json
{
  "Mongol Empire": ["CN", "MN", "KZ", "KG", "UZ", "TM", "IR", "RU"],
  "Hanseatic League": ["DE", "PL", "SE", "NO", "DK", "FI", "EE", "LV", "LT"]
}
```

### Helper Functions

```typescript
import { getCustomMappings, saveCustomMappings } from '@/lib/regionAI';

const custom = getCustomMappings();               // Returns Record<string,string[]>
custom['My Period'] = ['US', 'CA'];
saveCustomMappings(custom);                        // Persists to localStorage
```

---

## AI Fallback

The `/api/region-lookup` endpoint calls the Anthropic API with a structured prompt asking
the model to classify the period and return matching ISO country codes.

### Request

```
GET /api/region-lookup?period=<time+period+name>
```

### Response

```json
{
  "type": "country" | "empire" | "era",
  "countries": ["US", "FR"],
  "timeframe": "1776-1865",
  "description": "Brief context, max 20 words"
}
```

### Server-Side Validation

The API applies multiple layers of validation before returning:

1. **Rate limiting** — max 10 requests per IP per 60-second window.
2. **Input sanitization** — strips control characters and HTML angle brackets; max 100 chars.
3. **ISO code allowlist** — only recognized ISO 3166-1 alpha-2 codes pass through.
4. **Count cap** — maximum 50 countries per response.
5. **Field length caps** — `timeframe` ≤ 100 chars, `description` ≤ 200 chars.

### Error Responses

| Status | Meaning                                              |
|--------|------------------------------------------------------|
| 400    | Missing or empty `period` parameter                  |
| 429    | Rate limited — includes `Retry-After: 60` header     |
| 502    | Anthropic API error or network error                 |
| 503    | `ANTHROPIC_API_KEY` not configured on the server     |

---

## Cache Management

Cache entries live in `localStorage` under keys matching the pattern `regionCache_*`.

### View Cache Stats

Admin → Regions → AI Cache tab shows:
- Number of cached entries
- Most recently added periods
- Each entry with its country list and map preview

### Promote to Custom

"Promote" an AI cache entry to a custom mapping when you want it to persist as a
first-class mapping rather than a cached lookup. Promoted entries:
- Appear under Custom Mappings in the admin panel.
- Are included in exports.
- Can be edited via the Add/Edit form.

### Clear Cache

- **Clear single entry** — delete button on each row.
- **Bulk delete** — check multiple rows, then use the bulk action bar.
- **Clear all cache** — button in the AI Cache tab stats section.

---

## Adding New Mappings

### Option A — Hardcoded (permanent, shared across all users)

1. Open `immersion-next/src/lib/regionAI.ts`.
2. Add an entry to `REGION_MAPPINGS`:
   ```typescript
   'Aztec Empire': ['MX'],
   ```
3. Run `npm run build` to verify TypeScript.
4. Deploy.

### Option B — Custom via Admin UI (per-browser, no deployment needed)

1. Go to **Admin → Regions → Add/Edit** tab (or press `N` on the Regions page).
2. Enter the exact time period name.
3. Enter comma-separated ISO codes, or use the Country Code Picker.
4. Optionally click **Test with AI** to see what the AI would return.
5. Click **Save**.

### Option C — Promote from AI Cache

1. Go to **Admin → Regions → AI Cache** tab.
2. Find the entry and click **Promote to Custom**.

---

## Admin Interface

Accessible at `/admin/regions` (requires admin authentication).

### Tabs

| Tab          | Purpose                                                                 |
|--------------|-------------------------------------------------------------------------|
| Mappings     | Browse hardcoded + custom mappings, search, toggle map preview          |
| AI Cache     | View/promote/delete cached AI lookups, batch operations                 |
| Add / Edit   | Create or edit custom mappings with validation and AI test              |

### Keyboard Shortcuts

| Key  | Action                              |
|------|-------------------------------------|
| `N`  | Open Add form                       |
| `/`  | Focus search box                    |
| `?`  | Show keyboard shortcuts overlay     |
| `Esc`| Close overlay / cancel form         |

---

## API Reference

### `resolveRegion(period: string): Promise<string[]>`

Main entry point. Runs the full resolution pipeline and returns ISO codes.

```typescript
import { resolveRegion } from '@/lib/regionAI';

const codes = await resolveRegion('Viking Age');
// → ['NO', 'SE', 'DK', 'IS', 'GB', 'IE', 'FR', 'RU']
```

### `getCustomMappings(): Record<string, string[]>`

Returns all custom mappings from localStorage.

### `saveCustomMappings(mappings: Record<string, string[]>): void`

Persists custom mappings to localStorage.

### `getCacheStats(): { count: number; entries: CacheEntry[] }`

Returns statistics and entries from the AI response cache.

### `clearCacheEntry(period: string): void`

Removes a single entry from the AI cache.

---

## Troubleshooting

### Map shows no highlighted countries

1. Check the browser console for errors.
2. Open Admin → Regions and verify the period name matches exactly (case-insensitive).
3. Try the **Test with AI** button to see if the AI lookup works.
4. Verify `ANTHROPIC_API_KEY` is set on the server (`503` response means it's missing).

### AI lookup returns empty array

- The period name may be too ambiguous or unrecognized.
- Check the server logs for `[region-lookup]` prefixed messages.
- The AI may have returned invalid ISO codes that were filtered out by the allowlist.

### Rate limit errors (429)

- The admin panel makes one request per "Test with AI" click.
- If you hit the limit (10/minute), wait 60 seconds.
- For multi-instance deployments, replace the in-memory rate limiter with Redis.

### Custom mappings not persisting

- Custom mappings are stored in **browser** localStorage.
- Clearing browser data will erase them.
- Use **Export** in the admin interface to back them up.
- For shared/persistent mappings, promote to hardcoded mappings in `regionAI.ts`.
