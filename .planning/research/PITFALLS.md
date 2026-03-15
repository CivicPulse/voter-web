# Domain Pitfalls

**Domain:** Election discovery with advanced filtering, URL-synced state, and API feature-detection
**Researched:** 2026-03-13

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Dual Source of Truth -- Zustand Store AND URL for Filter State

**What goes wrong:** The elections list page currently stores all filter state in a Zustand store (`useElectionFilters`) with zero URL synchronization. The voter search page and participant list already use TanStack Router's `validateSearch` with URL search params as the source of truth. Migrating the elections list to URL-synced state means choosing ONE authoritative location. If the Zustand store is kept alongside URL params "temporarily" or for "internal convenience," they inevitably drift: a user changes filters via the URL (back button, paste a shared link), the Zustand store has stale values, the query fires with the wrong params, and the UI shows contradictory state.

**Why it happens:** The existing `useElectionFilters` Zustand store works fine today because filters are not in the URL. During migration, the temptation is to keep the store for "local" state (like the search input text before debounce) while also syncing to the URL. This creates an implicit dependency chain: input -> store -> URL -> query, when it should be input -> URL -> query.

**Consequences:**
- Back/forward browser navigation shows stale filters
- Shared URLs do not reproduce the same view
- Page refresh loses all filter selections
- Race conditions between store updates and URL updates
- Two codepaths for reading filter state = twice the bugs

**Prevention:**
- Delete `useElectionFilters` entirely for the elections list. Move to `validateSearch` + `Route.useSearch()` as the single source of truth, matching the pattern already used in `/voters/` and `/elections/$electionDate` (participant filters).
- Use `navigate({ search: (prev) => ({ ...prev, ...updates }) })` for partial updates, never a Zustand setter.
- Keep only ONE piece of ephemeral local state: the raw search input text (before debounce). This lives in `useState`, not Zustand, and is reconciled to URL params via a debounce timer.

**Detection:**
- If any component imports both `useElectionFilters` and `Route.useSearch()` for the same data, you have the dual-source problem.
- If pressing the browser back button does not revert filters, the URL is not the source of truth.

**Phase relevance:** Phase 1 (expose existing API filters). This must be resolved at the very start before adding new filters.

---

### Pitfall 2: Navigation Replaces All Search Params Instead of Merging

**What goes wrong:** TanStack Router's `navigate({ search: { status: "active" } })` replaces ALL search params with just `{ status: "active" }`, wiping out page, election_type, date_from, and every other filter. The user selects three filters, changes one, and the other two vanish.

**Why it happens:** TanStack Router uses replace semantics by default for the `search` option. Developers coming from `URLSearchParams.set()` (which only touches one key) assume `navigate({ search: ... })` merges. It does not. The codebase's participant list (`ElectionParticipantList.tsx`) already handles this correctly via an `onUpdate` callback that spreads previous params, but the elections list has no such mechanism since it uses Zustand.

**Consequences:**
- Users lose filter selections when changing any single filter
- Pagination resets unexpectedly (or worse, persists when it should reset)
- Difficult to debug because the URL looks "correct" for the one filter that was just changed

**Prevention:**
- ALWAYS use the functional form: `navigate({ search: (prev) => ({ ...prev, status: "active", page: undefined }) })`
- Create a single `updateElectionSearch` helper function used by all filter controls, analogous to the `updateFilter` pattern in `ParticipantFilters.tsx`.
- Include `page: undefined` in every filter change to reset pagination (see Pitfall 3).
- Consider a custom hook like `useElectionSearchUpdater()` that wraps navigate and enforces the merge + page-reset pattern.

**Detection:**
- Changing filter A causes filter B to disappear from the URL.
- Review: any call to `navigate({ search: { ... } })` that uses an object literal (not a function) is almost certainly a bug.

**Phase relevance:** Phase 1. Every filter update from day one must use the merge pattern.

---

### Pitfall 3: Forgetting to Reset Pagination When Filters Change

**What goes wrong:** User is on page 5 of results, applies a new filter that narrows results to 2 pages. The URL still says `page=5`. The API returns an empty page or errors. User sees "No results found" and thinks the filter is broken.

**Why it happens:** Pagination state (`page`) and filter state (`status`, `election_type`, etc.) live in the same URL search params but are conceptually independent. Developers wire up filter changes without thinking about page. The existing elections list manually calls `setPage(1)` when filters change, but this will need to be reimplemented when pagination moves to URL params.

**Consequences:**
- Empty results for valid filter combinations
- Confusing "Page 5 of 2" display
- Users learn to manually reset to page 1 (terrible UX)

**Prevention:**
- The `updateElectionSearch` helper from Pitfall 2 should ALWAYS set `page: undefined` (which removes it from URL, defaulting to page 1) when any non-page filter changes.
- Separate the update paths: filter changes reset page; page changes preserve filters.
- The Zod schema should use `.catch(undefined)` for page so that invalid/missing page values gracefully default to 1 in the component.
- TanStack Query's query key already handles this naturally: `["elections", "list", filters, page]` -- when filters change and page resets, a new query fires automatically.

**Detection:**
- Set a filter, navigate to page 3, change the filter. If the URL still shows `page=3`, the bug exists.
- Watch for the pattern `onUpdate({ someFilter: value })` without `page: undefined`.

**Phase relevance:** Phase 1. Must be correct from the first filter migration.

---

### Pitfall 4: Feature-Detection That Cannot Distinguish "Ignored" from "Empty Results"

**What goes wrong:** The project requires feature-detection for new API params (`q`, `district`, `county`, `race_category`, `election_date`). The plan is: send the param, see if the API responds differently. But FastAPI silently ignores unknown query parameters by default. Sending `?q=senate` to an API that does not support `q` returns the same unfiltered results as `?q=` with no `q` support -- there is no error, no warning header, nothing in the response to distinguish "I filtered by this" from "I ignored this."

**Why it happens:** FastAPI (and most REST frameworks) are designed to ignore unknown params for forward-compatibility. The frontend cannot tell whether the API used the param or discarded it just by looking at the response body. This is not a bug -- it is the HTTP/REST standard behavior.

**Consequences:**
- UI shows a search box that appears to work but is actually doing nothing (returning unfiltered results)
- Users type a search query, see results, and assume they are filtered -- they are not
- False confidence that the feature is working
- Impossible to know when the API team actually deploys the new param support

**Prevention:**
- Do NOT rely on response body inspection to detect feature support. Instead, use one of these strategies:
  1. **Dedicated capability endpoint:** Ask the API team to add a `GET /capabilities` or `GET /elections?_describe_params=true` endpoint that lists supported filter params. Cache this at app startup.
  2. **Response header convention:** API includes a custom header like `X-Applied-Filters: status,election_type` listing which params were actually used. Frontend checks if `q` appears in the header.
  3. **Known-result probe:** Send a request with a filter value that MUST return different results (e.g., `?q=ZZZZNOTAREALRACE`). If results are empty, the param was used. If results are unchanged from unfiltered, the param was ignored. This is fragile but works as a one-time bootstrap check.
  4. **Configuration flag (simplest):** Ship the UI with a config/feature flag that the frontend checks. Backend team flips it when they deploy. No runtime detection needed.
- Strategy 4 (config flag) is the most reliable and should be the default. Runtime detection (strategies 1-3) is a nice-to-have but adds complexity.

**Detection:**
- If you cannot write a unit test that distinguishes "API supports q" from "API ignores q" using only the HTTP response, your feature-detection is broken.
- If the search box is visible but the API has not deployed `q` support, users are being misled.

**Phase relevance:** Phase 2 (new API filters). This is THE central design challenge for feature-detection and must be decided before building any UI for new params.

---

### Pitfall 5: Client-Side Search Removal Creates a UX Regression During Transition

**What goes wrong:** The current client-side search filters the current page of 25 results instantly (no network round-trip, no debounce needed). When server-side search replaces it, there is a 200-500ms latency on every keystroke (or a debounce delay), plus loading spinners. Users who were happy with instant filtering now perceive the feature as slower and broken, even though it searches across ALL results instead of just 25.

**Why it happens:** Client-side filtering is immediate because it operates on already-fetched data. Server-side search requires a network round-trip. If the transition happens abruptly (remove client-side, add server-side), the UX degrades during the transition period.

**Consequences:**
- Users complain the search "got slower"
- If debounce is too aggressive (>500ms), the UI feels laggy
- If debounce is too short (<200ms), the API gets hammered with requests on every keystroke
- If the server-side search API is not yet deployed, removing client-side search leaves users with NO search capability

**Prevention:**
- **Hybrid approach during transition:** Keep client-side search as the immediate filter on the current page. When the server-side `q` param is detected as available (feature flag), switch the search input to debounced server-side search with `useDeferredValue` or a 300ms debounce timer.
- Show a subtle indicator (e.g., "Searching all elections..." vs "Searching this page...") so users understand the scope change.
- Use `placeholderData: keepPreviousData` in TanStack Query (formerly `keepPreviousData: true`) to avoid loading flicker between debounced requests. This shows the previous results while the new query loads.
- Set debounce to 300ms -- fast enough to feel responsive, slow enough to avoid API spam.
- The current `useDeferredValue` pattern in the elections list is a good start; it just needs to be wired to URL params instead of Zustand.

**Detection:**
- Type in the search box and watch the network tab. If every keystroke fires a request, debounce is missing.
- If the search box is empty and results show a loading spinner, previous-data preservation is missing.

**Phase relevance:** Phase 2 (server-side search). Must be planned during Phase 1 architecture so the search input is already wired to URL params and ready for the server-side switch.

## Moderate Pitfalls

### Pitfall 6: Zod Schema Defaults vs `.catch()` Semantics Confusion

**What goes wrong:** Using `.default("all")` in the Zod validateSearch schema causes "all" to always appear in the URL, even when the user has not set any filter. URLs become verbose: `/elections?status=all&election_type=all&page=1`. More importantly, `.default()` changes the type to always-present (non-optional), which makes it impossible to distinguish "user explicitly chose all" from "no filter set."

**Why it happens:** Zod's `.default()` inserts the value when the input is `undefined`. `.catch()` inserts the value when parsing fails. `.optional().catch(undefined)` passes through valid values and falls back to `undefined` for invalid ones. The codebase already uses `.catch(undefined)` correctly in the participant list schema, but the elections list has no schema yet.

**Prevention:**
- Use `.optional().catch(undefined)` for all filter params in the Zod schema, matching the existing pattern in `$electionDate.tsx`.
- Map `undefined` to "all" in the UI component (e.g., `value={params.status ?? "all"}`), not in the schema.
- Map `undefined` to "omit from API request" in the API call (e.g., `if (params.status) searchParams.status = params.status`), which the existing `getElections()` already does correctly.
- This keeps URLs clean: `/elections` means "no filters" and `/elections?status=active` means "one filter."

**Detection:**
- If a clean `/elections` URL immediately rewrites to `/elections?status=all&election_type=all`, the schema is using `.default()` instead of `.optional().catch()`.

**Phase relevance:** Phase 1. Schema design is the first thing to get right.

---

### Pitfall 7: TanStack Query Cache Explosion from Too-Granular Query Keys

**What goes wrong:** With 6+ filter params plus page, the query key `["elections", "list", { status, election_type, date_from, date_to, registration_open, early_voting_active, q, district, county, race_category, election_date, page }]` creates a unique cache entry for every distinct combination. Users exploring filters generate dozens of cache entries that are never reused.

**Why it happens:** TanStack Query uses deep equality on query keys. Every unique filter combination is a separate cache entry. With 10 filter params, the combinatorial space is enormous.

**Consequences:**
- Memory usage grows as users explore filters
- `queryClient.invalidateQueries({ queryKey: ["elections", "list"] })` is needed to invalidate all variations, but it is easy to forget the prefix and only invalidate one specific combination
- `staleTime` and `gcTime` need tuning to prevent stale data from lingering

**Prevention:**
- Normalize filter values before they enter the query key: strip `undefined` values, sort keys. This prevents `{ status: undefined, page: 1 }` and `{ page: 1 }` from creating separate cache entries.
- Set `gcTime` (garbage collection time) to a reasonable value like 5 minutes (default is already 5 minutes) so abandoned filter combinations are cleaned up.
- Keep `staleTime` at 30 seconds (current value) to balance freshness with request reduction.
- When invalidating, always use the prefix: `queryClient.invalidateQueries({ queryKey: ["elections"] })`.

**Detection:**
- Open React Query DevTools and watch cache entries grow as you change filters. If you see 20+ entries for the same list endpoint, normalization is missing.

**Phase relevance:** Phase 1-2. Gets worse as more filters are added.

---

### Pitfall 8: Date Filter UX with Timezone Mismatches

**What goes wrong:** Election dates are stored as date strings (`"2024-11-05"`) without timezone info. Date picker components typically produce `Date` objects in the user's local timezone. Converting a `Date` to an ISO string for the URL or API can shift the date by a day depending on UTC offset: a user in EST picks November 5, the Date object is `2024-11-05T00:00:00-05:00`, `toISOString()` produces `2024-11-05T05:00:00Z`, which is still November 5 -- but if the user is in a timezone west of UTC-12 or east of UTC+12, the date can shift.

**Why it happens:** JavaScript `Date` is timezone-aware but election dates are calendar dates (no timezone). Mixing the two is a classic source of off-by-one-day bugs.

**Consequences:**
- Date range filters miss elections on boundary dates
- Different users see different results for the same date filter
- The bug only manifests for users in certain timezones, making it hard to reproduce

**Prevention:**
- Store and transmit dates as plain strings (`"2024-11-05"`) everywhere: URL params, API params, Zod schema. Never convert to/from `Date` objects for the filter state.
- Use inputs/components that provide `YYYY-MM-DD` directly and keep that string unchanged in URL/API/state. Avoid `Date` object round-trips (`new Date(...)`, `toISOString()`) for filter state.
- The existing codebase already uses string dates (`election.election_date + "T00:00:00"`) with explicit local-time parsing for display. Follow this pattern.

**Detection:**
- Set `date_from=2024-11-05` in the URL. If any election dated 2024-11-05 is excluded from results, there is a timezone mismatch.

**Phase relevance:** Phase 1 (date_from/date_to filters).

---

### Pitfall 9: "All" Sentinel Value Collides with Valid Data

**What goes wrong:** Using the string `"all"` as a sentinel for "no filter" in Select components works until a real data value happens to be `"all"`. More practically for this project: using `undefined` in URL params is correct, but shadcn/ui `Select` requires a non-empty string value. The existing codebase uses `value={params.p_county ?? "all"}` with a `<SelectItem value="all">` placeholder. If `onValueChange` does not strip `"all"` back to `undefined`, the literal string `"all"` ends up in the URL and is sent to the API.

**Why it happens:** The `Select` component from Radix UI (underlying shadcn/ui) does not support `undefined` or empty string as a controlled value. Developers use a placeholder string and must manually map it back.

**Consequences:**
- API receives `?status=all` which may cause a 422 Validation Error (FastAPI validates enum values)
- URL shows `?status=all` which looks correct to developers but is actually sending a bad value

**Prevention:**
- Always map: `onValueChange={(v) => updateFilter({ status: v === "all" ? undefined : v })}` -- this pattern is already used correctly in `ParticipantFilters.tsx`, so follow it exactly.
- In the API layer, filter out `"all"` values defensively: `if (params?.status && params.status !== "all")` -- the existing `getElections()` already does this.
- Add a Zod refinement or transform in the validateSearch schema to reject `"all"` as a valid URL value: `.refine(v => v !== "all")`.

**Detection:**
- Check the network tab: if any request includes `status=all` or `election_type=all` as a query parameter, the mapping is broken.

**Phase relevance:** Phase 1. Every Select component needs this.

---

### Pitfall 10: Dependent Filters Without Cascading Reset

**What goes wrong:** When county filter is set to "Bibb" and district filter is set to "Bibb County Commission District 1," changing county to "Houston" should clear the district filter because "Bibb County Commission District 1" does not exist in Houston County. If district is not reset, the API returns no results, and the user sees an empty state with an apparently-valid filter combination.

**Why it happens:** Independent filters have no dependency relationships. Dependent filters (county -> district, county -> precinct) require cascading resets. The existing `ParticipantFilters.tsx` already handles this correctly for county -> precinct with a `useEffect` + `prevCountyRef`, but the elections list will need similar logic for its own filter dependencies.

**Consequences:**
- Impossible filter combinations that return no results
- Users do not understand why results are empty
- The more filters added, the more dependency pairs to manage

**Prevention:**
- Document filter dependencies explicitly: `county -> [district, precinct]`, `election_date -> []` (no dependents), etc.
- When a parent filter changes, explicitly clear all dependent filters in the same `navigate()` call: `navigate({ search: (prev) => ({ ...prev, county: newCounty, district: undefined, precinct: undefined, page: undefined }) })`.
- Do NOT use `useEffect` for cascading resets (the current participant list pattern). Instead, handle it at the point of the filter change. Effects create one-render-later bugs where the stale dependent filter briefly fires an API request.

**Detection:**
- Change a parent filter. If the network tab shows a request with the OLD dependent filter value before a second request with the cleared value, the cascade is happening via effect (too late).

**Phase relevance:** Phase 2 (new filters with dependencies like county -> district).

## Minor Pitfalls

### Pitfall 11: URL Encoding of Special Characters in Search Text

**What goes wrong:** User searches for `"O'Brien"` or `"Smith & Jones"`. The search text goes into the URL as `?q=O%27Brien`. TanStack Router's custom search param serialization may handle this differently from standard `URLSearchParams`. If the round-trip (serialize -> URL -> parse -> display in input) does not preserve the original text, the input shows garbled text after a page reload.

**Prevention:**
- Use Zod's `.string().optional().catch(undefined)` for the search param. TanStack Router handles encoding/decoding.
- Test with special characters: apostrophes, ampersands, quotes, Unicode, and empty strings.
- Avoid double-encoding by never calling `encodeURIComponent` manually on values that TanStack Router already encodes.

**Phase relevance:** Phase 1 (search input migration to URL).

---

### Pitfall 12: Loading State Flicker When Only Page Changes

**What goes wrong:** User clicks "Next Page." The entire filter UI and results area flash to a loading skeleton, then back to results. This happens because the TanStack Query key changes and the new query starts from scratch.

**Prevention:**
- Use `placeholderData: keepPreviousData` in the `useElections` query options. This shows the previous page's data (slightly grayed or with a subtle indicator) while the next page loads, preventing the full-screen flash.
- The existing `useElections` hook does NOT use this option. It should be added.

**Phase relevance:** Phase 1. Improves UX immediately.

---

### Pitfall 13: Browser History Pollution from Rapid Filter Changes

**What goes wrong:** Each filter change calls `navigate()`, which by default pushes a new history entry. Clicking through 5 filter values creates 5 history entries. The user presses Back expecting to leave the page but instead steps through each filter state.

**Prevention:**
- Use `replace: true` for filter changes and debounced search updates: `navigate({ search: ..., replace: true })`.
- Use default push behavior ONLY for page changes (so Back returns to the previous page).
- The existing voter search page already uses `replace: true` in its navigation context effect.

**Phase relevance:** Phase 1. Affects every filter control.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 1: Migrate filters to URL | Dual source of truth (Pitfall 1) | Delete Zustand store, use validateSearch exclusively |
| Phase 1: Migrate filters to URL | Navigation replaces all params (Pitfall 2) | Use functional search updater, create shared helper |
| Phase 1: Migrate filters to URL | Pagination not reset (Pitfall 3) | Helper always sets `page: undefined` on filter change |
| Phase 1: Add date range filters | Timezone off-by-one (Pitfall 8) | Use string dates only, never Date objects in state |
| Phase 1: Zod schema design | `.default()` vs `.catch()` (Pitfall 6) | Use `.optional().catch(undefined)` for all filters |
| Phase 1: All filter controls | History pollution (Pitfall 13) | Use `replace: true` for filter changes |
| Phase 2: Feature-detection | Cannot detect ignored params (Pitfall 4) | Use config flag or capability endpoint, not response inspection |
| Phase 2: Server-side search | UX regression from latency (Pitfall 5) | Hybrid search, keepPreviousData, 300ms debounce |
| Phase 2: County/district filter | Dependent filter stale state (Pitfall 10) | Cascade resets at point of change, not in effects |
| Phase 2: Query key complexity | Cache explosion (Pitfall 7) | Normalize undefined values out of query keys |

## Sources

- [Search Params Are State -- TanStack Blog](https://tanstack.com/blog/search-params-are-state) -- Philosophy behind URL-as-state for TanStack Router
- [TanStack Router: How to Navigate with Search Parameters](https://tanstack.com/router/latest/docs/framework/react/how-to/navigate-with-search-params) -- Official guidance on merge vs replace semantics
- [TanStack Router Issue #4973: Search Params as Actual State](https://github.com/TanStack/router/issues/4973) -- Discussion of debounce, last-write-wins, and lifecycle gaps
- [TanStack Router Discussion #1207: Preserving Global Search Params](https://github.com/TanStack/router/discussions/1207) -- Cross-route param preservation patterns
- [TanStack Router Discussion #2107: Update Search Params Partially](https://github.com/TanStack/router/discussions/2107) -- Merge behavior discussion
- [FastAPI Issue #1190: How to Catch Misspelled/Unknown Parameters](https://github.com/fastapi/fastapi/issues/1190) -- Confirms FastAPI silently ignores unknown params by default
- [FastAPI Issue #2859: Forbid Extra Query Parameters](https://github.com/fastapi/fastapi/issues/2859) -- `model_config = {"extra": "forbid"}` for strict validation
- [Paginated Query Discussion #1209 -- TanStack Query](https://github.com/TanStack/query/discussions/1209) -- Pagination + filter cache key patterns
- [TanStack Pacer: Debouncing Guide](https://tanstack.com/pacer/latest/docs/guides/debouncing) -- Official debounce utility for TanStack ecosystem
- [Managing Filters In the URL in React -- Trustica (2025)](https://trustica.cz/en/blog/2025/11/20/url-params-functions/) -- Practical guide for URL filter state
- [Stop Fighting URL State in React -- react-zod-url-state (2025)](https://dev.to/zeeshanhshaheen/stop-fighting-url-state-in-react-introducing-react-zod-url-state-4ca9) -- Common problems with URL state sync
- [Advanced React State Management Using URL Parameters -- LogRocket](https://blog.logrocket.com/advanced-react-state-management-using-url-parameters/) -- Comprehensive URL state management patterns
