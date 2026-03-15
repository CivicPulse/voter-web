# Development Guide

A guide for contributors and developers working on CivicPulse Voter Data Explorer.

## Architecture Overview

The app is a client-side Single Page Application (SPA) with a layered architecture:

```
API Client → State Management → Data Fetching → Hooks → Components → Routes
```

**Key characteristics:**
- Vite-based React 19 SPA with TanStack Router (file-based routing)
- JWT-based authentication with automatic token refresh
- TanStack Query for server state management and auto-polling
- Zustand for lightweight client state (auth, geographic context)
- Geospatial-focused UI with React-Leaflet and Turf.js
- shadcn/ui component library for UI consistency
- TypeScript strict mode throughout

---

## Project Structure

```
src/
├── api/              # HTTP client and API endpoint modules
│   ├── client.ts     # ky instances (api, publicApi) with JWT hooks
│   ├── auth.ts       # Login, refresh, logout
│   ├── voters.ts     # Voter search and detail
│   ├── lookup.ts     # Address verification and geocoding
│   ├── census.ts     # Census Bureau API
│   └── sos-feed.ts   # GA Secretary of State feed
├── components/
│   ├── ui/           # shadcn/ui base components
│   ├── elections/    # Election-related components
│   ├── census/       # Census data components
│   └── *.tsx         # Feature components (maps, officials, etc.)
├── hooks/            # Reusable hooks (boundary, slug resolution, voters)
├── lib/
│   ├── api/          # API wrapper functions (admin, elections, voters)
│   ├── hooks/        # TanStack Query hooks (elections, users, imports)
│   ├── schemas/      # Zod validation schemas
│   ├── utils/        # Utility functions (file validation, formatters)
│   ├── slugs.ts      # URL slug generation
│   ├── states.ts     # State/FIPS code mappings
│   └── utils.ts      # cn() class merging utility
├── routes/           # TanStack Router file-based routes
│   ├── __root.tsx    # Root layout (nav, auth state)
│   ├── index.tsx     # Home page (state map)
│   ├── admin.tsx     # Admin layout (RBAC)
│   ├── admin/        # Admin sub-routes
│   ├── elections/    # Election browsing and detail
│   ├── voters/       # Voter search and detail
│   ├── lookup/       # Address lookup
│   ├── counties/     # County detail pages
│   └── districts/    # District detail pages
├── stores/           # Zustand state stores
│   ├── authStore.ts  # Auth tokens, login/logout
│   └── navigation-context.ts  # Geographic context
├── test/             # Test utilities
│   ├── render.tsx    # Custom render wrapper with providers
│   ├── setup.ts      # Vitest setup
│   └── mocks/        # Mock data factories
├── types/            # TypeScript type definitions
└── main.tsx          # App entry (Router + QueryClient)
```

Additional directories:
- `tests/` — unit test files (mirrors `src/` structure)
- `e2e/` — Playwright E2E test specs and fixtures
- `public/` — static assets (GeoJSON, _redirects, sounds)
- `scripts/` — build scripts (GeoJSON fetching, deployment)

---

## Coding Conventions

### Imports

Always use the `@/` path alias (maps to `src/`). Never use relative paths like `../../../`.

**Import order:**
1. React and external libraries
2. TanStack libraries (Router, Query, Table)
3. UI libraries (shadcn/ui, Lucide)
4. Utility libraries (Zod, clsx)
5. Internal `@/` imports

```typescript
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { VoterSearchResponse } from "@/types/voter"
```

### Components

- shadcn/ui components go in `src/components/ui/` — added via `npx shadcn@latest add <name>`
- Custom feature components go in `src/components/`
- Route-specific components go in `src/routes/<feature>/_components/` (underscore prefix excludes from routing)
- Use `cn()` from `@/lib/utils` to merge Tailwind classes
- Icons from `lucide-react`
- Toast notifications via Sonner

### Routing

- Routes live in `src/routes/` as file-based routes
- Route files export `Route` using `createFileRoute()` or `createRootRoute()`
- `src/routeTree.gen.ts` is auto-generated — never edit manually
- Search parameters validated with Zod via `validateSearch`
- Route guards use `requireAuth()` / `requireRole()` in `beforeLoad`

### Data Fetching

- All API calls go through TanStack Query hooks
- API functions in `src/lib/api/` or `src/api/`
- Query keys follow `["domain", "operation", params]` pattern
- `staleTime` varies: 60s for elections, 5min for user roles, 0 for polling
- Mutations invalidate related queries on success
- Loading states use skeleton loaders, not spinners

### State Management

| State Type | Solution | Location |
|-----------|----------|----------|
| Server state | TanStack Query | `src/lib/hooks/` |
| Auth state | Zustand | `src/stores/authStore.ts` |
| Geographic context | Zustand | `src/stores/navigation-context.ts` |
| UI state | React useState | Component-local |

### Forms & Validation

- React Hook Form for form state
- Zod schemas for validation (in `src/lib/schemas/`)
- Schemas shared between form validation and route search params

### Error Handling

Three custom error classes in `src/types/admin.ts`:
- `AuthenticationError` (401) — session expired, triggers logout
- `PermissionError` (403) — insufficient permissions
- `NetworkError` — network failures during polling

The API client (`src/api/client.ts`) intercepts 401/403 responses automatically. All mutations show toast notifications on error.

### Maps

- React-Leaflet for map rendering
- Turf.js for geometric operations (bbox, intersects, helpers)
- Colorblind-friendly palette for district overlays
- Static GeoJSON files pre-fetched at build time in `public/geojson/`

---

## Testing

### Unit Tests (Vitest)

```bash
npm test              # Watch mode
npm test -- --run     # Single run (CI)
npm run test:coverage # With coverage report
```

**Configuration:** `vitest.config.ts`

**Coverage thresholds:** 95% for lines, functions, branches, and statements.

**Key files:**
- `src/test/render.tsx` — custom render wrapper with QueryClient and Router providers
- `src/test/setup.ts` — Vitest setup (jsdom, testing-library matchers)
- `src/test/mocks/elections.ts` — mock data factories

**Patterns:**
- Test files in `tests/` mirror `src/` structure with `.test.ts` / `.test.tsx` suffix
- Use `render()` from `@/test/render` (not directly from testing-library) for components using TanStack Query
- Mock factories follow `mock<Entity>()` naming (e.g., `mockElection()`, `mockVoterSearchResponse()`)
- Use `vi.mock()` for module mocking

### E2E Tests (Playwright)

```bash
npm run build         # Required first
npm run test:e2e      # Run tests
npm run test:e2e:ui   # Interactive UI mode
```

**Configuration:** `playwright.config.ts`

**Architecture:** Tests run against `vite preview` (production build on port 4173). API calls are intercepted with `page.route()` using mock responses — no backend needed.

**Key files:**
- `e2e/fixtures/mock-data.ts` — mock API responses
- `e2e/fixtures/election-api.ts` — route interception fixture

**Adding a new E2E test:**
1. Add mock data to `e2e/fixtures/mock-data.ts` (if new API endpoints needed)
2. Add route interception to `e2e/fixtures/election-api.ts`
3. Create test spec in `e2e/` using `import { test, expect } from "./fixtures/election-api"`

**When to write E2E tests:**
- After adding user-facing features (especially interactive elements)
- After fixing UI bugs (regression test)
- After changing API response shapes
- After modifying map rendering or data display

### CI Integration

- **Unit tests** run in `.github/workflows/deploy.yml` (lint → test → build → deploy)
- **E2E tests** run in `.github/workflows/e2e.yml` (build → Playwright → upload artifacts)
- Both trigger on pushes to `main` and PRs to `main`

---

## Admin Feature Architecture

Admin features follow a consistent pattern across all sections (users, elections, imports, exports, geocoding, analysis).

### Component Organization

```
src/routes/admin/<feature>/
├── index.tsx          # Main page component
├── create.tsx         # Creation page (if applicable)
├── $entityId.tsx      # Detail page (if applicable)
└── _components/       # Shared components (not routes)
    ├── *-table.tsx    # Data table component
    └── *-dialog.tsx   # Dialog components
```

### Auto-Polling Pattern

Import, export, geocoding, and analysis job lists use intelligent auto-polling:

```typescript
refetchInterval: (query) => {
  const jobs = query.state.data?.jobs ?? []
  const hasActiveJobs = jobs.some(isActiveJob)
  return hasActiveJobs ? 3000 : false
}
```

- Polls every 3 seconds when any job is `pending` or `processing`
- Stops automatically when all jobs reach terminal states
- `staleTime: 0` ensures fresh data during polling

### RBAC Pattern

Access control is enforced at the admin layout level (`src/routes/admin.tsx`):

```typescript
const { data: user } = useUserRole()
const isAdmin = user?.role === "admin" || user?.role === "analyst"
if (!user || !isAdmin) return <AccessDeniedUI />
```

Admin navigation in `__root.tsx` is conditionally rendered based on the same role check.

### Two-Step Confirmation

Critical operations (elevated role creation, file uploads, deletions) use a confirmation dialog before executing the API call.

### Adding a New Admin Feature

1. Create route file: `src/routes/admin/<feature>/index.tsx`
2. Define types in `src/types/admin.ts`
3. Add API functions to `src/lib/api/admin.ts`
4. Create TanStack Query hooks in `src/lib/hooks/use-<feature>.ts`
5. Update navigation in `src/components/admin-nav-menu.tsx`
6. Wrap page in `AdminErrorBoundary`
7. Write unit tests (95% coverage)
8. Write E2E tests for key user flows

---

## Contributing Workflow

### Branch Strategy

All work must be done on feature branches. Never commit directly to `main`.

```bash
git checkout main
git pull
git checkout -b 042-feature-name
```

Branch naming: `###-feature-name` (numeric prefix for traceability).

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`

**Example:** `feat(counties): add geographic details section to county page`

### Pull Request Process

1. Push your branch and open a PR against `main`
2. Fill in the PR template with description and test plan
3. Ensure CI checks pass (lint, type check, unit tests, build, E2E)
4. Request review
5. Address feedback and push updates
6. Merge after approval
7. Production deploy happens automatically on merge to `main`

### Code Review Checklist

- [ ] Follows project conventions (@/ imports, strict TypeScript, shadcn/ui)
- [ ] Tests present with ≥ 95% coverage
- [ ] No security vulnerabilities (XSS, injection, etc.)
- [ ] No over-engineering or unnecessary complexity
- [ ] PR description clearly explains changes
- [ ] All CI checks pass

---

## Adding UI Components

shadcn/ui components are added via CLI and placed in `src/components/ui/`:

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add data-table
```

The project uses the **new-york** style with **neutral** base color.

---

## External Data Sources

| Source | Data | Documentation |
|--------|------|---------------|
| voter-api | All application data | `http://localhost:8000/docs` |
| US Census Bureau | Demographics, boundaries | [api.census.gov](https://api.census.gov/data.html) |
| GA Secretary of State | Voter registration, election results | [sos.ga.gov](https://sos.ga.gov/) |
| Congress.gov API | Federal elected officials | [api.congress.gov](https://api.congress.gov/) |
| Open States | State legislators | [openstates.org](https://openstates.org/) |
| OpenStreetMap | Map tiles | [openstreetmap.org](https://www.openstreetmap.org/) |

---

## References

- [Admin Types Guide](admin-types-guide.md) — TypeScript type definitions for admin features
- [voter-api Repository](https://github.com/CivicPulse/voter-api) — Backend API
- [Project Constitution](./../.specify/memory/constitution.md) — Non-negotiable engineering principles
