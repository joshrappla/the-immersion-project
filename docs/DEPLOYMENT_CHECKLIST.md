# Deployment Checklist — Region Mapping System

Use this checklist before deploying changes related to the region mapping feature to production.

---

## 1. Environment Variables

- [ ] `NEXT_PUBLIC_API_URL` is set to the production API Gateway URL.
- [ ] `ANTHROPIC_API_KEY` is set (server-side only, **no** `NEXT_PUBLIC_` prefix).
- [ ] `ADMIN_PASSWORD` is set to a strong password (≥ 16 characters).
- [ ] `ADMIN_SESSION_SECRET` is set to a random 64-character hex string.
- [ ] No API keys or secrets are committed to the repository.
- [ ] `.env.local` is listed in `.gitignore` and has not been committed.
- [ ] All required variables are also set in the hosting platform's environment settings
  (Vercel → Project Settings → Environment Variables, or equivalent).

---

## 2. Security

### Authentication
- [ ] `/admin/*` routes are protected — unauthenticated requests redirect to `/admin/login`.
- [ ] Admin session cookie is `httpOnly`, `secure`, and `sameSite: strict`.
- [ ] Session secret is rotated from any default or placeholder value.

### API Route (`/api/region-lookup`)
- [ ] Rate limiting is active (10 requests / 60 seconds per IP).
- [ ] Input sanitization strips control characters and HTML angle brackets.
- [ ] Response country codes are validated against the ISO allowlist on the server.
- [ ] No user-supplied data is passed unsanitized to the AI prompt beyond the
  sanitized period string.
- [ ] The `Retry-After` header is returned on 429 responses.

### General
- [ ] No `console.log` statements expose sensitive data (API keys, session tokens).
- [ ] All structured error logs use the `[region-lookup]` or `[ErrorBoundary]` prefix
  for easy filtering in log drains.

---

## 3. Performance

- [ ] `RegionMapPreview` is wrapped with `React.memo` and a custom array-contents
  comparator (prevents unnecessary TopoJSON re-renders).
- [ ] The admin `/admin/regions` page does not block the main admin page load.
- [ ] The world atlas TopoJSON (`countries-110m.json`) loads from the CDN
  (`cdn.jsdelivr.net`) — verify CDN availability is acceptable for your region.
- [ ] Consider adding `Cache-Control` headers to the `/api/region-lookup` response
  if the same period will be requested frequently by many users.
- [ ] For high-traffic deployments, replace the in-memory rate limiter with a Redis
  or Upstash-backed solution (the current implementation resets on server restart
  and does not share state across multiple instances).

---

## 4. Error Handling

- [ ] `ErrorBoundary` component is available at `src/components/ErrorBoundary.tsx`.
- [ ] High-risk UI sections (map rendering, AI result display) are wrapped in
  `<ErrorBoundary>` so that rendering errors are isolated.
- [ ] The `/api/region-lookup` route returns structured JSON errors for all failure
  modes (400, 429, 502, 503) — not raw stack traces.
- [ ] The AI parse-error fallback returns `{ type: 'era', countries: [], ... }` rather
  than a 500 error, so the UI degrades gracefully.

---

## 5. Build & Type Safety

- [ ] `npm run build` completes with **zero TypeScript errors**.
- [ ] `npm run lint` passes with no errors (warnings acceptable if pre-existing).
- [ ] No `any` types introduced in new code that would suppress validation.
- [ ] `RegionMapPreview` memo comparator covers both `height` and full array contents.

---

## 6. Functionality Verification

### Hardcoded Mappings
- [ ] All 7 hardcoded periods resolve correctly (spot-check 2–3 in the admin panel).
- [ ] Period matching is case-insensitive (test: `"viking age"` → same result as
  `"Viking Age"`).

### Custom Mappings
- [ ] Create a custom mapping, reload the page, verify it persists.
- [ ] Edit an existing custom mapping, verify the update is saved.
- [ ] Delete a custom mapping, verify it is removed.
- [ ] Export custom mappings produces valid JSON.

### AI Fallback
- [ ] Test an unrecognized period (e.g. "Mughal Empire") — verify AI is called and
  returns a valid result.
- [ ] Verify the result is cached — make the same request again and confirm no second
  API call is made (check Network tab or server logs).
- [ ] Test the rate limit: make 11 requests in under 60 seconds, verify the 11th
  returns 429 with `Retry-After: 60`.
- [ ] Verify a 503 response when `ANTHROPIC_API_KEY` is missing (test in a staging
  environment with the key unset).

### Admin Interface
- [ ] `/admin/regions` loads and displays hardcoded mappings.
- [ ] AI Cache tab shows cached entries after running an AI lookup.
- [ ] "Promote to Custom" moves an entry from cache to custom mappings.
- [ ] Bulk select + bulk delete removes all selected cache entries.
- [ ] Keyboard shortcuts work: `N`, `/`, `?`, `Esc`.
- [ ] "Test with AI" in the Add/Edit form returns a result and populates the countries
  field.
- [ ] Step-by-step test mode shows all 5 resolution steps with correct hit/miss status.

### Map Preview
- [ ] `RegionMapPreview` renders the correct countries highlighted in purple.
- [ ] The map loads without console errors (TopoJSON CDN accessible).
- [ ] Map preview toggle in the Mappings tab works correctly.

---

## 7. Accessibility

- [ ] All form inputs have associated `<label>` elements (via `htmlFor` / `id`).
- [ ] Error messages use `role="alert"` where applicable (ErrorBoundary default
  fallback already does this).
- [ ] Interactive elements (buttons, checkboxes) have visible focus indicators.
- [ ] Keyboard shortcuts do not fire when the user is typing in an input field
  (verify `isTyping()` guard is working).

---

## 8. Documentation

- [ ] `docs/REGION_MAPPINGS.md` is up to date with the current resolution pipeline.
- [ ] `env.local.example` contains all required environment variable templates.
- [ ] Any new ISO codes added to `ISO_A2_TO_NAME` in `RegionMapPreview.tsx` are also
  present in `VALID_ISO_CODES` in the API route.
- [ ] The hardcoded mappings table in `REGION_MAPPINGS.md` reflects the current
  `REGION_MAPPINGS` constant in `regionAI.ts`.

---

## 9. Rollback Plan

If a deployment causes regressions:

1. The region mapping system degrades gracefully — if the AI API is unavailable,
   hardcoded and custom mappings still work.
2. To roll back: revert the relevant commits and redeploy.
3. Custom mappings stored in user localStorage are not affected by server deployments.
4. If the AI cache in localStorage is corrupt, it can be cleared via
   Admin → Regions → AI Cache → "Clear all cache".

---

## 10. Post-Deployment Verification

- [ ] Trigger at least one AI lookup in production and verify the server log shows
  `[region-lookup]` entries (not errors).
- [ ] Confirm the admin panel loads at `/admin/regions` in production.
- [ ] Check that the world map renders correctly in the production environment
  (CDN not blocked by firewall or CSP headers).
- [ ] Review `Content-Security-Policy` headers if set — ensure `cdn.jsdelivr.net`
  is in the `connect-src` or `default-src` allowlist.
