---
phase: 02-feature-detection-infrastructure
plan: 01
subsystem: api
tags: [tanstack-query, feature-flags, capabilities, typescript]

# Dependency graph
requires:
  - phase: 01-url-state-existing-filters
    provides: Elections list page with URL-synced filters and publicApi client
provides:
  - useElectionCapabilities hook returning typed feature flags from API
  - mapCapabilitiesToFlags pure function for API response mapping
  - getElectionCapabilities API function using publicApi
  - ElectionFeatureFlags and CapabilitiesResponse TypeScript interfaces
  - Comprehensive API specification for backend team (capabilities, filters, filter-options)
affects: [03-api-dependent-filters]

# Tech tracking
tech-stack:
  added: []
  patterns: [capabilities-endpoint-detection, strict-fallback-feature-flags]

key-files:
  created:
    - src/lib/election-capabilities.ts
    - src/lib/hooks/use-election-capabilities.ts
    - tests/lib/election-capabilities.test.ts
    - tests/lib/hooks/use-election-capabilities.test.tsx
    - .planning/API-SPEC.md
  modified:
    - src/types/elections.ts
    - src/lib/api/elections.ts

key-decisions:
  - "Strict fallback: hook returns all flags false on any error/404, no stale cache preservation"
  - "Geographic flag enabled by either county or district in supported_filters"
  - "Hook retry set to 1 (one retry then give up), matching user decision on caching strategy"

patterns-established:
  - "Capabilities detection: publicApi -> mapCapabilitiesToFlags -> useElectionCapabilities hook -> conditional UI rendering"
  - "Feature flag mapping: snake_case API param names -> camelCase TypeScript flags via Set-based lookup"

requirements-completed: [INFRA-01, INFRA-02]

# Metrics
duration: 6min
completed: 2026-03-14
---

# Phase 2 Plan 1: Feature Detection Infrastructure Summary

**useElectionCapabilities hook with typed feature flags derived from GET /elections/capabilities, strict false-on-error fallback, and 463-line API spec for backend team**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-14T00:23:12Z
- **Completed:** 2026-03-14T00:29:19Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Created feature detection infrastructure that gates API-dependent filter controls based on capabilities endpoint response
- 16 unit tests covering all param-to-flag mappings, edge cases (missing endpoints, undefined fields), and hook behavior (success, 404, network error)
- Comprehensive API specification (463 lines) covering capabilities endpoint, 5 new filter parameters, and filter-options endpoint with full contracts for backend implementation

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Failing tests** - `e80a3d5` (test)
2. **Task 1 (GREEN): Implementation** - `f675310` (feat)
3. **Task 2: API specification** - `fd73ecc` (docs)

_TDD task had separate RED and GREEN commits_

## Files Created/Modified
- `src/types/elections.ts` - Added ElectionFeatureFlags and CapabilitiesResponse interfaces
- `src/lib/election-capabilities.ts` - Created: mapCapabilitiesToFlags pure function and EMPTY_FLAGS constant
- `src/lib/api/elections.ts` - Added getElectionCapabilities function using publicApi
- `src/lib/hooks/use-election-capabilities.ts` - Created: TanStack Query hook with 5min staleTime, 10min gcTime, retry 1
- `tests/lib/election-capabilities.test.ts` - Created: 12 tests for pure function mapping
- `tests/lib/hooks/use-election-capabilities.test.tsx` - Created: 4 tests for hook behavior
- `.planning/API-SPEC.md` - Created: 463-line API specification for backend team

## Decisions Made
- Strict fallback: `data ?? EMPTY_FLAGS` ensures all flags are false on any error, no stale cache preservation (per user decision)
- Geographic flag enabled by either `county` or `district` (or both) in supported_filters, since both indicate geographic filtering capability
- Hook uses `retry: 1` (one retry on failure) -- the test wrapper's `retry: false` default is overridden by the hook's explicit retry setting, requiring extended waitFor timeouts in error tests

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Increased waitFor timeout in hook error tests**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** Hook's explicit `retry: 1` overrides test QueryClient's `retry: false` default, causing TanStack Query to retry once on rejection with a delay. The default 1000ms waitFor timeout was insufficient.
- **Fix:** Added `{ timeout: 5000 }` to waitFor calls in 404 and network error tests
- **Files modified:** tests/lib/hooks/use-election-capabilities.test.tsx
- **Verification:** All 16 tests pass
- **Committed in:** f675310 (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Test timing adjustment necessary for correctness with retry behavior. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Feature detection infrastructure is complete and tested
- API spec ready for backend team review and implementation
- Phase 3 can use `useElectionCapabilities()` hook to conditionally render new filter controls
- When backend ships capabilities endpoint, new filters will appear automatically

## Self-Check: PASSED

All 7 files verified present. All 3 commits verified in git log.

---
*Phase: 02-feature-detection-infrastructure*
*Completed: 2026-03-14*
