# Phase 2: Feature Detection Infrastructure - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the mechanism that gates future API-dependent filter controls (search, race category, geographic, election date) based on actual API capabilities, and write a specification document for the backend team covering all new parameters and endpoints needed.

</domain>

<decisions>
## Implementation Decisions

### Detection strategy
- Capabilities endpoint (`GET /elections/capabilities`) is the source of truth
- Endpoint returns a list of supported filter parameter names
- Frontend maps API param names to semantic feature flags (e.g., `q` → `search`, `race_category` → `raceCategory`)
- If the capabilities endpoint returns 404 or errors, all new features are disabled — only Phase 1 filters (status, type, dates, registration, early voting) remain
- Strict fallback: if endpoint goes down after previously working, new filters disappear (no stale cache preservation)
- The capabilities endpoint itself is part of the API spec (INFRA-02) — it doesn't exist yet

### API spec document
- Format: Markdown file at `.planning/API-SPEC.md`
- Depth: Full contracts for each parameter — type, validation rules, behavior description, example request/response, edge cases
- Scope: Covers all new filter params (q, race_category, county, district, election_date), the capabilities endpoint, and the filter-options endpoint
- Race category taxonomy: describe the need ("filter by level of government") but let the backend team define the actual enum values
- Geographic filter param names: Claude's discretion (propose names that align with the data model)
- Cross-reference the existing `q` param on participation endpoint as precedent: Claude's discretion

### Degraded filter UX
- Unsupported filters are hidden completely — they don't render at all
- When API ships support for a filter, it appears automatically (reactive, mid-session)
- If a user has URL params for unsupported features (e.g., `q=senate` in URL but search not supported), strip those params from the URL
- No "coming soon" or disabled states — clean UI showing only what works

### Caching & freshness
- Capabilities fetched via TanStack Query with 5-minute staleTime, 10-minute gcTime
- Global scope — query available app-wide, not scoped to elections page
- Retry: 1 retry on failure, then treat as "no capabilities available"
- Page renders immediately with Phase 1 filters; new filters appear after capabilities resolve (no loading skeleton or delay)
- Layout shift when new filters appear is acceptable

### Claude's Discretion
- Exact param names proposed in the API spec for geographic filters
- Whether to cross-reference the existing participation `q` param in the spec
- Hook implementation details (query key structure, error handling)
- How to structure the param-to-feature mapping (object literal, function, etc.)
- Compression algorithm for testing feature detection in unit tests

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `publicApi` client (`src/api/client.ts`): Use for capabilities endpoint since it doesn't require auth and doesn't redirect on 401
- `useUserRole()` hook: Example of global TanStack Query hook with 5-minute staleTime — same caching pattern for capabilities
- `ElectionFilters` type (`src/types/elections.ts`): Will need extension for new filter fields gated by capabilities
- `electionSearchSchema` (`src/lib/election-search.ts`): Zod schema for URL params — will need conditional fields based on capabilities
- `getElections()` (`src/lib/api/elections.ts`): Will need to accept new filter params (q, race_category, etc.) conditionally

### Established Patterns
- TanStack Query hooks in `src/lib/hooks/`: Consistent `useQuery` wrapper pattern with typed queryFn and configurable staleTime
- Zod schemas for URL search params: `.optional().catch(undefined)` pattern used in Phase 1
- Named exports, no default exports
- `@/` path alias for all imports

### Integration Points
- `src/routes/elections/index.tsx`: Elections list page will conditionally render new filter controls based on capabilities hook
- `src/lib/election-search.ts`: Zod schema may need to handle unknown/unsupported params (strip them)
- `src/lib/api/elections.ts`: `getElections()` function will conditionally include new params
- New files needed: capabilities API function, `useApiCapabilities` hook, feature flag types

</code_context>

<specifics>
## Specific Ideas

- The capabilities response should be a flat, simple structure — just a list of supported param names and boolean flags for endpoint availability
- Feature flags should use camelCase names in TypeScript (e.g., `search`, `raceCategory`, `geographic`, `electionDate`, `filterOptions`) mapped from snake_case API param names
- The API spec should be detailed enough that the backend team can implement without follow-up questions — full request/response examples, not just param lists

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-feature-detection-infrastructure*
*Context gathered: 2026-03-14*
