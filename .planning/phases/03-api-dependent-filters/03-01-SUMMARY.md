---
phase: 03-api-dependent-filters
plan: 01
subsystem: api
tags: [zod, tanstack-query, election-filters, url-params, ky]

# Dependency graph
requires:
  - phase: 02-feature-detection
    provides: ElectionFeatureFlags type and useElectionCapabilities hook for gating filters
  - phase: 01-url-state-filters
    provides: electionSearchSchema, mapParamsToApiFilters, deriveActiveFilters, getElections
provides:
  - Extended ElectionFilters type with q, race_category, county, election_date fields
  - FilterOptionsResponse type for filter-options endpoint
  - Extended Zod schema with q, race, county, election_date URL params
  - Extended mapParamsToApiFilters with new param mappings and election_date precedence
  - formatShortDate helper for date chip formatting
  - Extended deriveActiveFilters with Race, County, Date, and server-side Search chips
  - Extended getElections to pass new filter params to API
  - getFilterOptions API function for elections/filter-options endpoint
  - useFilterOptions hook with filter-dependent query key for dynamic dropdown population
affects: [03-02-ui-filters]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "election_date takes precedence over date range (clears date_from/date_to)"
    - "URL param race maps to API param race_category in mapping layer"
    - "Filter-options query key includes current filters for automatic scoped re-fetching"

key-files:
  created:
    - src/lib/hooks/use-filter-options.ts
  modified:
    - src/types/elections.ts
    - src/lib/election-search.ts
    - src/lib/api/elections.ts
    - tests/routes/elections-search-schema.test.ts
    - tests/routes/elections-active-filters.test.ts
    - tests/lib/api/elections.test.ts
    - tests/lib/hooks/use-filter-options.test.ts

key-decisions:
  - "election_date clears date_from/date_to when set (exact date takes precedence over range)"
  - "Race category labels map: federal->Federal, state_senate->State Senate, state_house->State House, local->Local"
  - "useFilterOptions uses 1min staleTime, 5min gcTime, retry: 1"

patterns-established:
  - "formatShortDate: reusable ISO date to short format helper (Nov 3, 2026)"
  - "RACE_CATEGORY_LABELS: centralized label map for race category display"

requirements-completed: [API-01, API-02, API-03, API-04, API-05]

# Metrics
duration: 6min
completed: 2026-03-14
---

# Phase 3 Plan 1: API-Dependent Filters Data Layer Summary

**Extended types, Zod schema, API functions, and TanStack Query hook for server-side election filtering by search, race category, county, and election date**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-14T16:36:41Z
- **Completed:** 2026-03-14T16:43:04Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Extended ElectionFilters type and Zod schema with 4 new URL params (q, race, county, election_date) with graceful catch on invalid values
- Built complete mapping and chip derivation pipeline: race->race_category rename, election_date clears date range, formatted chips for all new filter types
- Added getFilterOptions API function and useFilterOptions hook with filter-dependent query key for scoped dropdown population
- All 904 unit tests pass with zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend types, Zod schema, API mapping, and chip derivation with unit tests** - `c09d71b` (feat)
2. **Task 2: Create useFilterOptions hook with unit tests** - `fdface8` (feat)

## Files Created/Modified
- `src/types/elections.ts` - Added q, race_category, county, election_date to ElectionFilters; added FilterOptionsResponse type
- `src/lib/election-search.ts` - Extended Zod schema, mapParamsToApiFilters, deriveActiveFilters; added formatShortDate and RACE_CATEGORY_LABELS
- `src/lib/api/elections.ts` - Extended getElections with new params; added getFilterOptions function
- `src/lib/hooks/use-filter-options.ts` - New TanStack Query hook for filter-options endpoint
- `tests/routes/elections-search-schema.test.ts` - Added 15 new tests for schema parsing and param mapping
- `tests/routes/elections-active-filters.test.ts` - Added 6 new tests for chip derivation
- `tests/lib/api/elections.test.ts` - Added 7 new tests for getElections params and getFilterOptions
- `tests/lib/hooks/use-filter-options.test.ts` - 4 new tests for hook behavior

## Decisions Made
- election_date clears date_from/date_to when set (exact date takes precedence over date range, per CONTEXT.md decision)
- Race category labels centralized in RACE_CATEGORY_LABELS constant for reuse by UI layer
- useFilterOptions configured with 1min staleTime, 5min gcTime, retry: 1 (matching Phase 2 caching pattern)
- getFilterOptions uses publicApi (not authenticated api) since filter options are public

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All data layer contracts ready for Plan 02 UI consumption
- useFilterOptions hook available for dynamic dropdown population
- Extended chip derivation ready for filter chip display
- All types, schemas, and API functions tested and verified

---
*Phase: 03-api-dependent-filters*
*Completed: 2026-03-14*
