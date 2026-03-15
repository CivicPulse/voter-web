# Codebase Structure

**Analysis Date:** 2026-03-13

## Directory Layout

```
voter-web/
├── .claude/                    # Claude Code integration & commands
├── .github/                    # GitHub workflows (CI/CD, deploy)
├── .hatchkit/                  # Hatchkit tooling config
├── .planning/                  # GSD planning documents
│   └── codebase/              # Generated architecture/structure docs (ARCHITECTURE.md, STRUCTURE.md, etc.)
├── .specify/                   # Team specification & memory
├── specs/                      # Feature specifications (001-admin-api-access, 002-election-results, etc.)
├── public/                     # Static assets served by SPA
│   ├── geojson/               # Pre-fetched boundary GeoJSON (built from API)
│   └── sounds/                # Notification sounds
├── docs/                       # Project documentation
├── research/                   # Research materials & notes
├── scripts/                    # Build scripts (fetch-geojson.mjs)
├── src/                        # Application source code
│   ├── api/                   # HTTP client & API functions
│   ├── components/            # React components (feature & UI)
│   ├── hooks/                 # Custom React hooks (geospatial, data fetching)
│   ├── lib/                   # Utility functions & business logic
│   ├── routes/                # File-based routes (TanStack Router)
│   ├── stores/                # Zustand state stores
│   ├── test/                  # Test utilities & fixtures
│   ├── types/                 # TypeScript type definitions
│   ├── index.css              # Global Tailwind CSS
│   ├── main.tsx               # Application entry point
│   └── routeTree.gen.ts       # Auto-generated route tree (do not edit)
├── tests/                      # Unit tests mirroring src/ structure
├── e2e/                        # End-to-end tests (Playwright)
│   ├── fixtures/              # Mock data & API interception
│   └── *.spec.ts             # Test specs
├── vite.config.ts             # Vite build config
├── vitest.config.ts           # Vitest unit test config
├── playwright.config.ts       # Playwright E2E config
├── tsconfig.json              # TypeScript base config
├── tsconfig.app.json          # TypeScript app config (strict mode)
├── tsconfig.node.json         # TypeScript Node.js config
├── eslintrc.ts                # ESLint rules
├── .prettierrc                 # Prettier formatting
├── package.json               # Dependencies & scripts
└── .env.example               # Environment variables template
```

## Directory Purposes

**`.planning/codebase/`:**
- Purpose: GSD codebase mapping documents (auto-generated)
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md, STACK.md, INTEGRATIONS.md
- Key files: All `.md` files document specific aspects for downstream GSD commands

**`src/api/`:**
- Purpose: HTTP clients and API wrapper functions
- Contains: HTTP client setup, API endpoint wrappers organized by domain (auth, elections, voters, admin, etc.)
- Key files:
  - `client.ts`: Ky HTTP client instances (`api` authenticated, `publicApi` opportunistic)
  - `auth.ts`: Login/refresh/getMe
  - `rate-limited-fetch.ts`: Rate-limiting + retry logic
  - `voters.ts`, `lookup.ts`, `census.ts`, `sos-feed.ts`: Public endpoints

**`src/components/`:**
- Purpose: React component library (both custom and shadcn/ui)
- Contains: Feature components organized by domain, UI base components
- Key files:
  - `ui/`: shadcn/ui components (button, dialog, input, select, tabs, etc.)
  - `elections/`: ElectionDetailPage, ElectionResultsMap, CandidateList, ParticipationTab, etc.
  - `census/`: Census-related components
  - Root-level: LayerBar, StateCountyMap, DistrictDetailContent, WelcomeModal, etc.

**`src/hooks/`:**
- Purpose: Custom hooks for geospatial logic, slug resolution, boundary fetching
- Contains: Hooks for district/county lookup, boundary verification, voter search
- Key files:
  - `useDistrictSlugResolver.ts`: Resolve `/districts/$type/$name` to districtId
  - `useDistrictSlugResolverScoped.ts`: Resolve `/districts/$state/$county/$type/$name` to districtId
  - `useCountySlugResolver.ts`: Resolve county slug to ID
  - `useBoundaryTypeGeoJSON.ts`: Fetch GeoJSON overlays
  - `useDistrictCheck.ts`: Verify district exists
  - `useVoters.ts`: Voter search with filters

**`src/lib/`:**
- Purpose: Utilities, business logic, and data fetching helpers
- Contains: Helper functions, Zod schemas, API wrappers, algorithms
- Key subdirectories:
  - `api/`: API function wrappers (admin.ts, elections.ts, voters.ts, etc.) that compose HTTP calls
  - `hooks/`: TanStack Query hooks for server state (useActiveElections, useRaceResults, useImportJobs, etc.)
  - `schemas/`: Zod validation schemas for forms
  - `utils/`: Utility functions (formatters, validators, string helpers)
- Key files:
  - `slugs.ts`: Generate fully-qualified URLs for districts/counties
  - `states.ts`: ABBREV_TO_FIPS, FIPS_TO_ABBREV mappings
  - `auth-guards.ts`: requireAuth(), requireRole() route guards
  - `candidate-colors.ts`, `provider-colors.ts`: Color assignment for data viz
  - `merge-precinct-data.ts`: Combine precinct results
  - `geo.ts`: Geospatial utilities (bbox, intersection, etc.)

**`src/routes/`:**
- Purpose: File-based routing with TanStack Router
- Contains: Route files (`.tsx` ending in `createFileRoute()`)
- Key structure:
  - `__root.tsx`: Root layout (header, nav, providers)
  - `index.tsx`: Home page
  - `elections.tsx`, `elections/$electionDate.tsx`, `elections/$electionDate/$electionId.tsx`: Election detail pages
  - `voters.tsx`, `voters/_components/`: Voter search & results
  - `lookup/index.tsx`: Address lookup (geocoding)
  - `districts/`: District detail pages with multiple routing patterns (state-scoped, county-scoped, legacy)
  - `counties/`: County detail pages
  - `candidates/`: Candidate detail pages
  - `admin.tsx`: Admin layout (RBAC check)
  - `admin/users/index.tsx`, `admin/imports/index.tsx`, `admin/exports/index.tsx`, `admin/elections/index.tsx`, `admin/geocoding/index.tsx`, `admin/analysis/index.tsx`: Admin pages with `_components/` subdirs for page-specific components
  - Layout files have `createFileRoute()` and `component:` exports
  - Search parameters validated with Zod `validateSearch` schemas

**`src/stores/`:**
- Purpose: Zustand state stores for client-side state
- Contains: Auth state, geographic navigation context
- Key files:
  - `authStore.ts`: Login, logout, token refresh, user profile
  - `navigation-context.ts`: Current state/county for pre-populating filters

**`src/test/`:**
- Purpose: Shared test utilities and fixtures
- Contains: Custom render wrapper, mock data factories
- Key files:
  - `render.tsx`: Wrapper providing QueryClientProvider, TooltipProvider for tests
  - `mocks/elections.ts`: Mock election data factories

**`src/types/`:**
- Purpose: TypeScript type definitions for API responses and domain models
- Contains: Interfaces for elections, boundaries, voters, admin, census, etc.
- Key files:
  - `elections.ts`: Election, Race, Candidate, CensusProfile, etc. types
  - `boundary.ts`: Boundary, CountyMetadata types
  - `voters.ts`: Voter, VoterSearchResult types
  - `admin.ts`: AdminUser, ImportJob, ExportJob, Invite types
  - `auth.ts`: UserProfile, TokenResponse, LoginCredentials
  - `candidates.ts`: Candidate types with API source

**`tests/`:**
- Purpose: Unit tests for utilities, hooks, and components
- Contains: `.test.ts` and `.test.tsx` files mirroring `src/` structure
- Key patterns:
  - `tests/api/`: API client tests (auth, voters, rate-limited-fetch)
  - `tests/lib/`: Utility function tests
  - `tests/components/`: Component rendering tests
  - `tests/hooks/`: Hook tests (not data-fetching)
  - `tests/routes/`: Route component tests
  - `tests/stores/`: Store tests

**`e2e/`:**
- Purpose: End-to-end browser tests using Playwright
- Contains: Test specs and fixtures for API mocking
- Key files:
  - `fixtures/election-api.ts`: Route interception for API endpoints
  - `fixtures/mock-data.ts`: Mock response data
  - `*.spec.ts`: Test scenarios

**`public/`:**
- Purpose: Static assets served by the SPA
- Contains: GeoJSON boundaries, images, sounds
- Key files:
  - `geojson/`: Pre-fetched boundary GeoJSON (auto-generated at build time)
  - `sounds/`: Notification audio
  - `_redirects`: SPA routing rules (exclude geojson/*, fall through to index.html)

## Key File Locations

**Entry Points:**
- `src/main.tsx`: Application bootstrap (QueryClient, Router, providers)
- `src/routes/__root.tsx`: Root layout (header, navigation, Outlet)
- `public/index.html`: HTML template (single root div)

**Configuration:**
- `vite.config.ts`: Vite build config (routes plugin, API base URL)
- `vitest.config.ts`: Vitest config (jsdom, setup file, coverage)
- `playwright.config.ts`: Playwright config (port 4173, API interception)
- `tsconfig.json`: Path aliases (`@/*` → `src/*`), strict mode
- `.env.example`: Environment variables (VITE_API_BASE_URL)

**Core Logic:**
- `src/api/client.ts`: HTTP client with JWT & token refresh
- `src/stores/authStore.ts`: Authentication state management
- `src/lib/api/`: Domain-specific API wrappers (elections, voters, admin)
- `src/lib/hooks/`: TanStack Query hooks for data fetching
- `src/hooks/`: Custom hooks for URL resolution and geospatial logic
- `src/components/elections/ElectionDetailPage.tsx`: Main election UI component

**Testing:**
- `src/test/render.tsx`: Custom render wrapper for tests
- `e2e/fixtures/election-api.ts`: API mock setup
- `vitest.config.ts`: Test runner config

## Naming Conventions

**Files:**
- React components (`.tsx`): PascalCase (e.g., `ElectionDetailPage.tsx`, `CandidateList.tsx`)
- Utilities (`.ts`): kebab-case (e.g., `merge-precinct-data.ts`, `candidate-colors.ts`) or camelCase for functions (e.g., `slugs.ts`, `states.ts`)
- Routes: File structure reflects URL (e.g., `/districts/$state/$type/$name` → `src/routes/districts/$state/$type/$name.tsx`)
- Test files: Mirror source with `.test.ts` or `.test.tsx` suffix (e.g., `tests/api/auth.test.ts`)

**Directories:**
- Feature folders: plural kebab-case (e.g., `components/elections/`, `src/routes/admin/elections/`)
- Shared components in features: `_components/` subdirectory (not treated as routes)
- API domains: kebab-case (e.g., `src/api/rate-limited-fetch.ts`)
- Hook files: camelCase with `use` prefix (e.g., `useDistrictSlugResolver.ts`)

**Types:**
- Type files: PascalCase with domain (e.g., `Election`, `Boundary`, `AdminUser`)
- Interfaces: `I` prefix omitted (e.g., `Election` not `IElection`)
- Enums: PascalCase (e.g., `VoterStatus`, `ElectionType`)

## Where to Add New Code

**New Feature (e.g., new tab in election detail):**
- Primary code: `src/components/elections/` (e.g., `NewTab.tsx`)
- Page-specific components: `src/routes/elections/$electionDate/_components/` if needed
- Hooks for data: `src/lib/hooks/` (e.g., `useNewTabData.ts`)
- Types: `src/types/elections.ts` (extend Election type if needed)
- Tests: `tests/components/elections/NewTab.test.tsx` and `tests/lib/hooks/useNewTabData.test.ts`

**New Route (e.g., new admin page):**
- Route file: `src/routes/admin/new-feature/index.tsx` (use `createFileRoute()`)
- Page components: `src/routes/admin/new-feature/_components/` (optional)
- Hooks: `src/lib/hooks/useNewFeatureData.ts` if data fetching
- Navigation: Add link in `src/routes/__root.tsx` AdminNavLinks
- Tests: `tests/routes/admin/new-feature/index.test.tsx`

**New Utility/Helper:**
- Simple formatter/validator: `src/lib/utils/` (e.g., `src/lib/utils/formatters.ts`)
- Domain-specific logic: `src/lib/` root (e.g., `src/lib/candidate-colors.ts`)
- Geospatial logic: `src/lib/geo.ts` or `src/hooks/`
- Tests: `tests/lib/` mirroring location

**New API Integration:**
- API wrapper: `src/api/new-domain.ts` or add to `src/lib/api/`
- Types: `src/types/new-domain.ts`
- Hooks: `src/lib/hooks/useNewDomain.ts` (if using TanStack Query)
- Tests: `tests/api/new-domain.test.ts`

**New Component:**
- Feature component: `src/components/feature-name.tsx` (or `feature-name/index.tsx` if complex)
- shadcn/ui component: `src/components/ui/` (installed via `npx shadcn@latest add <name>`)
- Page-specific: `src/routes/[feature]/_components/ComponentName.tsx`
- Tests: `tests/components/ComponentName.test.tsx`

## Special Directories

**`src/components/ui/`:**
- Purpose: shadcn/ui components (pre-built, customizable)
- Generated: Yes (installed via `npx shadcn@latest add`)
- Committed: Yes
- Do NOT edit manually; recreate via shadcn CLI if needed

**`public/geojson/`:**
- Purpose: Static GeoJSON boundary files pre-fetched from API
- Generated: Yes (at build time by `scripts/fetch-geojson.mjs`)
- Committed: No (generated during build)
- Usage: Served as static files, routed in `public/_redirects` as `200` (not SPA redirect)

**`src/routeTree.gen.ts`:**
- Purpose: Auto-generated route tree by TanStack Router Vite plugin
- Generated: Yes (automatically during dev/build)
- Committed: No (regenerate via `npx @tanstack/router-cli generate --target react`)
- Do NOT edit manually; marked read-only in VSCode

**`src/test/mocks/`:**
- Purpose: Mock data factories for testing
- Generated: No
- Committed: Yes
- Usage: Import factories in unit/E2E tests

**`.env.local`:**
- Purpose: Local environment overrides (not committed)
- Generated: No (created manually from `.env.example`)
- Committed: No (in `.gitignore`)
- Contains: VITE_API_BASE_URL, any local secrets

---

*Structure analysis: 2026-03-13*
