---
phase: 01-url-state-and-existing-filters
plan: 01
subsystem: ui
tags: [tanstack-router, zod, url-state, date-presets, elections-filters]

# Dependency graph
requires: []
provides:
  - "Date preset utility (DATE_PRESETS, resolvePreset, matchPreset, getDefaultDateRange)"
  - "Election search schema and URL-to-API filter mapping (electionSearchSchema, mapParamsToApiFilters)"
  - "Elections list page with URL-persisted filter state including date preset, boolean filters, and pagination"
affects: [01-02, phase-02, phase-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zod search schema + validateSearch for URL state on route files"
    - "Extracted non-component exports to separate utility files to satisfy react-refresh lint rule"
    - "Date preset resolution: URL stores resolved dates, matchPreset reverse-matches for UI display"

key-files:
  created:
    - src/lib/date-presets.ts
    - src/lib/election-search.ts
    - tests/lib/date-presets.test.ts
    - tests/routes/elections-search-schema.test.ts
  modified:
    - src/routes/elections/index.tsx

key-decisions:
  - "Extracted electionSearchSchema and mapParamsToApiFilters to src/lib/election-search.ts to avoid react-refresh/only-export-components lint error"
  - "date_preset URL param is a single-value enum ('all-time') used only to distinguish all-time from default Next 3 months"
  - "URL stores resolved date_from/date_to values rather than preset name for shareable URLs"

patterns-established:
  - "URL state pattern: Zod schema in lib/ file, imported by route, tested independently"
  - "Date preset dropdown with custom range popover for flexible date filtering"
  - "Boolean filters as literal 'true' string in URL params, undefined when unchecked"

requirements-completed: [URL-01, URL-02, URL-03, URL-04, FILT-01, FILT-02, FILT-03, FILT-04]

# Metrics
duration: 10min
completed: 2026-03-13
---

# Phase 1 Plan 01: URL State and Date Presets Summary

**Elections list filters migrated from Zustand to URL search params with date preset dropdown, custom range popover, and boolean checkboxes for registration/early-voting**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-13T23:03:49Z
- **Completed:** 2026-03-13T23:14:34Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created date preset utility with 8 presets (future-focused defaults: Next 3 months, Next 6 months, etc.) including resolve, reverse-match, and default range functions
- Migrated elections list from Zustand useElectionFilters store to TanStack Router validateSearch + Zod schema for full URL state persistence
- Added date preset Select dropdown, custom date range Popover with From/To inputs, and boolean Checkboxes for "Registration open" and "Early voting active"
- All filter changes update URL params and reset pagination to page 1; browser back/forward navigates filter history

## Task Commits

Each task was committed atomically:

1. **Task 1: Create date preset utility with tests** (TDD)
   - `79231b7` (test) - Failing tests for date preset utility
   - `7cb16fd` (feat) - Implement date preset utility
2. **Task 2: Migrate elections list to URL state with new filter controls** - `66d5eaf` (feat)

## Files Created/Modified
- `src/lib/date-presets.ts` - Date preset definitions, resolvePreset, matchPreset, getDefaultDateRange, DEFAULT_PRESET
- `src/lib/election-search.ts` - Zod search schema and mapParamsToApiFilters function (extracted for testability and lint compliance)
- `src/routes/elections/index.tsx` - Elections list page rewritten to use URL state via validateSearch, with date preset dropdown, custom range popover, and boolean checkboxes
- `tests/lib/date-presets.test.ts` - 15 unit tests for date preset utility (100% coverage)
- `tests/routes/elections-search-schema.test.ts` - 17 unit tests for schema validation and API filter mapping

## Decisions Made
- Extracted `electionSearchSchema` and `mapParamsToApiFilters` to `src/lib/election-search.ts` instead of exporting from the route file, because the `react-refresh/only-export-components` ESLint rule prohibits non-component exports from route files
- Used short URL param names (`type` instead of `election_type`, `reg_open` instead of `registration_open`) for cleaner URLs
- `date_preset` param stores only `"all-time"` value; all other presets are stored as resolved date_from/date_to for URL shareability

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Extracted schema and mapper to separate utility file**
- **Found during:** Task 2 (lint verification)
- **Issue:** Exporting `electionSearchSchema` and `mapParamsToApiFilters` from the route file triggered `react-refresh/only-export-components` lint error
- **Fix:** Created `src/lib/election-search.ts` with the schema and mapper, imported them in the route file
- **Files modified:** `src/lib/election-search.ts` (created), `src/routes/elections/index.tsx`, `tests/routes/elections-search-schema.test.ts`
- **Verification:** `npm run lint` passes cleanly
- **Committed in:** `66d5eaf`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary structural change to comply with project lint rules. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- URL state foundation complete for the elections list page
- Plan 02 (active filter chips, result count, and context-aware empty states) can build directly on this URL state
- The Zustand `useElectionFilters` store was intentionally preserved as it is still used by `race-list.tsx` for `raceFilters`

## Self-Check: PASSED
- All 5 created/modified files verified on disk
- All 3 task commits verified in git history (79231b7, 7cb16fd, 66d5eaf)
