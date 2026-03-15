# Architecture

**Analysis Date:** 2026-03-13

## Pattern Overview

**Overall:** Client-side Single Page Application (SPA) with layered architecture separating concerns into API clients, state management, data fetching, components, and routes.

**Key Characteristics:**
- Vite-based React 19 SPA with TanStack Router (file-based routing)
- Centralized JWT-based authentication with token refresh flow
- TanStack Query for server state management and caching with automatic polling
- Zustand for lightweight client state (auth, geographic context)
- Geospatial-focused UI with React-Leaflet maps and Turf.js utilities
- Component-driven architecture with shadcn/ui for consistency
- Strong type safety with TypeScript strict mode

## Layers

**API Client Layer:**
- Purpose: Centralized HTTP communication with the voter-api backend
- Location: `src/api/`
- Contains: `client.ts` (ky HTTP client with JWT hooks), `auth.ts` (login/refresh), `voters.ts`, `lookup.ts`, `census.ts`, `sos-feed.ts`, `rate-limited-fetch.ts`
- Depends on: localStorage for JWT tokens, Zustand authStore for token refresh
- Used by: React hooks and components via TanStack Query

**State Management Layer:**
- Purpose: Persistent client state (authentication, user info, geographic navigation context)
- Location: `src/stores/`
- Contains: `authStore.ts` (Zustand store for auth state with login/logout/token refresh), `navigation-context.ts` (geographic context for pre-populating filters)
- Depends on: API client for auth operations, localStorage for token persistence
- Used by: Root layout (`__root.tsx`), admin components, route guards

**Data Fetching & Caching Layer:**
- Purpose: Server state management, automatic polling, and query invalidation
- Location: `src/lib/hooks/` and `src/lib/api/`
- Contains: Query wrappers (`use-active-elections.ts`, `use-election-detail.ts`, `use-race-results.ts`), API helper functions (`admin.ts`, `elections.ts`, `voters.ts`)
- Depends on: TanStack Query, API client layer
- Used by: Page components and feature-specific components

**Hooks Layer:**
- Purpose: Reusable geospatial, boundary, and slug resolution logic
- Location: `src/hooks/`
- Contains: Slug resolvers (`useDistrictSlugResolver.ts`, `useCountySlugResolver.ts`), boundary fetchers (`useBoundaryTypeGeoJSON.ts`), district verification (`useDistrictVerification.ts`), voter search (`useVoters.ts`)
- Depends on: API clients, TanStack Query
- Used by: Route components and feature components for data loading and URL resolution

**Utility & Business Logic Layer:**
- Purpose: Non-UI helper functions and algorithms
- Location: `src/lib/` (various files) and `src/lib/utils/`
- Contains: Slug generation (`slugs.ts`), state/FIPS code mappings (`states.ts`), color assignment (`candidate-colors.ts`, `provider-colors.ts`), validation (`auth-guards.ts`), formatters (`formatters.ts`), geo helpers (`geo.ts`), precinct data merging (`merge-precinct-data.ts`)
- Depends on: Turf.js for geometric operations
- Used by: Components and hooks

**Component Layer:**
- Purpose: UI rendering and user interaction
- Location: `src/components/` (feature components) and `src/components/ui/` (shadcn/ui base components)
- Contains: Feature components (`elections/`, `census/`), root-level components (`LayerBar.tsx`, `StateCountyMap.tsx`, `DistrictDetailContent.tsx`), UI primitives (shadcn/ui)
- Depends on: Hooks, utilities, React, shadcn/ui, Lucide icons, Recharts/React-Leaflet
- Used by: Route components

**Route Layer:**
- Purpose: URL-based navigation, search parameter validation, page composition
- Location: `src/routes/` (file-based with TanStack Router)
- Contains: Public routes (`index.tsx`, `elections.tsx`, `lookup.tsx`), authenticated routes (`voters.tsx`), admin routes (`admin/...`), legacy redirect routes (`$state.tsx`, `districts/`)
- Depends on: Components, hooks, state management, route guards
- Used by: Router at application bootstrap

## Data Flow

**Public Election Viewing Flow:**

1. User navigates to `/elections/$electionDate` or `/`
2. Route component loads via TanStack Router
3. Component queries `useActiveElections()` (TanStack Query hook)
4. Hook calls `getElections()` from `src/lib/api/elections.ts`
5. API function calls `publicApi.get("elections", {searchParams})` from `src/api/client.ts`
6. Response cached in TanStack Query (staleTime: 60s)
7. Component renders with data; TanStack Query handles loading/error states
8. UI displays results using shadcn/ui components and Recharts/Leaflet for visualization

**Authenticated Admin Flow:**

1. User logs in at `/login` with credentials
2. `login()` from `src/api/auth.ts` calls `authClient.post("auth/login")`
3. Tokens stored in localStorage, cached in `useAuthStore` (Zustand)
4. Root layout checks `useAuthStore.isAuthenticated` to render admin nav
5. Admin routes use `requireAuth()` or `requireRole()` guards in `beforeLoad`
6. Accessing `/admin/*` route uses `useUserRole()` hook for RBAC
7. Admin pages use `useAdminUsers()`, `useImportJobs()`, etc. (TanStack Query hooks)
8. Hooks call API functions from `src/lib/api/admin.ts`
9. All requests auto-attach JWT via `api` client's `beforeRequest` hook
10. 401 responses trigger token refresh; 403 clears role and redirects

**Geospatial Route Resolution Flow:**

1. User navigates to `/districts/$state/$county/$type/$name` (e.g., `/districts/ga/bibb/county-commission/005`)
2. Route component calls `useDistrictSlugResolverScoped(state, county, type, name)`
3. Hook queries `useDistrictCheck()` which fetches district details
4. Hook resolves `boundary_identifier` to districtId
5. Component renders `DistrictDetailContent` with districtId
6. Detail component loads overlay GeoJSON via `useBoundaryTypeGeoJSON(type, countyId)`
7. Static GeoJSON files served from `public/geojson/` (pre-fetched during build)
8. React-Leaflet renders map with boundary overlays
9. Double-click on district updates geographic navigation context (Zustand store)

**State Management:**

- Auth state: Persisted in Zustand (`accessToken`, `refreshToken`, `user`, `isAuthenticated`)
- Server state: Managed by TanStack Query (elections, voters, boundaries, etc.)
- UI state: Local component state (tabs, filters, form inputs)
- Geographic context: Zustand store (`stateAbbrev`, `countyName`) pre-populates voter/election filters

## Key Abstractions

**API Client:**
- Purpose: Encapsulates HTTP communication with retry logic, auth, and error handling
- Examples: `src/api/client.ts` (`api` and `publicApi` instances), `src/api/rate-limited-fetch.ts`
- Pattern: Ky HTTP client with hooks for JWT injection, token refresh, and error interception. Two variants: `api` (authenticated, redirects on 401) and `publicApi` (opportunistic auth, no redirect)

**Route Slug Resolvers:**
- Purpose: Convert user-friendly URL slugs to backend IDs
- Examples: `useDistrictSlugResolver.ts`, `useCountySlugResolver.ts`, `useDistrictSlugResolverScoped.ts`
- Pattern: Hooks that query boundary data and perform name matching with normalization (lowercasing, dash collapsing, leading-zero removal)

**TanStack Query Hooks:**
- Purpose: Wrap API calls with caching, auto-polling, and loading/error states
- Examples: `useActiveElections()`, `useRaceResults()`, `useImportJobs()`, `useAdminUsers()`
- Pattern: Consistent `{ data, isLoading, error, dataUpdatedAt }` return; auto-polling for long-running jobs (imports/exports); staleTime varies by use case (60s for elections, 5min for users, 3s polling when active)

**Boundary Type Fetching:**
- Purpose: Load GeoJSON boundary overlays for map visualization
- Examples: `useBoundaryTypeGeoJSON()` hook, static files from `public/geojson/`
- Pattern: Query boundary metadata → determine available types → load static GeoJSON or API response

**Authentication Guards:**
- Purpose: Route-level access control
- Examples: `requireAuth()`, `requireRole()` from `src/lib/auth-guards.ts`
- Pattern: Check `useAuthStore.getState()` and throw `redirect()` if unauthorized; use in route `beforeLoad`

## Entry Points

**Application Root:**
- Location: `src/main.tsx`
- Triggers: Browser load
- Responsibilities: Initialize QueryClient, create TanStack Router, wrap app with QueryClientProvider/TooltipProvider, render root route

**Root Route Layout:**
- Location: `src/routes/__root.tsx`
- Triggers: Application bootstrap
- Responsibilities: Render header/navigation based on auth state, admin nav (conditionally), mobile nav, TanStackRouterDevtools, Outlet for nested routes; initialize auth state on mount

**Public Home Page:**
- Location: `src/routes/index.tsx`
- Triggers: User navigates to `/` or default state auto-navigation
- Responsibilities: Show state selection (if multi-state) or default state map with counties/overlays; render active election indicators, elected officials card, census profile

**Admin Layout:**
- Location: `src/routes/admin.tsx`
- Triggers: User navigates to `/admin/*`
- Responsibilities: Check user role; show error if not admin/analyst; render admin subnav and Outlet for admin pages

**Election Detail Page:**
- Location: `src/components/elections/ElectionDetailPage.tsx` (wrapped by `src/routes/elections/$electionDate.tsx`)
- Triggers: User navigates to `/elections/{id}` or `/elections/{date}/{id}`
- Responsibilities: Fetch race results and candidates; render tabs (info, results, participation); manage map view (county/precinct); handle live updates and sound notifications

## Error Handling

**Strategy:** Layered error handling with user-friendly feedback via toast notifications and error boundaries.

**Patterns:**

- **API Client Errors:** `src/api/client.ts` intercepts 401 (triggers token refresh/logout) and 403 (throws `PermissionError`). `rate-limited-fetch.ts` handles retry logic with exponential backoff.
- **Route-Level Errors:** Routes catch redirect errors in `beforeLoad`; slug resolvers return `isNotFound` flag.
- **Component Errors:** Error boundaries catch React errors; display fallback UI with retry button (e.g., `AdminErrorBoundary`).
- **Data Fetching Errors:** TanStack Query hooks return `error` state; components render alert UI (e.g., `ElectionErrorBoundary`).
- **Admin Errors:** `PermissionErrorComponent` handles 401/403; `AdminErrorBoundary` catches runtime errors; all mutations show toast feedback.
- **Validation Errors:** Zod schemas validate search params in routes (`validateSearch`); form errors via React Hook Form + Zod in admin forms.

## Cross-Cutting Concerns

**Logging:** Uses `console` (no logging framework); sparse INFO-level logs in critical paths (token refresh, imports/exports); error console output for debugging.

**Validation:**
- Route search params: Zod schemas in `validateSearch` (e.g., `homeSearchSchema` in `index.tsx`)
- Form inputs: React Hook Form + Zod in admin forms (`src/lib/schemas/`)
- API responses: TypeScript interfaces (no runtime validation)

**Authentication:**
- JWT Bearer tokens in `Authorization` header (injected by `api` client)
- Refresh flow: On 401, fetch new tokens via `refreshTokens()` and retry original request
- Logout: Clear localStorage and Zustand state; redirect to `/login`
- Role-based access: Check `user.role` in admin components; route guards with `requireRole()`

**Caching:**
- TanStack Query: Configurable staleTime per query (60s elections, 5min users, 3s polling for active jobs)
- Static GeoJSON: Versioned files in `public/geojson/`, fetched at build time, served with 200 status in `_redirects`
- localStorage: Auth tokens, user preferences (not yet implemented in this codebase)

---

*Architecture analysis: 2026-03-13*
