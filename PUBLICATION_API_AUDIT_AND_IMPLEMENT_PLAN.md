# Publication API Audit and Implement Plan (2026-04-09)

## 1) Scope reviewed
- Backend routing and docs: `backend/src/app.js`, `backend/src/config/swagger.js`
- Public publication flow: `backend/src/routes/public_publication.routes.js`, `backend/src/controllers/public_publication.controller.js`, `backend/src/services/admin/publication.service.js`
- Public search flow: `backend/src/routes/public_search.routes.js`, `backend/src/controllers/search.controller.js`, `backend/src/controllers/public_search.controller.js`
- Home/public support flow: `backend/src/routes/public_home.routes.js`, `backend/src/controllers/public_home.controller.js`
- Reader UI compatibility check (detail): `frontend/app/reader/books/[id]/page.tsx`

## 2) Current assessment (publication flow)

### What is already good
- Public list/detail/search endpoints are present and callable.
- Detail supports both ID and slug lookup.
- Core object shape for app includes practical fields: `title`, `author`, `thumbnail`, `cover_image`, `publication_year`, `media_type`, `copies`, `relatedItems`.
- Reader personalization exists in detail (`user_interaction`, `canRead`).

### Main gaps found
- Response `code` field not fully standardized across controllers (0 for success policy was inconsistent).
- Pagination schema/documentation and runtime shape were drifting.
- Detail endpoint counted view before resolving slug -> possible incorrect insert for slug value.
- Publication list had missing `pages` field in service mapping.
- Swagger list contract for `/api/public/publications` did not match actual payload (`data` array + top-level `pagination`).
- Reader detail UI had weak compatibility handling for title/description JSON parsing and favorite toggle response shape.

## 3) Quick synchronization implemented now

### Backend changes
1. `backend/src/controllers/public_publication.controller.js`
- Standardized `code` to `0` on success.
- Added safe clamp for list params: `page >= 1`, `1 <= limit <= 100`.
- Moved view logging to run after detail fetch and always log by resolved numeric `pub.id`.
- Standardized summarize payload to object:
  - `data.summary`
  - `data.cached`

2. `backend/src/controllers/public_search.controller.js`
- Standardized `code` to `0` on success.
- Added safe clamp for search pagination: `page`, `limit`.

3. `backend/src/services/admin/publication.service.js`
- Added `pages` into publication list response.
- Enriched `pagination` for compatibility:
  - `page`, `limit`, `total`, `totalItems`, `totalPages`, `currentPage`.

4. `backend/src/routes/public_publication.routes.js`
- Synced Swagger docs of list endpoint with actual runtime contract:
  - `data: Publication[]`
  - `pagination` at top level.

5. `backend/src/config/swagger.js`
- Expanded `Pagination` schema to include both new and backward-compatible fields.

### Frontend compatibility fix
6. `frontend/app/reader/books/[id]/page.tsx`
- Safe parser for mixed plain-text/JSON title and description.
- Favorite toggle now reads `json.data.isFavorited`.
- Publisher render supports `publisher_name` fallback from API.

## 4) Is publication flow professional yet?

### Short answer
- **Usable and significantly improved**, but **not fully professional-grade yet** for high scale.

### Remaining items for professional baseline
- Input validation middleware (centralized) for search/list filters (year ranges, query length, whitelist sorting).
- Unified response formatter shared across all controllers (remove duplicated `sendResponse` blocks).
- Stabilize one pagination contract for all public endpoints and update all route docs accordingly.
- Home endpoints should support pagination or explicitly document fixed-size feed strategy.
- Add selective cache strategy for public home/list/detail (TTL-based).
- Add DB index review for search fields to avoid heavy `ILIKE` degradation at scale.

## 5) Proposed implementation plan (next steps)

### Phase A - Contract hardening (1-2 days)
- Create shared response util.
- Normalize all public controllers to one response envelope.
- Add validation middleware for public publication/search/home query params.
- Freeze API contract version note in docs (v1 stable).

### Phase B - Publication API quality (2-3 days)
- Introduce explicit DTO schema for:
  - `PublicationListItem`
  - `PublicationDetail`
- Align Swagger examples with actual data from DB.
- Add test matrix for list/detail/search (slug, id, edge filters, invalid params).

### Phase C - Performance and ops (3-5 days)
- Add cache middleware for high-read endpoints.
- Tune SQL and indexes for search/list hot paths.
- Add observability for p95 latency and DB query counts.

## 6) Acceptance checklist
- Public list/detail/search pass contract tests.
- Swagger contract equals runtime payload for all publication endpoints.
- Frontend reader detail renders safely with both JSON/plain text payloads.
- Response code policy consistent: success => `code = 0`.
- Pagination fields documented and stable.

## 7) Rollout notes
- Current quick-sync changes are backward-compatible.
- No route path was changed.
- Existing clients can continue while consuming richer pagination fields.
