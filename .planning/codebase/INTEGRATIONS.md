# External Integrations

**Analysis Date:** 2026-03-13

## APIs & External Services

**Voter API (voter-api Backend):**
- Base URL: `http://localhost:8000/api/v1` (dev) or `https://voteapi.civpulse.org/api/v1` (prod)
- Client: ky HTTP client configured in `src/api/client.ts`
- Auth: JWT Bearer token from `localStorage("access_token")`
- Purpose: All data fetching for elections, boundaries, voters, analysis, exports, imports
- Rate limiting: 150 requests per 60-second rolling window (token bucket in `src/api/rate-limited-fetch.ts`)

**Georgia Secretary of State (SOS) Feed:**
- URL pattern: `https://results.sos.ga.gov/*.json`
- Client: Raw `fetch` (not using shared ky client, custom validation in `src/api/sos-feed.ts`)
- Purpose: Import election results & races from SOS election feeds
- Endpoints:
  - `GET /elections/import-feed/preview` (backend-delegated preview)
  - `POST /elections/import-feed` (backend-delegated import)
- Functions: `fetchSosFeed()`, `isSosUrl()`, `extractAutoFillData()`

**US Census Bureau API:**
- Base URL: `https://api.census.gov/data/2023/acs/acs5/profile`
- Client: Raw `fetch` (custom Census-specific parsing in `src/api/census.ts`)
- Purpose: Fetch demographic data for county & state detail pages
- Variables: 25 ACS 5-Year Data Profile codes (population, income, education, race/ethnicity, etc.)
- Functions:
  - `fetchCensusProfile(fipsState, fipsCounty)` - County-level data
  - `fetchStateCensusProfile(fipsState)` - State-level data
- Response parsing: Handles Census API sentinel values (-666666666 for missing/suppressed data)

## Data Storage

**Databases:**
- No direct database connection from SPA
- All data from voter-api REST endpoints (backend manages DB)

**File Storage:**
- Static GeoJSON files: `public/geojson/` (pre-cached at build time via `scripts/fetch-geojson.mjs`)
- Build script fetches boundaries from voter-api and caches to `public/geojson/` for fast SPA load times
- Routing rule (`public/_redirects`): `/geojson/* 200` prevents SPA catch-all redirect

**Client Storage:**
- localStorage: JWT tokens (`access_token`, `refresh_token`)
- Zustand store: User profile, role, navigation context
- Browser cache: Managed by TanStack Query (server state cache)

**Caching:**
- TanStack Query: Default caching strategy for API responses
- GeoJSON: Static file cache (served by Cloudflare CDN)
- No Redis or external cache layer

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based auth (voter-api backend manages users, roles, tokens)

**Implementation:**
- Flow:
  1. Login endpoint: `POST /auth/login` with username/password
  2. Returns: `{ access_token, refresh_token, token_type: "bearer", expires_in }`
  3. Token storage: Zustand store + localStorage
  4. Automatic refresh: 401 triggers `POST /auth/refresh` with refresh token
- Scopes (Roles): `admin`, `analyst`, `viewer`
- Session expiry: Configurable via `expires_in` response field
- Store: `src/stores/authStore.ts` (Zustand)
- Hooks:
  - `useAuthStore()` - Direct store access
  - `useUserRole()` - Hook in admin features (cached 5 minutes)
  - `useAdminUsers()` - Admin user list

**Protected Routes:**
- Role-based access control at layout level (`src/routes/admin.tsx`)
- Admin routes redirect if role not `admin` or `analyst`
- Public routes optional token attachment (opportunistic auth)

## Monitoring & Observability

**Error Tracking:**
- No external error tracking service (Sentry, etc.)
- Custom error types: `AuthenticationError`, `PermissionError` in `src/types/admin.ts`

**Logging:**
- Console logging (browser DevTools)
- Toast notifications via Sonner for user-facing errors
- API client logs request/response in development (Vite DevTools)

**Network Monitoring:**
- Playwright E2E tests capture network traces on failure (`trace: "on-first-retry"`)
- Screenshots on test failure (`screenshot: "only-on-failure"`)

## CI/CD & Deployment

**Hosting:**
- Cloudflare Pages (serverless static hosting)
- Production URL: `https://vote.civpulse.org/`
- Preview deployments: Auto-created for pull requests

**CI Pipeline:**
- GitHub Actions (`.github/workflows/deploy.yml`)
- Triggers: Pushes to `main`, pull requests to `main`
- Steps:
  1. Checkout code
  2. Setup Node.js (LTS from `.nvmrc`)
  3. Install dependencies (`npm ci`)
  4. Lint (`npm run lint`)
  5. Unit tests (`npm test -- --run`)
  6. Build (`npm run build` with `VITE_API_BASE_URL` set for production)
  7. Deploy to Cloudflare Pages (`wrangler pages deploy`)
  8. Comment preview URL on PR (if applicable)

**Secrets & Auth:**
- `CLOUDFLARE_API_TOKEN` - Cloudflare API authentication
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account identifier
- GitHub Actions secrets (stored in repo settings)

**E2E Testing:**
- Separate workflow (`.github/workflows/e2e.yml`)
- Runs Playwright tests against production build (`npm run preview`)
- Runs on PR/push to main
- Retries: 2 in CI, 0 locally

## Environment Configuration

**Required Client Env Vars:**
- `VITE_API_BASE_URL` - Voter API base URL
  - Dev default: `http://localhost:8000/api/v1`
  - Prod: `https://voteapi.civpulse.org/api/v1`

**Secrets Location:**
- GitHub Actions: Repository secrets & variables
- Local dev: `.env` file (copy from `.env.example`, add `VITE_API_BASE_URL` as needed)
- No .env secrets committed to git

## Webhooks & Callbacks

**Incoming:**
- None (SPA - no server endpoints)

**Outgoing:**
- None (data fetched on-demand via HTTP, no push notifications)

## Rate Limiting & Quotas

**Voter API:**
- Client-side rate limit: 150 requests/minute (token bucket)
- Implemented via `src/api/rate-limited-fetch.ts`
- Automatic retry logic (3 retries with exponential backoff for 408, 413, 429, 500, 502, 503, 504)

**US Census Bureau:**
- No explicit rate limit enforced by client (API has fair-use limits)
- Requests made on-demand (not cached beyond browser cache)

**Georgia SOS Feed:**
- No rate limiting (external third-party)
- 10-second timeout per request

## Admin Features Integration

**Admin API Endpoints:**
- User management: `GET /admin/users`, `POST /admin/users`
- Import jobs: `GET /admin/imports`, `POST /admin/imports/voters`, `POST /admin/imports/boundaries`
- Export jobs: `GET /admin/exports`, `POST /admin/exports`
- Role-based access control enforced at backend (403 if insufficient permissions)

**Polling Pattern:**
- Import/export job lists auto-poll every 3 seconds while jobs pending/processing
- Stops polling automatically when all jobs reach terminal states (completed/failed)
- Implemented via TanStack Query's `refetchInterval` with dynamic function

**File Upload:**
- Voter CSV: `POST /admin/imports/voters` with multipart file
- Boundary GeoJSON/ZIP: `POST /admin/imports/boundaries` with multipart file
- Max size: 100MB (client-side validation)
- Response: 202 Accepted (async processing) with job ID for polling

---

*Integration audit: 2026-03-13*
