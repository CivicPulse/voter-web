# Architecture Patterns

**Domain:** Advanced filter/search system for election discovery in React SPA
**Researched:** 2026-03-13

## Recommended Architecture

The system has three logical layers and one cross-cutting concern:

```
URL Search Params (Zod schema via validateSearch)
        |
        v
 Filter UI Components (read params, navigate to update)
        |
        v
 Data Fetching Layer (TanStack Query, queryKey = params)
        |
        v
 API Client (ky, builds searchParams from filter state)

 Cross-cutting: Feature Detection (probes API capabilities, controls filter visibility)
```

### Why This Architecture

The codebase already has **two competing patterns** for filter state:

1. **Zustand store** (elections list) -- `useElectionFilters` in `src/lib/hooks/use-election-filters.ts`. Filters live in memory, lost on refresh, not shareable via URL.
2. **URL search params** (voters list, participant list) -- Zod schema in `validateSearch`, `Route.useSearch()`, `navigate({ search })`. Filters survive refresh, are bookmarkable, and support browser back/forward.

The voters/participant pattern is the correct one. The elections list must migrate to URL search params to match the rest of the codebase and satisfy the project's requirements (1,000+ races means users need shareable filtered views).

**This is not a new architecture -- it is extending the established voter search pattern to the elections domain.**

---

## Component Boundaries

| Component | Responsibility | Communicates With | Location |
|-----------|---------------|-------------------|----------|
| **Route definition** (`elections/index.tsx`) | Declares Zod search schema via `validateSearch`; provides `Route.useSearch()` | Filter Bar, Data Hook | `src/routes/elections/index.tsx` |
| **Election Filter Bar** | Reads search params, renders filter controls, navigates on change | Route (reads params), Router (navigate to update) | `src/routes/elections/_components/election-filter-bar.tsx` |
| **Search Input** (debounced) | Text input with 300ms debounce before URL update | Filter Bar (embedded), Router (navigate) | Part of Filter Bar or extracted component |
| **useElections hook** | Accepts filter params, builds TanStack Query with params as queryKey | API client, Route (receives params) | `src/lib/hooks/use-elections.ts` |
| **API client** (`getElections`) | Translates filter object to HTTP query params, calls API | Backend API | `src/lib/api/elections.ts` |
| **Feature Detection hook** | Probes API for support of new params, caches result, exposes capability flags | API client, Filter Bar (controls visibility) | `src/lib/hooks/use-api-capabilities.ts` (new) |
| **Pagination controls** | Reads `page` from search params, navigates to update | Route, Router | Part of elections list page |
| **Active filter summary / clear** | Shows active filter count/badges, provides "clear all" | Route (reads params), Router (navigate to reset) | Part of Filter Bar or standalone |

### Component Diagram

```
elections/index.tsx (Route)
  |-- validateSearch: electionSearchSchema (Zod)
  |-- Route.useSearch() -> params
  |
  |-- <ElectionFilterBar params={params} capabilities={capabilities} />
  |     |-- Search input (debounced, updates URL)
  |     |-- Status select
  |     |-- Election type select
  |     |-- Date range (date_from / date_to)
  |     |-- Registration open toggle
  |     |-- Early voting active toggle
  |     |-- [Feature-detected] Server search (q param)
  |     |-- [Feature-detected] Race category select
  |     |-- [Feature-detected] District filter
  |     |-- [Feature-detected] County filter
  |     |-- [Feature-detected] Election date exact filter
  |     |-- Active filter badges / Clear all button
  |
  |-- useElections(params, page) -> { data, isLoading, error }
  |     |-- queryKey: ["elections", "list", params, page]
  |     |-- calls getElections(params)
  |
  |-- useApiCapabilities() -> { serverSearch, raceCategory, ... }
  |     |-- queryKey: ["api", "capabilities", "elections"]
  |     |-- one-time probe on mount, cached indefinitely
  |
  |-- <ElectionList elections={data.elections} />
  |-- <Pagination page={params.page} totalPages={data.total_pages} />
```

---

## Data Flow

### Filter Update Cycle (single direction, no loops)

```
User changes filter control
       |
       v
navigate({ search: (prev) => ({ ...prev, status: "active", page: 1 }) })
       |
       v
TanStack Router updates URL, validates via Zod schema
       |
       v
Route.useSearch() returns new params (component re-renders)
       |
       v
useElections(newParams) -- queryKey changes, TanStack Query refetches
       |
       v
API response -> UI updates
```

**Key principle:** Data flows in one direction. URL is the single source of truth. No Zustand store for filter state. Filter components are controlled by URL params and write back via `navigate()`.

### Debounced Text Search Flow

```
User types in search input
       |
       v
Local state tracks keystroke (instant feedback in input)
       |
       v
setTimeout(300ms) -- debounce
       |
       v
navigate({ search: (prev) => ({ ...prev, q: trimmedValue, page: 1 }) })
       |
       v
(same cycle as above)
```

The debounce is necessary to avoid URL churn and excessive API calls on every keystroke. The existing voter search uses this exact pattern (see `VoterSearchFilters.tsx` lines 68-84).

### Feature Detection Flow

```
App mounts / elections page loads
       |
       v
useApiCapabilities() fires probe query (once, cached forever)
       |
       v
Probe: call getElections({ q: "__probe__" }) or similar
       |
       v
If API returns filtered results (not full list) -> "q" is supported
If API returns same as without param / errors -> "q" not supported
       |
       v
capabilities: { serverSearch: true/false, raceCategory: true/false, ... }
       |
       v
Filter Bar conditionally renders feature-detected filters
```

---

## Patterns to Follow

### Pattern 1: Zod Schema as Single Source of Truth

**What:** Define the complete filter state as a Zod schema in the route's `validateSearch`. All filter reading and writing goes through the router.

**When:** Always -- for every filterable list page.

**Why:** The voters page already does this successfully. It eliminates the Zustand store (one less abstraction), enables shareable URLs, survives page refresh, and gets free browser history navigation.

**Example:**

```typescript
// Route definition
const electionSearchSchema = z.object({
  status: z.enum(["all", "active", "finalized"]).optional().catch(undefined),
  election_type: z.enum(["all", "general", "primary", "special", "runoff"]).optional().catch(undefined),
  date_from: z.string().optional().catch(undefined),
  date_to: z.string().optional().catch(undefined),
  registration_open: z.literal("true").optional().catch(undefined),
  early_voting_active: z.literal("true").optional().catch(undefined),
  q: z.string().optional().catch(undefined),
  race_category: z.enum(["all", "federal", "state_senate", "state_house", "local"]).optional().catch(undefined),
  page: z.coerce.number().int().positive().optional().catch(undefined),
})

export const Route = createFileRoute("/elections/")({
  component: ElectionsListPage,
  validateSearch: electionSearchSchema,
})
```

**Critical detail:** Use `.optional().catch(undefined)` on every field, not `.default()`. This prevents showing validation errors to users when they manually edit the URL or arrive via a stale link. The `.catch()` modifier silently falls back to the catch value.

### Pattern 2: Navigate with Functional Updater

**What:** Update search params using the functional form of `navigate({ search: (prev) => ... })` to preserve other params.

**When:** Any time a single filter changes.

**Example:**

```typescript
const navigate = useNavigate()
const params = Route.useSearch()

const updateFilter = (updates: Partial<typeof params>) => {
  navigate({
    to: "/elections",
    search: (prev) => ({
      ...prev,
      ...updates,
      page: 1, // Always reset page when filters change
    }),
    replace: true, // Replace history entry for filter changes
  })
}
```

**Why `replace: true`:** Filter changes should replace the history entry, not push. Users expect Back to go to the previous page, not undo each filter tweak. The voters page already uses this pattern.

### Pattern 3: Query Key Includes Filter Params

**What:** TanStack Query's `queryKey` must include the filter params so it refetches when filters change.

**When:** Every data-fetching hook driven by filters.

**Example:**

```typescript
export function useElections(params: ElectionSearchParams, page = 1) {
  return useQuery({
    queryKey: ["elections", "list", params, page],
    queryFn: () => getElections({ ...params, page }),
    staleTime: 30_000,
  })
}
```

**Why this works:** When `params` changes (because URL changed), the queryKey changes, TanStack Query treats it as a new query and fetches fresh data. Previous results stay in cache for instant back-navigation.

### Pattern 4: API Client Strips Sentinel Values

**What:** The API client function converts the filter object to HTTP query params, skipping `undefined`, `"all"`, and empty strings.

**When:** In every API client function that accepts filters.

**Example:**

```typescript
export async function getElections(params?: ElectionSearchParams & { page?: number; page_size?: number }) {
  const searchParams: Record<string, string> = {}

  if (params?.status && params.status !== "all") searchParams.status = params.status
  if (params?.election_type && params.election_type !== "all") searchParams.election_type = params.election_type
  if (params?.date_from) searchParams.date_from = params.date_from
  if (params?.date_to) searchParams.date_to = params.date_to
  if (params?.registration_open === "true") searchParams.registration_open = "true"
  if (params?.early_voting_active === "true") searchParams.early_voting_active = "true"
  if (params?.q) searchParams.q = params.q
  if (params?.page) searchParams.page = String(params.page)
  // ... etc

  const raw = await api.get("elections", { searchParams }).json<RawElectionListResponse>()
  // ...
}
```

**This pattern already exists** in the current `getElections()` function. The migration adds more params but the structure is identical.

### Pattern 5: Feature Detection via Probe Query

**What:** On first load, make a probe API call with an unknown parameter. If the API response differs from the baseline (or doesn't error), the feature is supported. Cache the result indefinitely.

**When:** For API parameters that may or may not be supported (Phase 2 filters: `q`, `race_category`, `district`, `county`, `election_date`).

**Example:**

```typescript
interface ApiCapabilities {
  serverSearch: boolean       // API supports ?q= param
  raceCategory: boolean       // API supports ?race_category= param
  districtFilter: boolean     // API supports ?district= param
  countyFilter: boolean       // API supports ?county= param
  electionDate: boolean       // API supports ?election_date= param
}

export function useApiCapabilities(): ApiCapabilities {
  const { data } = useQuery({
    queryKey: ["api", "capabilities", "elections"],
    queryFn: async () => {
      // Probe: fetch with a known-unused search term
      // If API filters by it, it supports server search
      // If API ignores it, results match unfiltered
      const [baseline, probed] = await Promise.all([
        getElections({ page_size: 1 }),
        getElections({ q: "__capability_probe__", page_size: 1 }),
      ])

      const serverSearch = probed.total < baseline.total // Fewer results = API filtered
      // Similar probes for other params...

      return { serverSearch, raceCategory: false, districtFilter: false, countyFilter: false, electionDate: false }
    },
    staleTime: Infinity, // Probe once per session
    gcTime: Infinity,
  })

  return data ?? { serverSearch: false, raceCategory: false, districtFilter: false, countyFilter: false, electionDate: false }
}
```

**Important:** The probe approach has a subtle risk -- it makes extra API calls. An alternative is to check for a specific response header or version endpoint. The probe approach is pragmatic when the backend team is separate and you can't coordinate a capability endpoint. See Pitfalls for more discussion.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Zustand Store for URL-Derived State

**What:** Using a Zustand store (or React state) to hold filter values that should live in the URL.

**Why bad:** The current `useElectionFilters` Zustand store causes: (1) filters lost on page refresh, (2) un-shareable filtered views, (3) browser back button doesn't undo filter changes, (4) two sources of truth (store vs URL for `page`).

**Instead:** Use `validateSearch` + `Route.useSearch()` + `navigate()`. Delete the `useElectionFilters` Zustand store once migration is complete.

### Anti-Pattern 2: Client-Side Filtering of Paginated Data

**What:** The current elections page fetches 25 items, then filters them client-side with `deferredSearch`. This only searches the current page, not all 1,000+ races.

**Why bad:** Users think they're searching all elections but they're only searching 25. Completely misleading for a dataset with 1,000+ items.

**Instead:** For Phase 1 (no server search), remove the misleading client-side search entirely or clearly label it "Filter this page only." For Phase 2, replace with server-side `q` parameter.

### Anti-Pattern 3: Inline `page` State Alongside URL Filters

**What:** The current elections page stores `page` in `useState` while filters are in Zustand. Two separate state locations for logically-coupled state.

**Why bad:** Page and filters are tightly coupled (changing a filter should reset page to 1). Splitting them across state managers creates synchronization bugs.

**Instead:** Put `page` in the URL search params alongside filters. The voter search page already does this correctly.

### Anti-Pattern 4: Probing on Every Render

**What:** Running the feature-detection probe inside the main data query or on every filter change.

**Why bad:** Doubles API calls on every interaction. API capabilities don't change during a session.

**Instead:** Probe once on mount with `staleTime: Infinity`. Cache the result for the entire session.

---

## Migration Path: Zustand to URL Search Params

The elections list currently uses Pattern A (Zustand). It must migrate to Pattern B (URL).

### What Changes

| Concern | Before (Zustand) | After (URL) |
|---------|------------------|-------------|
| Filter state location | `useElectionFilters` store | URL search params via `validateSearch` |
| Reading filters | `const { electionFilters } = useElectionFilters()` | `const params = Route.useSearch()` |
| Updating filters | `setElectionFilters({ status: "active" })` | `navigate({ search: (prev) => ({ ...prev, status: "active", page: 1 }) })` |
| Page state | `useState(page)` | `params.page` from URL |
| Search text | `electionFilters.search` (client-side) | `params.q` (server-side when available, hidden when not) |
| Reset all | `resetElectionFilters()` | `navigate({ to: "/elections", search: {} })` |
| Survive refresh | No | Yes |
| Shareable link | No | Yes |

### What Stays the Same

- `useElections(params, page)` hook -- already accepts params, just receives them from URL instead of store
- `getElections()` API client -- same structure, adds more params
- UI components (Select, Input, Badge) -- same shadcn/ui components, just wired to URL instead of store
- TanStack Query caching -- same queryKey pattern

### Files Affected

1. `src/routes/elections/index.tsx` -- Add `validateSearch` schema, replace `useElectionFilters()` with `Route.useSearch()`
2. `src/lib/hooks/use-election-filters.ts` -- Delete or reduce to only `raceFilters` (used separately in race list within election event page)
3. `src/lib/hooks/use-elections.ts` -- Minor: accept URL-shaped params instead of `ElectionFilters`
4. `src/lib/api/elections.ts` -- Add new params to `getElections()`
5. `src/types/elections.ts` -- Update `ElectionFilters` type or create new URL-specific type

---

## Feature-Detection Architecture (Deep Dive)

### Strategy: Probe with Fallback

Feature detection is the hardest architectural decision in this project. Three approaches exist:

**Option A: Probe query (recommended)**

Make a test API call with the new param. Compare against a baseline call. If results differ, the param is active.

- Pro: Works without backend coordination. Ships independently.
- Con: Extra API calls on first load. Risk of false negatives if probe term matches nothing.
- Mitigation: Run probes in parallel with `Promise.all`. Use `staleTime: Infinity` to probe once per session.

**Option B: API version/capabilities endpoint**

Ask the backend team to expose `GET /api/v1/capabilities` listing supported params.

- Pro: Definitive answer. No extra data queries.
- Con: Requires backend coordination. Defeats the purpose of shipping UI ahead of API.

**Option C: Try-and-observe on first real query**

Send the param with the first real query. If the response includes a `filters_applied` field or the total count is reasonable, the param works.

- Pro: No extra calls. No backend coordination.
- Con: Can't distinguish "param ignored" from "param accepted but matched everything."

**Recommendation: Start with Option A (probe), document a request for Option B.** The probe approach lets the UI ship independently. When the backend adds a capabilities endpoint, switch to it.

### Capability State Shape

```typescript
interface ElectionApiCapabilities {
  // Phase 1 filters (always available)
  status: true
  election_type: true
  date_from: true
  date_to: true
  registration_open: true
  early_voting_active: true

  // Phase 2 filters (feature-detected)
  q: boolean          // Server-side text search
  race_category: boolean
  district: boolean
  county: boolean
  election_date: boolean
}
```

### Filter Bar Integration

```typescript
function ElectionFilterBar({ params, capabilities }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {/* Always visible: Phase 1 filters */}
      <StatusSelect value={params.status} onChange={...} />
      <TypeSelect value={params.election_type} onChange={...} />
      <DateRangeFilter from={params.date_from} to={params.date_to} onChange={...} />
      <ToggleFilter label="Registration Open" value={params.registration_open} onChange={...} />
      <ToggleFilter label="Early Voting" value={params.early_voting_active} onChange={...} />

      {/* Conditionally visible: Phase 2 filters */}
      {capabilities.q && (
        <SearchInput value={params.q} onChange={...} />
      )}
      {capabilities.race_category && (
        <RaceCategorySelect value={params.race_category} onChange={...} />
      )}
      {capabilities.county && (
        <CountySelect value={params.county} onChange={...} />
      )}
      {/* etc. */}
    </div>
  )
}
```

---

## Scalability Considerations

| Concern | Current (< 100 races) | At 1K+ races | At 10K+ races |
|---------|------------------------|--------------|---------------|
| Client-side search | Works (searches 25 items) | Misleading (searches 25 of 1K+) | Broken |
| Pagination (25/page) | 4 pages, manageable | 40+ pages, needs filters | 400+ pages, must have server search |
| Filter state in Zustand | Tolerable | Fragile (no bookmarks) | Unacceptable |
| Filter state in URL | Slightly more work | Bookmarkable filtered views | Same, scales naturally |
| Feature detection probes | 2 extra API calls | Same (one-time) | Same (one-time) |
| TanStack Query cache | Trivial | ~40 cached pages, OK | Configure gcTime/staleTime |

---

## Suggested Build Order

Based on dependency analysis:

### Phase 1: URL Migration (no API changes needed)

**Build order within Phase 1:**

1. **Zod schema + validateSearch** -- Foundation. Define `electionSearchSchema` in route. Everything else depends on this.
2. **Replace Zustand reads with `Route.useSearch()`** -- Wire up existing filter controls to URL params. Page state moves to URL.
3. **Replace Zustand writes with `navigate()`** -- Filter changes update URL instead of store.
4. **Expose date_from/date_to** -- Add date range picker controls. These params already exist in the API.
5. **Expose registration_open / early_voting_active** -- Add toggle/checkbox controls. These params already exist in the API.
6. **Remove or clearly label client-side search** -- Either remove the misleading search or add a "(this page only)" label.
7. **Delete `useElectionFilters` election state** -- Clean up. Keep `raceFilters` portion if still used by race list.

**Rationale:** Steps 1-3 are the critical migration. Steps 4-5 expose existing API params. Step 6 prevents user confusion. Step 7 cleans up technical debt.

### Phase 2: Feature-Detected Filters (requires API changes or feature detection)

**Build order within Phase 2:**

1. **Feature detection hook** (`useApiCapabilities`) -- Must exist before any feature-detected filter can be rendered.
2. **Server-side search** (`q` param) -- Highest user value. Replaces the misleading client-side search.
3. **Race category filter** -- Second highest value for navigating 1K+ races.
4. **County/district filter** -- Geographic narrowing.
5. **Election date exact filter** -- Useful but lower priority than the above.

**Rationale:** Feature detection is the gate. Server search is the highest-value feature (the core problem is "finding a specific contest among 1K+ races"). Category and geography filters layer on top.

### Dependencies Graph

```
Phase 1:
  Zod schema (1) -> Read from URL (2) -> Write to URL (3) -> Expose existing params (4,5) -> Clean up (6,7)

Phase 2:
  Feature detection hook (1) -> Server search (2) -> Category filter (3) -> Geo filters (4,5)

Cross-phase:
  Phase 1 step 3 (URL writes) must complete before Phase 2 starts
  Phase 2 step 1 (feature detection) is independent of Phase 1 steps 4-7
```

---

## Sources

- [TanStack Blog: Search Params Are State](https://tanstack.com/blog/search-params-are-state) -- architectural philosophy (HIGH confidence)
- [TanStack Router: Search Params Guide](https://tanstack.com/router/latest/docs/guide/search-params) -- API reference (HIGH confidence)
- [TanStack Router: Validate Search Params with Schemas](https://tanstack.com/router/latest/docs/how-to/validate-search-params) -- Zod integration patterns (HIGH confidence)
- [TanStack Router: Navigate with Search Params](https://tanstack.com/router/latest/docs/how-to/navigate-with-search-params) -- functional updater pattern (HIGH confidence)
- [TanStack Query: Dependent Queries](https://tanstack.com/query/latest/docs/framework/react/guides/dependent-queries) -- enabled option for feature detection (HIGH confidence)
- [TanStack Table: Query Router Search Params Example](https://tanstack.com/table/latest/docs/framework/react/examples/query-router-search-params) -- reference implementation (MEDIUM confidence)
- Existing codebase patterns in `src/routes/voters/index.tsx` and `src/components/elections/ParticipantFilters.tsx` -- proven patterns already in production (HIGH confidence)
