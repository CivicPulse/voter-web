# Phase 2: Feature Detection Infrastructure - Research

**Researched:** 2026-03-14
**Domain:** API capability detection, conditional UI rendering, API specification documentation
**Confidence:** HIGH

## Summary

Phase 2 introduces a feature detection mechanism that probes the API for supported filter capabilities and conditionally renders filter controls in the elections list page. The implementation is straightforward: a new TanStack Query hook calls a `GET /elections/capabilities` endpoint, maps the response to semantic feature flags, and components use those flags to show/hide filter controls. The second deliverable is a detailed API specification document covering all new parameters and endpoints needed by the backend team.

The codebase already has strong patterns to follow. The existing `useApiCapabilities` hook (which probes OpenAPI for user management features) and `useUserRole` hook (5-minute staleTime, global scope) serve as direct templates. The existing `electionSearchSchema` Zod schema and `mapParamsToApiFilters` function already handle URL-to-API param mapping and will need extension to strip unsupported params. The `publicApi` client is the right choice for the capabilities endpoint since it doesn't require auth and doesn't redirect on 401.

**Primary recommendation:** Create a `useElectionCapabilities` hook with `publicApi`, 5-minute staleTime, 1 retry, that returns a typed feature flags object. Gate all new filter UI controls on these flags. Write the API spec as a comprehensive Markdown document at `.planning/API-SPEC.md`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Capabilities endpoint (`GET /elections/capabilities`) is the source of truth
- Endpoint returns a list of supported filter parameter names
- Frontend maps API param names to semantic feature flags (e.g., `q` -> `search`, `race_category` -> `raceCategory`)
- If capabilities endpoint returns 404 or errors, all new features are disabled -- only Phase 1 filters remain
- Strict fallback: if endpoint goes down after previously working, new filters disappear (no stale cache preservation)
- The capabilities endpoint itself is part of the API spec (INFRA-02) -- it doesn't exist yet
- Unsupported filters are hidden completely -- they don't render at all
- When API ships support for a filter, it appears automatically (reactive, mid-session)
- If user has URL params for unsupported features, strip those params from the URL
- No "coming soon" or disabled states -- clean UI showing only what works
- Capabilities fetched via TanStack Query with 5-minute staleTime, 10-minute gcTime
- Global scope -- query available app-wide, not scoped to elections page
- Retry: 1 retry on failure, then treat as "no capabilities available"
- Page renders immediately with Phase 1 filters; new filters appear after capabilities resolve
- Layout shift when new filters appear is acceptable
- API spec format: Markdown file at `.planning/API-SPEC.md`
- API spec depth: Full contracts for each parameter -- type, validation rules, behavior description, example request/response, edge cases
- API spec scope: Covers all new filter params (q, race_category, county, district, election_date), the capabilities endpoint, and the filter-options endpoint
- Race category taxonomy: describe the need but let backend define enum values

### Claude's Discretion
- Exact param names proposed in the API spec for geographic filters
- Whether to cross-reference the existing participation `q` param in the spec
- Hook implementation details (query key structure, error handling)
- How to structure the param-to-feature mapping (object literal, function, etc.)
- Compression algorithm for testing feature detection in unit tests

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | Feature-detection hook probes API capabilities and conditionally shows/hides new filter controls | `useElectionCapabilities` hook pattern, `publicApi` client, feature flag type system, URL param stripping via Zod schema `.catch()`, conditional rendering pattern |
| INFRA-02 | API feature request spec document for backend team covering: q, race_category, county, district, election_date, filter-options endpoint | API spec template and structure, existing participation `q` param precedent, FastAPI conventions, capabilities endpoint contract |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tanstack/react-query | ^5.90.21 | Capabilities data fetching + caching | Already used for all data fetching; `useQuery` with staleTime/gcTime is the project pattern |
| ky | ^1.14.3 | HTTP client for capabilities endpoint | `publicApi` instance already configured for unauthenticated endpoints |
| zod | ^4.3.6 | URL param schema with `.catch()` for unsupported param stripping | Already used for `electionSearchSchema`; `.optional().catch(undefined)` pattern strips invalid/unknown params |
| TypeScript | 5.9+ | Type system for feature flags and capabilities response | Strict mode enforced project-wide |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | ^4.0.18 | Unit tests for capability mapping, param stripping, feature flag logic | All pure functions and hook behavior |
| @playwright/test | ^1.58.2 | E2E tests for conditional filter rendering | Verify filters appear/disappear based on capabilities mock |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dedicated capabilities endpoint | OpenAPI spec probing (existing `useApiCapabilities` pattern) | Capabilities endpoint is more reliable, explicit, and doesn't require parsing a spec document; user decision is locked |
| TanStack Query | Zustand store for capabilities | TanStack Query handles caching, staleness, retries, and error states out of the box; Zustand would require manual fetching logic |
| Hiding unsupported filters | Disabled/greyed-out filters | User decision locked: hidden, not disabled |

**Installation:**
No new packages needed. All required libraries are already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── api/
│   │   └── elections.ts          # Add getElectionCapabilities() function
│   ├── hooks/
│   │   └── use-election-capabilities.ts  # New hook (INFRA-01)
│   └── election-search.ts       # Extend Zod schema for unsupported param stripping
├── types/
│   └── elections.ts              # Add ElectionCapabilities, ElectionFeatureFlags types
└── routes/
    └── elections/
        └── index.tsx             # Consume feature flags for conditional rendering
.planning/
└── API-SPEC.md                   # Backend API specification (INFRA-02)
```

### Pattern 1: Capabilities Hook (mirrors existing useUserRole)
**What:** A TanStack Query hook that fetches capabilities from the API and maps them to typed feature flags
**When to use:** Any component needing to conditionally render based on API capabilities
**Example:**
```typescript
// Source: Existing useUserRole hook pattern in src/lib/hooks/use-user-role.ts
// and useApiCapabilities in src/lib/hooks/use-api-capabilities.ts

import { useQuery } from "@tanstack/react-query"
import { publicApi } from "@/api/client"
import type { ElectionFeatureFlags } from "@/types/elections"

interface CapabilitiesResponse {
  supported_filters: string[]
  endpoints: { filter_options: boolean }
}

const EMPTY_FLAGS: ElectionFeatureFlags = {
  search: false,
  raceCategory: false,
  geographic: false,
  electionDate: false,
  filterOptions: false,
}

function mapCapabilities(response: CapabilitiesResponse): ElectionFeatureFlags {
  const params = new Set(response.supported_filters)
  return {
    search: params.has("q"),
    raceCategory: params.has("race_category"),
    geographic: params.has("county") || params.has("district"),
    electionDate: params.has("election_date"),
    filterOptions: response.endpoints?.filter_options ?? false,
  }
}

export function useElectionCapabilities(): ElectionFeatureFlags & { isLoading: boolean } {
  const { data, isPending } = useQuery({
    queryKey: ["election-capabilities"],
    queryFn: async () => {
      const response = await publicApi
        .get("elections/capabilities")
        .json<CapabilitiesResponse>()
      return mapCapabilities(response)
    },
    staleTime: 5 * 60 * 1000,    // 5 minutes
    gcTime: 10 * 60 * 1000,      // 10 minutes
    retry: 1,                    // 1 retry, then treat as unavailable
  })

  return {
    ...(data ?? EMPTY_FLAGS),
    isLoading: isPending,
  }
}
```

### Pattern 2: Param-to-Feature Mapping (object literal)
**What:** A simple object mapping API param names (snake_case) to frontend feature flag names (camelCase)
**When to use:** Converting the capabilities response into typed feature flags
**Example:**
```typescript
// Mapping object -- can be tested independently
const PARAM_TO_FEATURE: Record<string, keyof ElectionFeatureFlags> = {
  q: "search",
  race_category: "raceCategory",
  county: "geographic",
  district: "geographic",
  election_date: "electionDate",
}
```

### Pattern 3: URL Param Stripping for Unsupported Features
**What:** Extending the Zod search schema to strip URL params for features that aren't supported
**When to use:** When a user has URL params for unsupported features (e.g., bookmarked URL from when a feature was available, or manually typed)
**Example:**
```typescript
// The existing .optional().catch(undefined) pattern already handles this
// Invalid values fall through to undefined, which means the filter won't
// be sent to the API. Additional stripping logic in the page component
// can navigate away unsupported params.

// In ElectionsListPage component:
const capabilities = useElectionCapabilities()
const params = Route.useSearch()

// If URL has unsupported params, strip them
useEffect(() => {
  const cleaned = { ...params }
  let changed = false
  if (!capabilities.search && params.search) { cleaned.search = undefined; changed = true }
  // ... similar for other feature-gated params
  if (changed) navigate({ to: "/elections", search: cleaned, replace: true })
}, [capabilities, params])
```

### Pattern 4: Conditional Filter Rendering
**What:** Components render filter controls only when the corresponding feature flag is true
**When to use:** Every new filter control in the elections list page
**Example:**
```typescript
// In ElectionsListPage -- new filters appear only when capabilities confirm support
const { search: hasSearch, raceCategory: hasRaceCategory } = useElectionCapabilities()

{/* Phase 1 filters always render */}
<StatusFilter ... />
<TypeFilter ... />
<DateFilter ... />

{/* Phase 2+ filters render conditionally */}
{hasSearch && <ServerSearchInput ... />}
{hasRaceCategory && <RaceCategorySelect ... />}
```

### Anti-Patterns to Avoid
- **Caching stale capabilities on error:** The user decision is explicit -- strict fallback. If the endpoint fails, all new features must disappear immediately. Do NOT use `placeholderData` or `keepPreviousData` for this query.
- **Using the authenticated `api` client for capabilities:** The capabilities endpoint is public information. Use `publicApi` to avoid auth redirects.
- **Putting capabilities state in Zustand:** TanStack Query already provides global state, caching, and refetching. Adding Zustand is redundant complexity.
- **Probing individual parameters:** The older pattern (trying each param and checking the response) is fragile. The locked decision is a single capabilities endpoint.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cache invalidation for capabilities | Manual cache with setTimeout | TanStack Query `staleTime` + `gcTime` | Handles refetch on window focus, background refetch, garbage collection |
| Error retry logic | Custom retry with exponential backoff | TanStack Query `retry: 1` option | Already handles retry timing, failure counting |
| URL param validation | Manual string parsing | Zod schema `.optional().catch(undefined)` | Already established pattern; catches invalid values silently |
| Feature flag state management | Zustand store or React context | TanStack Query hook return value | Global singleton query, deduplication, no additional state layer |

**Key insight:** The existing TanStack Query infrastructure handles 90% of what this phase needs (caching, error handling, retries, global state). The custom code is just the mapping function and conditional rendering logic.

## Common Pitfalls

### Pitfall 1: Race Condition Between Capabilities and URL Params
**What goes wrong:** User navigates to `/elections?q=senate` but capabilities haven't loaded yet, so `q` is sent to the API which ignores it, returning unfiltered results. Then capabilities load, search appears, but the API request used `q` which was silently ignored.
**Why it happens:** Capabilities query and elections query run in parallel.
**How to avoid:** Do NOT send feature-gated params to the API until capabilities confirm support. The `mapParamsToApiFilters` function should only include `q`, `race_category`, etc. when the corresponding capability is `true`. Phase 1 filters always pass through.
**Warning signs:** Filtered results that don't match the active filter controls.

### Pitfall 2: Strict Fallback Causing Flash of Content
**What goes wrong:** Capabilities load successfully, new filters appear. Then on next refetch (after staleTime), the endpoint is down. New filters disappear mid-session, potentially while the user is interacting with them.
**Why it happens:** The user decision explicitly requires strict fallback -- no stale cache preservation.
**How to avoid:** This is the expected behavior per user decision. Ensure the UI handles this gracefully -- don't crash if a filter value exists in URL but the filter control is hidden. The URL param stripping effect handles cleanup.
**Warning signs:** Console errors when filter components unmount while focused.

### Pitfall 3: Infinite Navigation Loop from URL Stripping
**What goes wrong:** URL stripping effect runs, navigates to remove unsupported params, which triggers re-render, which runs the effect again.
**Why it happens:** The effect dependency array includes `params` which changes on every navigate.
**How to avoid:** Use `navigate({ replace: true })` to avoid adding history entries, and guard the effect with a `changed` boolean so it only navigates when there's actually something to strip. Also consider using `useRef` to track the last stripped params.
**Warning signs:** Rapid re-renders or browser console showing repeated navigation.

### Pitfall 4: Type Widening in ElectionFilters
**What goes wrong:** Adding new optional fields to `ElectionFilters` type causes the `getElections` function to send undefined params as query string values.
**Why it happens:** The `getElections` function uses conditional checks (`if (params?.field)`) but new fields might not have those guards.
**How to avoid:** This phase does NOT modify `getElections` or `ElectionFilters` -- that's Phase 3's job. Phase 2 only creates the detection mechanism and the spec document. The filter controls and API integration come later.
**Warning signs:** Network requests with `?q=undefined` in the query string.

### Pitfall 5: Not Handling the Capabilities Endpoint 404 vs Network Error
**What goes wrong:** A 404 (endpoint not yet deployed) and a network error are treated differently by `ky`. A 404 throws an HTTPError, while a network error throws a different error type. If you only catch one, the other crashes.
**Why it happens:** `publicApi` (ky) retries on 408/429/500/502/503/504 but NOT on 404. A 404 means "endpoint doesn't exist yet" and should be treated as "no capabilities."
**How to avoid:** The `queryFn` should catch ALL errors and return `EMPTY_FLAGS` (or let the query error and return defaults). Since `retry: 1` is specified, the hook should handle the error state by returning `EMPTY_FLAGS` when `data` is undefined.
**Warning signs:** Unhandled promise rejections in console when backend hasn't deployed the capabilities endpoint yet.

## Code Examples

Verified patterns from the existing codebase:

### Capabilities API Function
```typescript
// Source: Pattern from src/api/client.ts (publicApi) and src/lib/api/elections.ts
import { publicApi } from "@/api/client"

export interface CapabilitiesResponse {
  supported_filters: string[]
  endpoints: {
    filter_options: boolean
  }
}

export async function getElectionCapabilities(): Promise<CapabilitiesResponse> {
  return publicApi
    .get("elections/capabilities")
    .json<CapabilitiesResponse>()
}
```

### Feature Flags Type Definition
```typescript
// Source: New type to add to src/types/elections.ts
export interface ElectionFeatureFlags {
  /** Server-side text search via `q` param */
  search: boolean
  /** Race category filter via `race_category` param */
  raceCategory: boolean
  /** Geographic filters via `county` and/or `district` params */
  geographic: boolean
  /** Election date exact filter via `election_date` param */
  electionDate: boolean
  /** Filter options endpoint availability */
  filterOptions: boolean
}
```

### Hook with Error Fallback (Full Implementation)
```typescript
// Source: Pattern from src/lib/hooks/use-user-role.ts and use-api-capabilities.ts
import { useQuery } from "@tanstack/react-query"
import { getElectionCapabilities } from "@/lib/api/elections"
import type { ElectionFeatureFlags } from "@/types/elections"

const EMPTY_FLAGS: ElectionFeatureFlags = {
  search: false,
  raceCategory: false,
  geographic: false,
  electionDate: false,
  filterOptions: false,
}

function mapCapabilitiesToFlags(
  response: { supported_filters: string[]; endpoints: { filter_options: boolean } }
): ElectionFeatureFlags {
  const params = new Set(response.supported_filters)
  return {
    search: params.has("q"),
    raceCategory: params.has("race_category"),
    geographic: params.has("county") || params.has("district"),
    electionDate: params.has("election_date"),
    filterOptions: response.endpoints?.filter_options ?? false,
  }
}

export function useElectionCapabilities(): ElectionFeatureFlags & { isLoading: boolean } {
  const { data, isPending } = useQuery({
    queryKey: ["election-capabilities"],
    queryFn: async () => {
      const response = await getElectionCapabilities()
      return mapCapabilitiesToFlags(response)
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  })

  return {
    ...(data ?? EMPTY_FLAGS),
    isLoading: isPending,
  }
}
```

### Unit Test Pattern for Mapping Function
```typescript
// Source: Pattern from tests/routes/elections-search-schema.test.ts
import { describe, it, expect } from "vitest"

describe("mapCapabilitiesToFlags", () => {
  it("maps q to search feature flag", () => {
    const result = mapCapabilitiesToFlags({
      supported_filters: ["q"],
      endpoints: { filter_options: false },
    })
    expect(result.search).toBe(true)
    expect(result.raceCategory).toBe(false)
  })

  it("maps county OR district to geographic feature flag", () => {
    const result = mapCapabilitiesToFlags({
      supported_filters: ["county"],
      endpoints: { filter_options: false },
    })
    expect(result.geographic).toBe(true)
  })

  it("returns all false for empty supported_filters", () => {
    const result = mapCapabilitiesToFlags({
      supported_filters: [],
      endpoints: { filter_options: false },
    })
    expect(result).toEqual({
      search: false,
      raceCategory: false,
      geographic: false,
      electionDate: false,
      filterOptions: false,
    })
  })
})
```

### Unit Test Pattern for Hook (with TanStack Query wrapper)
```typescript
// Source: Pattern from tests/lib/hooks/use-elections.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createWrapper } from "@/test/render"

vi.mock("@/lib/api/elections", () => ({
  getElectionCapabilities: vi.fn(),
}))

import { getElectionCapabilities } from "@/lib/api/elections"
const mockedGetCapabilities = vi.mocked(getElectionCapabilities)

describe("useElectionCapabilities", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns all flags false when endpoint returns 404", async () => {
    mockedGetCapabilities.mockRejectedValueOnce(new Error("404"))

    const { result } = renderHook(() => useElectionCapabilities(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.search).toBe(false)
    expect(result.current.raceCategory).toBe(false)
  })
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| OpenAPI spec probing (`useApiCapabilities`) | Dedicated capabilities endpoint | This phase | More reliable, explicit contract, no spec parsing |
| Client-side search (current) | Server-side search with `q` param (Phase 3) | After API implementation | Search works across all pages, not just current 25 |
| `categorizeRace()` heuristic | API `race_category` field (Phase 3) | After API implementation | Authoritative categories, no fragile string matching |

**Deprecated/outdated:**
- The existing `useApiCapabilities` hook probes `/openapi.json` -- this pattern is NOT being extended. The new election capabilities hook uses a dedicated endpoint.
- The existing client-side search in `ElectionsListPage` will be replaced in Phase 3 once the `q` param is detected as supported.

## Open Questions

1. **Geographic filter param naming**
   - What we know: The user wants `county` and `district` filters. The API data model has `district` as a text field on elections.
   - What's unclear: Whether the API will use `county` and `district` as separate params, or a combined `geography`/`geo` param.
   - Recommendation: Propose `county` and `district` as separate params in the spec (matches existing data model fields). The `geographic` feature flag covers both -- it's true if either param is supported.

2. **Capabilities response shape**
   - What we know: The user wants "a list of supported param names and boolean flags for endpoint availability."
   - What's unclear: Whether the capabilities response should include version info or additional metadata.
   - Recommendation: Keep it minimal: `{ supported_filters: string[], endpoints: { filter_options: boolean } }`. This is simple, extensible, and matches the user's stated preference for a flat structure.

3. **Existing participation `q` param precedent**
   - What we know: The participation endpoint (`GET /elections/{id}/participation`) already supports a `q` param for text search across voter names.
   - What's unclear: Whether the elections list `q` param should behave identically (exact same search semantics) or differently.
   - Recommendation: Cross-reference in the API spec. Note that the existing `q` on participation searches voter names, while the proposed `q` on elections should search election name + district. Different domains, same param convention.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + @testing-library/react |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test -- --run && npm run test:e2e` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01a | mapCapabilitiesToFlags correctly maps param names to feature flags | unit | `npx vitest run tests/lib/election-capabilities.test.ts -t "mapCapabilitiesToFlags"` | Wave 0 |
| INFRA-01b | useElectionCapabilities returns EMPTY_FLAGS on error/404 | unit | `npx vitest run tests/lib/hooks/use-election-capabilities.test.ts -t "returns all false"` | Wave 0 |
| INFRA-01c | useElectionCapabilities returns correct flags on success | unit | `npx vitest run tests/lib/hooks/use-election-capabilities.test.ts -t "returns flags"` | Wave 0 |
| INFRA-01d | URL params for unsupported features are stripped | unit | `npx vitest run tests/routes/elections-search-schema.test.ts -t "strip unsupported"` | Wave 0 |
| INFRA-01e | Filter controls conditionally render based on capabilities | e2e | `npx playwright test e2e/elections-list.spec.ts -g "feature detection"` | Wave 0 |
| INFRA-02 | API spec document exists with all required sections | manual-only | Verify file exists at `.planning/API-SPEC.md` with required content | N/A |

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm test -- --run && npm run test:e2e`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/lib/election-capabilities.test.ts` -- covers mapping function (INFRA-01a)
- [ ] `tests/lib/hooks/use-election-capabilities.test.ts` -- covers hook behavior (INFRA-01b, INFRA-01c)
- [ ] Extend `tests/routes/elections-search-schema.test.ts` -- covers param stripping (INFRA-01d)
- [ ] Extend `e2e/elections-list.spec.ts` -- covers conditional rendering (INFRA-01e)

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/lib/hooks/use-api-capabilities.ts` -- existing capability detection pattern
- Existing codebase: `src/lib/hooks/use-user-role.ts` -- TanStack Query hook with 5min staleTime pattern
- Existing codebase: `src/lib/election-search.ts` -- Zod schema with `.optional().catch(undefined)` pattern
- Existing codebase: `src/api/client.ts` -- `publicApi` client for unauthenticated endpoints
- Existing codebase: `src/lib/api/elections.ts` -- `getElections()` API function pattern and existing `q` param on participation endpoint
- Existing codebase: `tests/lib/hooks/use-elections.test.tsx` -- hook testing pattern with `createWrapper`

### Secondary (MEDIUM confidence)
- TanStack Query v5 docs -- `staleTime`, `gcTime`, `retry` options behavior (verified against project usage)
- Zod 4 docs -- `.optional().catch()` chaining (verified in `electionSearchSchema`)

### Tertiary (LOW confidence)
- None -- all findings verified against existing codebase patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all patterns exist in codebase
- Architecture: HIGH -- direct adaptation of existing `useApiCapabilities` and `useUserRole` patterns
- Pitfalls: HIGH -- derived from concrete code paths in the existing codebase (ky error handling, TanStack Query caching, React effect loops)

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable -- no dependency changes expected)
