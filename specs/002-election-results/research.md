# Research: Live Election Results Visualization

**Feature**: `002-election-results` | **Date**: 2026-02-15

## Research Topics

### 1. Multi-Race Election Model vs. Backend API Architecture

**Context**: The spec calls for "multiple races per election" (e.g., a Nov 2024 General election containing US Senate, State House, etc. as child races). Investigation of the voter-api backend revealed the actual API architecture.

**Finding**: The voter-api backend uses a **single-race-per-election model**. Each API `Election` record represents one race/contest (e.g., "State Senate District 18 Special"). There is no parent "election event" entity with child races.

**Evidence**:

- `Election` model in voter-api has fields: `name`, `election_date`, `election_type`, `district`, `data_source_url` — the `district` field identifies the specific race
- `ElectionResultsResponse` contains a flat `candidates` array and `county_results` array, not nested by race
- The voter-api spec states: "The data source provides a single JSON file per race/contest"
- The API supports "multiple simultaneous active elections" as separate records on the same date

**Decision**: Implement a **frontend grouping layer** that presents the API's flat election list as grouped "election events."

- The API's `Election` entity = the spec's `Race` entity
- An "Election Event" is a frontend construct: all API elections sharing the same `election_date` and `election_type` form one group
- This requires NO backend changes while fully satisfying the spec's navigation hierarchy

**URL Mapping**:

| Spec Concept | URL | Data Source |
| ------------ | --- | ----------- |
| Elections list (event groups) | `/elections` | `GET /elections` → group by date |
| Race list within event | `/elections/$electionDate` | `GET /elections?date_from=X&date_to=X` |
| Race results (map + drawer) | `/elections/$electionDate/$electionId` | `GET /elections/{id}/results` |

**Rationale**: Avoids backend changes, uses existing API capabilities (date filtering), provides the multi-race UX the spec requires.

**Alternatives Considered**:

1. **Backend enhancement** (add Race entity): Correct long-term solution but requires voter-api changes, out of scope for this frontend feature
2. **Flat list (no grouping)**: Simpler but doesn't match the spec's multi-race election UX
3. **Client-side virtual IDs**: Generate composite IDs for election events (e.g., `2026-02-17_special`). Fragile and not URL-friendly. Using `$electionDate` as a path segment is cleaner.

---

### 2. Election Event Grouping Strategy

**Context**: Since election events are a frontend construct, we need a consistent way to group and identify them.

**Decision**: Group elections by `election_date` (ISO date string). Each unique date becomes an "election event." The route parameter `$electionDate` uses the ISO date format (e.g., `2026-02-17`).

**Implementation Details**:

- The elections list page fetches all elections via `GET /elections` (with pagination/filtering)
- Client-side grouping: `Map<string, Election[]>` keyed by `election_date`
- Each group is displayed as an "election event" card showing: date, election type(s), number of races, overall reporting progress
- Clicking an event navigates to `/elections/2026-02-17` which re-fetches filtered by date
- On the race list page, each API election is displayed as a "race" showing: name, district, candidates, reporting progress
- Race search + category filter operates on this filtered list client-side

**Considerations**:

- If multiple election types occur on the same date (unlikely but possible), they'll appear as separate event groups, or the type can be included in the URL: `/elections/$electionDate/$electionType`
- For simplicity, start with date-only grouping. If multiple types appear on the same day, they're shown together as one event.

---

### 3. Choropleth Map Strategy for Election Results

**Context**: The feature requires choropleth county maps colored by race results, with multiple data layers (leading candidate, precincts reporting %, total votes).

**Finding**: The existing codebase uses React-Leaflet with GeoJSON overlays (`OverlayLayer.tsx`) and a static colorblind-friendly palette. The election map has different requirements — it needs dynamic coloring based on data values.

**Decision**: Create a new `ElectionResultsMap` component that extends the existing Leaflet patterns but uses data-driven styling.

**Color Strategies by Layer**:

- **Leading Candidate**: Political party colors (red for Republican, blue for Democrat, green/gold/gray for others). Each county colored by the party of the candidate with the most votes.
- **Precincts Reporting %**: Sequential color scale (e.g., light-to-dark single hue). 0% = lightest, 100% = darkest. Using a yellow-to-green or white-to-blue scale.
- **Total Votes Cast**: Sequential color scale based on percentile bins across counties. Avoids large counties dominating.

**GeoJSON Integration**:

- County GeoJSON: Use existing `useCountyBoundaries()` hook for geometry, JOIN with results data by county name matching
- Precinct GeoJSON: Use API endpoint `GET /elections/{id}/results/geojson/precincts?county=X` with county filter for on-demand loading
- County results GeoJSON: API provides `GET /elections/{id}/results/geojson` with embedded result properties

**Rationale**: Leverages existing Leaflet infrastructure. Data-driven styling is standard Leaflet GeoJSON practice. Joining county boundaries with results data avoids duplicating geometry.

---

### 4. Test Infrastructure Readiness

**Context**: Constitution requires 95% unit test coverage. Investigation needed to confirm test setup completeness.

**Finding**: The project has a **complete Vitest configuration** ready to use:

- `vitest.config.ts` with jsdom environment, globals, CSS support, path aliases
- Test setup file (`src/test/setup.ts`) with jest-dom matchers and DOM mocks (matchMedia, IntersectionObserver)
- All testing libraries installed: `@testing-library/react@16.3.2`, `@testing-library/jest-dom@6.9.1`, `@testing-library/user-event@14.6.1`, `jsdom@28.0.0`
- Coverage thresholds set to 95% for lines, functions, branches, statements
- Test scripts configured: `npm test`, `npm run test:coverage`
- 1 existing test file: `src/lib/utils/__tests__/cn.test.ts`

**Gaps Identified**:

1. **No TanStack Query test wrapper**: Need a custom render function that wraps components with `QueryClientProvider`
2. **No TanStack Router test wrapper**: Need a test router mock for route-dependent components
3. **No MSW (Mock Service Worker)**: Not installed. Useful for API mocking but not strictly required — can use Vitest mocks instead
4. **No component tests**: Only 1 utility test exists

**Decision**: Create shared test utilities as the first implementation task:

- `src/test/render.tsx`: Custom render function wrapping with QueryClientProvider + RouterProvider
- `src/test/mocks/elections.ts`: Mock data factories for election/race/result types
- Use Vitest `vi.mock()` for API client mocking (no MSW needed initially)

**Rationale**: The test infrastructure is nearly complete. A small set of test utilities will enable full component and hook testing without adding new dependencies.

---

### 5. Auto-Refresh Pattern for Election Results

**Context**: The spec requires live auto-refresh during active elections. The codebase already has an auto-polling pattern in the admin import/export hooks.

**Finding**: The existing auto-polling pattern uses TanStack Query's `refetchInterval` with a dynamic function:

```typescript
refetchInterval: (query) => {
  const jobs = query.state.data?.jobs ?? []
  const hasActiveJobs = jobs.some(isActiveJob)
  return hasActiveJobs ? 3000 : false
}
```

**Decision**: Adapt this pattern for election results:

- Use the election's `refresh_interval_seconds` field (minimum 60s) as the polling interval
- Poll only when election status is `active`
- Stop polling when status becomes `finalized`
- On network errors during polling: show warning toast once, continue with stale data
- Include `last_refreshed_at` in the query response for the live status indicator

**Implementation**:

```typescript
refetchInterval: (query) => {
  const election = query.state.data
  if (!election || election.status !== "active") return false
  return election.refresh_interval_seconds * 1000
}
```

**Rationale**: Directly reuses the proven TanStack Query polling pattern with election-specific logic.

---

### 6. Admin Election Management Pattern

**Context**: Admin CRUD follows established patterns (users, imports, exports). Need to confirm alignment.

**Finding**: The existing admin patterns are consistent:

- Route structure: `src/routes/admin/[feature]/index.tsx` with `_components/` for sub-components
- Hooks: Query + mutation hooks in `src/lib/hooks/`
- API: Typed wrapper functions in `src/lib/api/admin.ts`
- Types: Comprehensive types in `src/types/admin.ts`
- Error handling: `AuthenticationError`, `PermissionError`, `NetworkError` with toast notifications
- Two-step confirmation: Dialog → Confirmation dialog → API call

**Decision**: Follow the exact same patterns for admin election management:

- Add election CRUD functions to a new `src/lib/api/elections.ts` file (both public and admin endpoints)
- Create hooks in `src/lib/hooks/use-admin-elections.ts`
- Add types to `src/types/elections.ts`
- Use the same error handling, toast, and confirmation patterns

**Rationale**: Consistency with existing patterns reduces cognitive load and ensures the same error handling, caching, and UX standards apply.

---

## Summary of Decisions

| Topic | Decision | Impact |
| ----- | -------- | ------ |
| Multi-race model | Frontend grouping by `election_date` over API's single-race elections | URL structure uses `$electionDate/$electionId`; no backend changes needed |
| Event grouping | Group by ISO date string | Simple, deterministic, URL-friendly |
| Choropleth map | Data-driven Leaflet GeoJSON styling, join county boundaries with results | New component, reuses existing map infrastructure |
| Test infrastructure | Create test utilities (render wrapper, mock factories) | First implementation task before feature code |
| Auto-refresh | TanStack Query `refetchInterval` with election-specific logic | Reuses proven polling pattern |
| Admin management | Follow existing admin patterns exactly | Consistent with users/imports/exports |
