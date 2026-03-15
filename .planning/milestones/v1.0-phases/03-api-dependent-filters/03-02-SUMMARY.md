---
phase: 03-api-dependent-filters
plan: 02
subsystem: ui
tags: [react, shadcn-ui, tanstack-router, debounce, combobox, e2e, playwright, feature-flags]

# Dependency graph
requires:
  - phase: 03-api-dependent-filters
    provides: Extended types, Zod schema, mapParamsToApiFilters, deriveActiveFilters, useFilterOptions hook, formatShortDate
  - phase: 02-feature-detection
    provides: useElectionCapabilities hook and ElectionFeatureFlags for conditional rendering
  - phase: 01-url-state-filters
    provides: URL state infrastructure, filter chips, empty states, base elections list page
provides:
  - Server-side search input with 300ms debounce and loading spinner
  - Row 2 filter controls conditionally rendered by capability flags
  - Race category dropdown with hardcoded fallback or dynamic API values
  - County combobox with type-ahead search, auto-populated from navigation context
  - Election date dropdown with formatted dates or native date input fallback
  - Filter chips for all new filter types (search, race, county, election date)
  - Comprehensive E2E tests covering enabled and disabled capability states
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Debounced search: local state + useEffect/setTimeout (300ms) syncs to URL params"
    - "Conditional Row 2: entire filter row hidden when no capability flags are true"
    - "County auto-populate: useRef guard prevents re-application after user clears"
    - "Dual-mode date filter: dropdown when filter-options available, native input fallback"

key-files:
  created: []
  modified:
    - src/routes/elections/index.tsx
    - src/lib/election-search.ts
    - e2e/elections-list.spec.ts
    - e2e/fixtures/mock-data.ts
    - e2e/fixtures/election-api.ts

key-decisions:
  - "Client-side search removed entirely; search input hidden when flags.search is false"
  - "County combobox hidden until both geographic and filterOptions flags are true"
  - "Election date filter clears date range preset to prevent conflicts"

patterns-established:
  - "Debounced server-side search with isSearching state for spinner UX"
  - "Capability-gated filter row pattern: Row 2 renders only when flags indicate support"
  - "Navigation context auto-populate with ref guard for one-time initialization"

requirements-completed: [API-01, API-02, API-03, API-04, API-05]

# Metrics
duration: 4min
completed: 2026-03-15
---

# Phase 3 Plan 2: API-Dependent Filters UI Summary

**Server-side search with debounce, race category dropdown, county combobox, and election date filter -- all conditionally rendered by capability flags with 27 E2E tests**

## Performance

- **Duration:** 4 min (continuation from checkpoint approval)
- **Started:** 2026-03-15T01:32:22Z
- **Completed:** 2026-03-15T01:36:00Z
- **Tasks:** 3 (2 auto + 1 checkpoint)
- **Files modified:** 5

## Accomplishments
- Replaced client-side search with server-side search featuring 300ms debounce, minimum 2-character threshold, and loading spinner
- Built Row 2 filter controls (race category, county combobox, election date) that conditionally render based on API capability flags from useElectionCapabilities
- County combobox auto-populates from navigation context on initial mount with ref guard preventing re-application after user clears
- Added 13 new E2E tests covering all filter controls in both enabled and disabled capability states, bringing elections list spec to 27 total tests
- All 904 unit tests and 27 E2E tests pass with zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement server-side search and Row 2 filter controls** - `fbce5d0` (feat)
2. **Task 2: E2E tests for new filter controls** - `76d3af6` (test)
3. **Task 3: Verify complete Phase 3 filter UI** - checkpoint approved (no separate commit)

## Files Created/Modified
- `src/routes/elections/index.tsx` - Server-side search with debounce, Row 2 filter controls (race category, county combobox, election date), capability-gated rendering, updated chip removal handlers
- `src/lib/election-search.ts` - Minor adjustments for search integration
- `e2e/elections-list.spec.ts` - 13 new E2E tests for API-dependent filters (search visibility, race category, county combobox, election date, filter chips, capability-disabled state)
- `e2e/fixtures/mock-data.ts` - Added mockCapabilities, mockCapabilitiesNone, and mockFilterOptions test fixtures
- `e2e/fixtures/election-api.ts` - Added route interception for capabilities and filter-options endpoints with configurable capability mode

## Decisions Made
- Client-side search (useDeferredValue + filteredElections memo) removed entirely; search input hidden when flags.search is false per CONTEXT.md locked decision
- County combobox hidden until both geographic and filterOptions capability flags are true (not shown with degraded fallback)
- Setting election_date clears date range preset to "all-time" to prevent API parameter conflicts
- E2E tests use configurable capability mode (full capabilities by default, mockCapabilitiesNone for degraded state tests)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- This is the final plan in the final phase -- the Better Elections Discovery milestone is complete
- All 19 v1 requirements are implemented and verified
- The elections list page now supports: URL-persisted filter state, date range presets, status/type/boolean filters, filter chips with clear-all, result counts, empty states, server-side search, race category, county combobox, and election date filters
- All filters are gated by API capability detection and degrade gracefully when capabilities are unavailable

## Self-Check: PASSED

All files verified present, all commit hashes verified in git log.

---
*Phase: 03-api-dependent-filters*
*Completed: 2026-03-15*
