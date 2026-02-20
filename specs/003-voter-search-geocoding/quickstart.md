# Quickstart: Voter Search & Geocoding

**Feature Branch**: `003-voter-search-geocoding`
**Date**: 2026-02-18

## Prerequisites

- Node.js LTS (use `nvm use` — reads `.nvmrc`)
- voter-api backend running at `http://localhost:8000` (or configure `VITE_API_BASE_URL` in `.env`)
- `.env` file configured (copy from `.env.example` if needed)

## Setup

```bash
# Switch to the feature branch
git checkout 003-voter-search-geocoding

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

## Key Files to Create

### 1. Types (`src/types/voter.ts`)

Define `VoterSummary`, `VoterDetail`, `VoterSearchResponse`, `VoterFilterOptions`, `VoterSearchParams`, and supporting types. See [contracts/voter-api.md](contracts/voter-api.md) for full type definitions.

### 2. API Functions (`src/api/voters.ts`)

Wrap the backend endpoints using the shared `ky` client from `@/api/client`:

- `searchVoters(params)` → `GET /voters`
- `getVoterDetail(voterId)` → `GET /voters/{voterId}`
- `getVoterFilters()` → `GET /voters/filters`
- `triggerVoterGeocode(voterId)` → `POST /voters/{voterId}/geocode`
- `deleteGeocodedLocation(voterId, locationId)` → `DELETE /voters/{voterId}/geocoded-locations/{locationId}`

### 3. Hooks (`src/hooks/useVoters.ts`)

TanStack Query hooks following existing patterns:

- `useVoterSearch(params)` — paginated query with search params as query key
- `useVoterDetail(voterId)` — detail query with enabled guard
- `useVoterFilters()` — filter options query (long cache, infrequent change)
- `useTriggerGeocode(voterId)` — mutation that invalidates locations
- `useDeleteGeocodedLocation(voterId)` — mutation that invalidates locations

### 4. Routes

| File | Route | Purpose |
|------|-------|---------|
| `src/routes/voters.tsx` | `/voters` layout | Auth guard, shared layout |
| `src/routes/voters/index.tsx` | `/voters` | Search page with URL search params |
| `src/routes/voters/$voterId.tsx` | `/voters/{id}` | Voter detail page |

### 5. Components (`src/routes/voters/_components/`)

| Component | Purpose |
|-----------|---------|
| `VoterSearchFilters.tsx` | County, status, and cascade district filter controls |
| `VoterTable.tsx` | Sortable, paginated results table |
| `VoterRegistrationCard.tsx` | Registration info display card |
| `GeocodedLocationsCard.tsx` | Location list with Set Official / Remove actions |
| `GeocodedLocationMap.tsx` | Leaflet map with pins for all locations |
| `DistrictAssignmentsCard.tsx` | District list organized by type |

### 6. Navigation Update (`src/routes/__root.tsx`)

Add a "Voters" link to both desktop and mobile navigation, visible to all authenticated users.

## Build Order

Recommended implementation sequence:

1. **Types & API** — `src/types/voter.ts` + `src/api/voters.ts` (foundation)
2. **Hooks** — `src/hooks/useVoters.ts` (data layer)
3. **Navigation** — Add "Voters" nav item to `__root.tsx`
4. **Voters layout** — `src/routes/voters.tsx` (auth guard)
5. **Search page** — `src/routes/voters/index.tsx` with `VoterSearchFilters` + `VoterTable`
6. **Detail page (read-only)** — `src/routes/voters/$voterId.tsx` with `VoterRegistrationCard` + `DistrictAssignmentsCard`
7. **Geocoded locations** — `GeocodedLocationsCard` + `GeocodedLocationMap`
8. **Geocoding actions** — Trigger geocode, set official, delete (admin/analyst only)
9. **Tests** — Unit tests for each component/hook/API function; E2E for critical flows

## Testing

```bash
# Unit tests (watch mode)
npm test

# Unit tests (single run with coverage)
npm test -- --run --coverage

# E2E tests (requires build first)
npm run build && npm run test:e2e

# Lint
npm run lint
```

## Patterns to Follow

- **Imports**: Always use `@/` path alias
- **Search params**: Zod schema with `.coerce` and `.catch()` for optional params
- **Auth guard**: `beforeLoad: ({ location }) => { requireAuth(location.pathname) }`
- **Role check**: `useUserRole()` → check `.data?.role` for admin/analyst
- **Toasts**: `toast.success()` / `toast.error()` from Sonner
- **Query keys**: `["voters", "search", params]`, `["voters", voterId]`, `["voters", "filters"]`
- **Invalidation**: After mutations, invalidate relevant query keys
- **Loading**: `Loader2` spinner from Lucide with `animate-spin`
- **Empty state**: Descriptive message with suggestion to adjust search/filters
