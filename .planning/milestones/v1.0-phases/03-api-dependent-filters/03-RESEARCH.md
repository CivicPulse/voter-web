# Phase 3: API-Dependent Filters - Research

**Researched:** 2026-03-14
**Domain:** Server-side filtering with feature-detection gating, URL state management, TanStack Query / TanStack Router
**Confidence:** HIGH

## Summary

Phase 3 adds server-side text search, race category, county, and election date filters to the elections list page. These controls are conditionally rendered based on the `useElectionCapabilities()` hook already built in Phase 2. The filter-options endpoint populates dropdowns with valid values. The implementation extends existing, well-established patterns from Phase 1 (Zod URL schema, `mapParamsToApiFilters`, `deriveActiveFilters`, filter chips) and Phase 2 (feature flags).

The codebase already contains every pattern needed. The Zod search schema in `src/lib/election-search.ts` needs four new fields (`q`, `race`, `county`, `election_date`). The `mapParamsToApiFilters` function and `getElections` API function need to forward these new params. The `deriveActiveFilters` function needs new chip types. The elections page component needs a second filter row that renders conditionally. A new `useFilterOptions` hook and `getFilterOptions` API function are needed for dynamic dropdown population. The shadcn Command+Popover combobox pattern is already used in `BoundarySelector` and can be adapted for the county filter.

**Primary recommendation:** Extend the existing Phase 1 infrastructure file-by-file (types, API, mapping, chips, UI) following established patterns exactly. Use `useEffect` + `setTimeout` for 300ms debounce (matching the participant list pattern at line 57-65 of `ElectionParticipantList.tsx`), not a custom hook.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Hide search input entirely when `search` capability flag is false; remove existing client-side search
- When active: full-width input above filter rows, server-side via `q` param
- 300ms debounce before sending API call
- Replace search icon with small spinner while debounced query is in-flight
- Wait silently when query is under 2 characters (no error, just don't fire)
- Search text appears as filter chip: `Search: "senate"`
- Two visual rows: Row 1 = Phase 1 filters, Row 2 = new API-dependent filters (Race category, County, Election date)
- Row 2 only appears when at least one new capability flag is true
- Show Row 2 with even a single available filter
- No label on Row 2; both rows use `flex flex-wrap gap-3`
- Race category: Select dropdown with hardcoded enum when filter-options unavailable (Federal, State Senate, State House, Local); dynamic from API when available
- URL param name: `race` (maps to API `race_category`)
- County: hidden until filter-options endpoint available; Combobox (Command + Popover) with type-ahead
- County values sorted alphabetically; URL param name: `county`
- Auto-populate county from navigation context when user navigates from county page
- Keep geographic context banner alongside county filter
- Statewide races included when filtering by county
- Election date: separate from date range preset picker
- When filter-options unavailable: native date input; when available: Select dropdown with short dates ("Nov 3, 2026"), sorted descending
- URL param name: `election_date`
- Hardcoded defaults for race category when filter-options unavailable; county and election date hidden or fallback inputs
- When filter-options IS available: re-fetch scoped options when other filters change
- Filter chips: `Race: State Senate`, `County: Bibb`, `Date: Nov 3, 2026`, `Search: "senate"` -- outline badge with X
- Error: search errors show existing error state; filter-options failure: race falls back to hardcoded, county hides, date falls back to native input
- Capabilities endpoint failure: all new filters hidden

### Claude's Discretion
- Exact debounce implementation (useDeferredValue vs custom debounce hook)
- Filter-options TanStack Query caching strategy (staleTime, gcTime, query key structure)
- Date range vs election_date conflict resolution logic
- Search input placeholder text wording
- Exact spacing between Row 1 and Row 2
- Combobox component details for county filter (width, max height, empty state)
- How `q` URL param coexists with or replaces `search` URL param during transition

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| API-01 | Server-side text search (q param) replaces client-side search, works across all pages with 300ms debounce | Extend `electionSearchSchema` with `q` field, extend `mapParamsToApiFilters` to include `q` param, extend `getElections` to pass `q` to API. Use `useEffect`+`setTimeout` debounce pattern (already used in `ElectionParticipantList`). Remove client-side filtering with `useDeferredValue`. |
| API-02 | Race category filter backed by API race_category field | Add `race` to Zod schema, map to `race_category` in API params. Use shadcn Select with hardcoded enum fallback or dynamic filter-options values. Extend chip derivation. |
| API-03 | Election date exact filter narrows results to specific election day | Add `election_date` to Zod schema, pass directly to API. Use native `<input type="date">` fallback or shadcn Select with filter-options dates formatted as short dates. |
| API-04 | Geographic filter (county) narrows results to specific geography | Add `county` to Zod schema, pass to API. Use shadcn Command+Popover combobox (existing pattern in `BoundarySelector`). Hidden when filter-options unavailable. Auto-populate from `useNavigationContext`. |
| API-05 | Filter options endpoint provides valid values per filter, disabling options that yield zero results | New `getFilterOptions` API function + `useFilterOptions` TanStack Query hook. Response shape: `{ race_categories, counties, election_dates }`. Re-fetch when filters change (query key includes current filters). |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TanStack Router | 1.159.5 | URL state via `validateSearch` + Zod | Already manages all filter state; extend schema |
| TanStack Query | 5.90.21 | Data fetching, caching, filter-options | Existing hook patterns; add `useFilterOptions` |
| Zod | 4.3.6 | URL param validation/coercion | Existing `electionSearchSchema`; extend it |
| shadcn/ui (Select) | radix-ui 1.4.3 | Race category and election date dropdowns | Already used for Status and Type filters |
| shadcn/ui (Command+Popover) | cmdk 1.1.1 | County combobox with type-ahead | Already used in `BoundarySelector` |
| ky | 1.14.3 | HTTP client for API calls | Existing `publicApi` / `api` instances |
| Lucide React | 0.563.0 | Icons (Search, Loader2, X, ChevronsUpDown, Check) | All icons already imported elsewhere |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zustand | 5.0.11 | Navigation context store | Read county context for auto-populating county filter |
| Sonner | 2.0.7 | Toast notifications | Error feedback on API failures |

### No New Dependencies Needed
Everything required is already installed. No `npm install` needed for this phase.

## Architecture Patterns

### Files to Modify/Create

```
src/
  types/elections.ts           # Add FilterOptionsResponse type, extend ElectionFilters
  lib/
    api/elections.ts           # Add getFilterOptions(), extend getElections() params
    election-search.ts         # Extend Zod schema, mapParamsToApiFilters, deriveActiveFilters
    hooks/
      use-filter-options.ts    # NEW: TanStack Query hook for filter-options endpoint
  routes/elections/index.tsx   # Add Row 2 filters, replace client-side search
  stores/navigation-context.ts # (read-only, no changes needed)
tests/
  routes/elections-search-schema.test.ts    # Extend with new param tests
  routes/elections-active-filters.test.ts   # Extend with new chip tests
  lib/api/elections.test.ts                # Add getFilterOptions tests
  lib/hooks/use-filter-options.test.ts     # NEW: hook tests
e2e/
  fixtures/mock-data.ts       # Add capabilities + filter-options mock data
  fixtures/election-api.ts    # Add capabilities + filter-options route interception
  elections-list.spec.ts      # Add tests for new filter controls
```

### Pattern 1: Zod Schema Extension
**What:** Add new optional fields to `electionSearchSchema` for API-dependent URL params
**When to use:** Every new URL-persisted filter follows this pattern
**Example:**
```typescript
// Source: existing src/lib/election-search.ts pattern
export const electionSearchSchema = z.object({
  // ... existing fields ...
  q: z.string().optional().catch(undefined),
  race: z.enum(["federal", "state_senate", "state_house", "local"]).optional().catch(undefined),
  county: z.string().optional().catch(undefined),
  election_date: z.string().optional().catch(undefined),
})
```
Key: `.optional().catch(undefined)` ensures invalid URL values degrade gracefully.

### Pattern 2: Debounced Search with useEffect + setTimeout
**What:** Local state for input value, useEffect debounce to URL param
**When to use:** Text search inputs that need debounce before API calls
**Example:**
```typescript
// Source: existing src/components/elections/ElectionParticipantList.tsx lines 54-65
const [searchInput, setSearchInput] = useState(params.q ?? "")

useEffect(() => {
  const timer = setTimeout(() => {
    const trimmed = searchInput.trim()
    if (trimmed.length >= 2 || trimmed === "") {
      if (trimmed !== (params.q ?? "")) {
        updateFilters({ q: trimmed || undefined })
      }
    }
  }, 300)
  return () => clearTimeout(timer)
}, [searchInput])
```
Note: The participant list already implements exactly this pattern with 300ms delay.

### Pattern 3: Conditional Filter Rendering via Feature Flags
**What:** Use `useElectionCapabilities()` to show/hide filter controls
**When to use:** Every new filter control in Row 2
**Example:**
```typescript
// Source: Phase 2 infrastructure (src/lib/hooks/use-election-capabilities.ts)
const flags = useElectionCapabilities()

{/* Row 2: API-dependent filters */}
{(flags.raceCategory || flags.geographic || flags.electionDate) && (
  <div className="flex flex-wrap gap-3 items-center">
    {flags.raceCategory && <RaceCategoryFilter />}
    {flags.geographic && flags.filterOptions && <CountyFilter />}
    {flags.electionDate && <ElectionDateFilter />}
  </div>
)}
```

### Pattern 4: Command+Popover Combobox
**What:** Searchable dropdown using shadcn Command inside Popover
**When to use:** County filter with type-ahead search
**Example:**
```typescript
// Source: existing src/routes/admin/elections/_components/boundary-selector.tsx
<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild>
    <Button variant="outline" role="combobox" aria-expanded={open} className="w-[200px] justify-between">
      {selectedCounty || "Select county..."}
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-[200px] p-0">
    <Command>
      <CommandInput placeholder="Search counties..." />
      <CommandList>
        <CommandEmpty>No county found.</CommandEmpty>
        <CommandGroup>
          {counties.map((county) => (
            <CommandItem key={county} value={county} onSelect={() => handleCountySelect(county)}>
              <Check className={cn("mr-2 h-4 w-4", params.county === county ? "opacity-100" : "opacity-0")} />
              {county}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
```

### Pattern 5: Filter-Options TanStack Query Hook
**What:** Hook that fetches valid filter values, scoped by current filters, with re-fetch on filter change
**When to use:** Populating dynamic dropdowns
**Example:**
```typescript
// Recommended caching strategy
export function useFilterOptions(currentFilters: Partial<ElectionFilters>) {
  return useQuery({
    queryKey: ["election-filter-options", currentFilters],
    queryFn: () => getFilterOptions(currentFilters),
    staleTime: 60 * 1000,    // 1 minute -- values change as filters change
    gcTime: 5 * 60 * 1000,   // 5 minutes
    retry: 1,
  })
}
```
The query key includes `currentFilters` so TanStack Query automatically re-fetches when filters change. staleTime of 1 minute balances freshness with API load.

### Anti-Patterns to Avoid
- **Client-side filtering of server data:** Phase 3 replaces the Phase 1 client-side search (`useDeferredValue` + `Array.filter`) with server-side search. Do not keep both.
- **Debouncing URL writes with useDeferredValue:** `useDeferredValue` defers rendering but does not delay the URL update or API call. Use `useEffect`+`setTimeout` for true debounce.
- **Firing API for single-character search:** The API returns 422 for `q` under 2 characters. Silently suppress these on the client side.
- **Stale filter-options after filter change:** The filter-options query key MUST include current filter state so options refresh when other filters change.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Searchable dropdown | Custom autocomplete with input+listbox | shadcn Command+Popover | Keyboard navigation, ARIA, focus management already handled by cmdk |
| Debounce | Custom `useDebounce` hook | `useEffect` + `setTimeout` pattern | Already used in `ElectionParticipantList`; 6 lines, no abstraction needed |
| URL state management | Manual `window.history.pushState` | TanStack Router `validateSearch` + `useNavigate` | Already manages all filter state; type-safe via Zod |
| Filter value formatting | Manual date string formatting | `Date.toLocaleDateString()` with options | Already used in `ElectionListItem` for short date display |

**Key insight:** Every building block for this phase already exists in the codebase. The work is wiring existing patterns together, not creating new infrastructure.

## Common Pitfalls

### Pitfall 1: Search Param Name Collision
**What goes wrong:** The existing `search` URL param (client-side search) collides with the new `q` param (server-side search).
**Why it happens:** Both represent text search but use different mechanisms.
**How to avoid:** When `flags.search` is true, use the `q` URL param and remove the `search` URL param entirely. When `flags.search` is false, keep the `search` URL param for client-side filtering. The `search` field in the Zod schema should remain for backward compatibility, but the UI should only show one search input.
**Warning signs:** Both `search` and `q` appearing in URLs simultaneously.

### Pitfall 2: Filter-Options Race Condition
**What goes wrong:** User changes filters rapidly, and stale filter-options responses populate dropdowns with outdated values.
**Why it happens:** TanStack Query may return cached/stale data while the new query is in-flight.
**How to avoid:** Include full filter state in the query key. TanStack Query's `isPlaceholderData` and automatic key-based cancellation handle this. Do NOT use `keepPreviousData` for filter-options (matches Phase 2's strict fallback principle).
**Warning signs:** Dropdown showing counties that yield zero results given current filters.

### Pitfall 3: Minimum Search Length and API 422
**What goes wrong:** Sending a 1-character search query to the API results in a 422 error that triggers error UI.
**Why it happens:** API requires minimum 2 characters for `q` parameter.
**How to avoid:** In the debounce effect, only update the `q` URL param when `searchInput.trim().length >= 2` OR when clearing to empty string. The API is never called with a single character.
**Warning signs:** Brief error flash when typing the first character of a search.

### Pitfall 4: Navigation Context vs County Filter Duplication
**What goes wrong:** County from navigation context sets the filter, but user can't clear it because context keeps re-applying.
**Why it happens:** Auto-populating from navigation context on every render.
**How to avoid:** Only auto-populate the county filter on initial mount (when `params.county` is undefined AND navigation context has a county). Once the user has interacted with the filter (including clearing it), don't re-apply context. Use a ref or initial-load guard.
**Warning signs:** Clearing the county filter badge causes it to immediately reappear.

### Pitfall 5: Date Range and Election Date Conflict
**What goes wrong:** User has a date range preset (e.g., "Last 30 days") and sets an exact election_date that falls outside that range, resulting in zero results.
**Why it happens:** Both `date_from`/`date_to` range and `election_date` exact filters are sent simultaneously as AND filters.
**How to avoid:** When `election_date` is set, clear the date range to "All time" (remove `date_from`, `date_to`, set `date_preset` to `all-time`). This prevents conflicting date constraints. The election_date filter is more specific and should take precedence.
**Warning signs:** Setting an exact election date while a range is active produces zero results.

### Pitfall 6: React-Refresh Lint Rule for Route Files
**What goes wrong:** Adding helper functions or non-component exports in the route file triggers eslint-plugin-react-refresh errors.
**Why it happens:** Route files should only export `Route` and the component.
**How to avoid:** Keep all logic (debounce, filter mapping, chip derivation) in `src/lib/election-search.ts` or dedicated files. The route file only imports and uses them.
**Warning signs:** ESLint errors about "only export components" in route files.

## Code Examples

### Extending ElectionFilters Type
```typescript
// Source: extend existing src/types/elections.ts
export interface ElectionFilters {
  status: ElectionStatus | "all"
  election_type: ElectionType | "all"
  date_from: string | null
  date_to: string | null
  registration_open?: boolean
  early_voting_active?: boolean
  search?: string
  // New API-dependent filters
  q?: string
  race_category?: string
  county?: string
  election_date?: string
}

/** Response from GET /elections/filter-options */
export interface FilterOptionsResponse {
  race_categories: string[]
  counties: string[]
  election_dates: string[]
}
```

### Extending mapParamsToApiFilters
```typescript
// Source: extend existing src/lib/election-search.ts
export function mapParamsToApiFilters(
  params: ElectionSearchParams,
  defaultDates: { date_from: string; date_to: string },
): Partial<ElectionFilters> {
  const isAllTime = params.date_preset === "all-time"
  const hasExactDate = !!params.election_date
  return {
    status: params.status ?? "all",
    election_type: params.type ?? "all",
    // When exact election_date is set, don't also send date range
    date_from: hasExactDate ? null : (isAllTime ? null : (params.date_from ?? defaultDates.date_from)),
    date_to: hasExactDate ? null : (isAllTime ? null : (params.date_to ?? defaultDates.date_to)),
    registration_open: params.reg_open === "true" ? true : undefined,
    early_voting_active: params.early_voting === "true" ? true : undefined,
    // New API-dependent fields
    q: params.q,
    race_category: params.race,  // URL param "race" maps to API "race_category"
    county: params.county,
    election_date: params.election_date,
  }
}
```

### Extending getElections to Pass New Params
```typescript
// Source: extend existing src/lib/api/elections.ts getElections function
// Add after existing param checks:
if (params?.q) {
  searchParams.q = params.q
}
if (params?.race_category) {
  searchParams.race_category = params.race_category
}
if (params?.county) {
  searchParams.county = params.county
}
if (params?.election_date) {
  searchParams.election_date = params.election_date
}
```

### New getFilterOptions API Function
```typescript
// Source: new function in src/lib/api/elections.ts
export async function getFilterOptions(
  filters?: Partial<ElectionFilters>,
): Promise<FilterOptionsResponse> {
  const searchParams: Record<string, string> = {}
  // Pass current filters to scope the options
  if (filters?.status && filters.status !== "all") searchParams.status = filters.status
  if (filters?.election_type && filters.election_type !== "all") searchParams.election_type = filters.election_type
  if (filters?.date_from) searchParams.date_from = filters.date_from
  if (filters?.date_to) searchParams.date_to = filters.date_to
  if (filters?.q) searchParams.q = filters.q
  if (filters?.race_category) searchParams.race_category = filters.race_category
  if (filters?.county) searchParams.county = filters.county

  return publicApi
    .get("elections/filter-options", { searchParams })
    .json<FilterOptionsResponse>()
}
```

### Short Date Formatting for Election Date Dropdown
```typescript
// Format "2026-11-03" as "Nov 3, 2026"
function formatShortDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
```

### Extending deriveActiveFilters with New Chips
```typescript
// Add to existing deriveActiveFilters function, after existing chip checks:

// Server-side search chip (replaces client-side search chip when q is used)
if (params.q) {
  const truncated = params.q.length > 20
    ? params.q.slice(0, 20) + "..."
    : params.q
  filters.push({ key: `Search: "${truncated}"`, paramKey: "q" })
}

// Race category chip
if (params.race) {
  const labels: Record<string, string> = {
    federal: "Federal",
    state_senate: "State Senate",
    state_house: "State House",
    local: "Local",
  }
  filters.push({ key: `Race: ${labels[params.race] ?? params.race}`, paramKey: "race" })
}

// County chip
if (params.county) {
  filters.push({ key: `County: ${params.county}`, paramKey: "county" })
}

// Election date chip
if (params.election_date) {
  filters.push({ key: `Date: ${formatShortDate(params.election_date)}`, paramKey: "election_date" })
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side search with `useDeferredValue` | Server-side search with 300ms debounce via `q` param | Phase 3 | Search now works across all pages, not just current page |
| Hardcoded filter options | Dynamic filter-options from API | Phase 3 | Dropdowns show only valid values; prevents dead-end selections |
| All filters visible always | Feature-flag gated filter rendering | Phase 2 (already done) | Graceful degradation when API doesn't support new filters |

**Deprecated/outdated:**
- Client-side search filtering (`useDeferredValue` + `Array.filter` in elections page): Replaced by server-side `q` param when capability flag is true
- `search` URL param: Replaced by `q` URL param when server-side search is available

## Open Questions

1. **Filter-options scoping behavior**
   - What we know: API-SPEC.md proposes optional scoping (pass current filters to get valid options). CONTEXT.md says "re-fetch filter-options when other filters change."
   - What's unclear: Whether the backend will implement scoping in v1 or return unscoped options.
   - Recommendation: Build the frontend to pass current filters in the filter-options request. If backend ignores them (returns unscoped), the UI still works correctly -- just with some options that may yield zero results. This is the progressive enhancement approach.

2. **Race category enum values**
   - What we know: CONTEXT.md specifies hardcoded fallback: Federal, State Senate, State House, Local. API-SPEC.md defers enum values to backend team.
   - What's unclear: Whether backend will use exactly these values or different ones.
   - Recommendation: Hardcode `federal`, `state_senate`, `state_house`, `local` as fallback values with human-readable labels. When filter-options is available, use whatever values the API returns. This handles both cases.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 (unit) + Playwright 1.58.2 (E2E) |
| Config file | `vitest.config.ts` + `playwright.config.ts` |
| Quick run command | `npx vitest run tests/routes/elections-search-schema.test.ts tests/routes/elections-active-filters.test.ts` |
| Full suite command | `npm test -- --run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| API-01 | Search `q` param in Zod schema, API mapping, chip derivation | unit | `npx vitest run tests/routes/elections-search-schema.test.ts tests/routes/elections-active-filters.test.ts` | Extend existing |
| API-01 | 300ms debounce, spinner, min 2 chars | E2E | `npx playwright test e2e/elections-list.spec.ts` | Extend existing |
| API-02 | Race `race` param in schema, mapping, chip | unit | `npx vitest run tests/routes/elections-search-schema.test.ts tests/routes/elections-active-filters.test.ts` | Extend existing |
| API-03 | Election date `election_date` param, chip with formatted date | unit | `npx vitest run tests/routes/elections-search-schema.test.ts tests/routes/elections-active-filters.test.ts` | Extend existing |
| API-04 | County `county` param, chip, auto-populate from nav context | unit + E2E | `npx vitest run tests/routes/elections-search-schema.test.ts` | Extend existing |
| API-05 | Filter options hook, API function, error fallback | unit | `npx vitest run tests/lib/hooks/use-filter-options.test.ts tests/lib/api/elections.test.ts` | New + extend |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/routes/elections-search-schema.test.ts tests/routes/elections-active-filters.test.ts tests/lib/api/elections.test.ts`
- **Per wave merge:** `npm test -- --run`
- **Phase gate:** Full suite green (`npm test -- --run` and `npm run build`) before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/lib/hooks/use-filter-options.test.ts` -- covers API-05
- [ ] Extend `tests/lib/api/elections.test.ts` with `getFilterOptions` tests -- covers API-05
- [ ] Extend `tests/routes/elections-search-schema.test.ts` with `q`, `race`, `county`, `election_date` field tests -- covers API-01-04
- [ ] Extend `tests/routes/elections-active-filters.test.ts` with new chip type tests -- covers API-01-04
- [ ] Extend `e2e/fixtures/mock-data.ts` with capabilities and filter-options mock data
- [ ] Extend `e2e/fixtures/election-api.ts` with capabilities and filter-options route interception

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `src/lib/election-search.ts`, `src/routes/elections/index.tsx`, `src/lib/hooks/use-election-capabilities.ts`, `src/lib/api/elections.ts`, `src/types/elections.ts` -- all existing patterns verified by reading source files
- Codebase analysis: `src/routes/admin/elections/_components/boundary-selector.tsx` -- verified Command+Popover combobox pattern
- Codebase analysis: `src/components/elections/ElectionParticipantList.tsx` -- verified 300ms debounce pattern with useEffect+setTimeout
- `.planning/API-SPEC.md` -- authoritative API specification for filter-options endpoint shape and new parameters
- `package.json` -- verified all dependencies already installed with exact versions

### Secondary (MEDIUM confidence)
- `.planning/phases/03-api-dependent-filters/03-CONTEXT.md` -- user decisions from context session

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and used in codebase
- Architecture: HIGH -- all patterns already exist in the codebase; this phase extends them
- Pitfalls: HIGH -- identified from codebase patterns and similar implementations (participant list filters)

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable -- all decisions locked, patterns established)
