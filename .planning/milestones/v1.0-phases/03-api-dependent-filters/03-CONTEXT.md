# Phase 3: API-Dependent Filters - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Add server-side text search, race category, geographic (county), and election date filters to the elections list page. All filters are gated by the `useElectionCapabilities()` hook from Phase 2 — they appear only when the API supports the corresponding parameters. Filters work across the full 1,000+ election dataset via server-side filtering, not client-side. The filter-options endpoint populates dropdowns with valid values when available.

</domain>

<decisions>
## Implementation Decisions

### Search behavior
- Hide the search input entirely when the `search` capability flag is false — remove the existing client-side search
- When active: full-width input above the filter rows (current position), server-side via `q` param
- 300ms debounce before sending API call
- Replace the search icon with a small spinner while the debounced query is in-flight
- Wait silently when query is under 2 characters (API minimum) — no error message, just don't fire the search
- Placeholder text can hint at minimum length (Claude's discretion on wording)
- Search text appears as a filter chip: `Search: "senate"` (matching existing truncation pattern)

### Filter row layout
- Two visual rows: Row 1 has existing Phase 1 filters (Status, Type, Date preset, Reg open, Early voting). Row 2 has new API-dependent filters (Race category, County, Election date)
- Row 2 only appears when at least one new capability flag is true
- Show Row 2 with even a single available filter — don't wait for a "critical mass"
- No label on Row 2 — controls are self-labeling via placeholder text
- Both rows use the existing `flex flex-wrap gap-3` pattern

### Race category filter
- Select dropdown with hardcoded enum values when filter-options endpoint is unavailable: Federal, State Senate, State House, Local
- When filter-options IS available, populate from dynamic API response
- URL param name: `race` (short, maps to API `race_category` in the mapping layer)
- Chip format: `Race: State Senate`

### County filter
- Hidden until the filter-options endpoint is available — no hardcoded county list
- When available: Combobox (shadcn/ui Command + Popover) with type-ahead search, populated from filter-options response
- County values from filter-options are sorted alphabetically
- URL param name: `county` (matches API param name)
- Chip format: `County: Bibb`
- Auto-populate from navigation context when user navigates from a county page (pre-set URL param); uppercase the value before writing to URL/API params (e.g., convert mixed-case "Bibb" to "BIBB") to match backend expectations
- Keep the geographic context banner alongside the county filter — banner provides context, filter provides control
- Statewide races (US Senate, Governor, etc.) are included when filtering by county — matches API spec recommendation

### Election date filter
- Separate control from the existing date range preset picker — two distinct concepts: "when to look" (range) vs "which election day" (exact)
- When filter-options is unavailable: native browser date input (type="date"), consistent with existing custom date range popover
- When filter-options IS available: Select dropdown showing specific dates with elections, formatted as short dates ("Nov 3, 2026"), sorted descending (most recent first), with "All dates" as the default/clear option
- URL param name: `election_date` (matches API param name)
- Chip format: `Date: Nov 3, 2026`
- Interaction with date range preset when exact date conflicts with range: Claude's discretion

### Dropdown population strategy
- Hardcoded defaults for race category when filter-options is unavailable
- County and election date hidden or use fallback inputs when filter-options is unavailable
- When filter-options IS available: fetch scoped options — re-fetch filter-options when other filters change, so dropdowns only show values that yield results given current filter state
- TanStack Query for filter-options with appropriate staleTime (Claude's discretion on exact caching)

### URL param naming
- `race` for race category (short, maps to API `race_category`)
- `county` for county (matches API param)
- `election_date` for election date (matches API param, consistent with `date_from`/`date_to`)
- `q` for search (matches API param — replaces current `search` URL param when capability is active)

### Filter chips
- Labeled format matching existing pattern: `Race: State Senate`, `County: Bibb`, `Date: Nov 3, 2026`, `Search: "senate"`
- Outline badge with X icon for removal — same as Phase 1 chips
- New chips appear alongside existing chips in the same chip row
- Removing a chip resets that filter to its default (unset) value

### Error handling
- Server-side search errors: show existing error state in results area ("Failed to load elections"), keep search text in input for retry
- Filter-options endpoint failure: race category falls back to hardcoded enum, county filter hides, election date falls back to native date input — strict fallback, no stale cache (matching Phase 2 principle)
- Capabilities endpoint failure: all new filters hidden, only Phase 1 filters remain (already implemented in Phase 2)

### Claude's Discretion
- Exact debounce implementation (useDeferredValue vs custom debounce hook)
- Filter-options TanStack Query caching strategy (staleTime, gcTime, query key structure)
- Date range vs election_date conflict resolution logic
- Search input placeholder text wording
- Exact spacing between Row 1 and Row 2
- Combobox component details for county filter (width, max height, empty state)
- How `q` URL param coexists with or replaces the `search` URL param during the transition

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useElectionCapabilities()` hook (`src/lib/hooks/use-election-capabilities.ts`): Returns typed feature flags — conditionally render each new filter
- `ElectionFeatureFlags` type (`src/types/elections.ts`): `search`, `raceCategory`, `geographic`, `electionDate`, `filterOptions` booleans
- `mapCapabilitiesToFlags()` (`src/lib/election-capabilities.ts`): Maps API response to feature flags
- `electionSearchSchema` (`src/lib/election-search.ts`): Zod schema for URL params — needs extension for `race`, `county`, `election_date`, `q`
- `mapParamsToApiFilters()` (`src/lib/election-search.ts`): Maps URL params to API filters — needs extension for new params
- `deriveActiveFilters()` (`src/lib/election-search.ts`): Generates filter chips — needs new chip types
- `Badge` component (`src/components/ui/badge.tsx`): Outline variant for filter chips
- `Select`, `Popover`, `Input`, `Checkbox` components: All shadcn/ui, already used in filter row
- `Command` + `Popover` components: shadcn/ui combobox pattern for county searchable dropdown
- `EmptyState` component: Already handles filtered empty states
- `Loader2` icon: For search spinner in input

### Established Patterns
- `validateSearch` + Zod schema with `.optional().catch(undefined)` for URL params
- `Route.useSearch()` + `useNavigate()` for reading/updating URL params
- `flex flex-wrap gap-3` layout for filter controls
- Filter chips with `Badge variant="outline"` and X icon for removal
- TanStack Query hooks with `staleTime`/`gcTime` configuration

### Integration Points
- `src/routes/elections/index.tsx`: Main page to modify — add Row 2 filters, replace client-side search with server-side
- `src/lib/election-search.ts`: Extend Zod schema, mapping functions, and chip derivation
- `src/lib/api/elections.ts`: Add `getFilterOptions()` API function, extend `getElections()` to accept new params
- `src/types/elections.ts`: Extend `ElectionFilters` type with new fields, add `FilterOptionsResponse` type
- `src/stores/navigation-context.ts`: Read county context for auto-populating county filter
- `e2e/fixtures/mock-data.ts`: Add mock data for new filter scenarios
- `e2e/fixtures/election-api.ts`: Add route interception for capabilities and filter-options endpoints

</code_context>

<specifics>
## Specific Ideas

- Search should feel invisible when the API doesn't support it — no search bar at all, not a disabled one
- County filter should feel like a "smart dropdown" — type-ahead with instant filtering of the option list
- The two-row filter layout should feel like one unified filter area, not two disconnected sections — consistent gap and styling between rows
- Election date dropdown with short dates ("Nov 3, 2026") keeps the dropdown compact while being human-readable

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-api-dependent-filters*
*Context gathered: 2026-03-14*
