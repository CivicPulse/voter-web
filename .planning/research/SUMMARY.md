# Project Research Summary

**Project:** Better Elections Discovery
**Domain:** Filter-driven discovery UI for large-list election data in a React SPA
**Researched:** 2026-03-13
**Confidence:** HIGH

## Executive Summary

This project overhauls the elections list page in voter-web to make it practical for users to find specific contests among 1,000+ race records. The existing codebase already has the right stack (React 19, TanStack Router/Query, shadcn/ui, Zod 4, ky) and -- critically -- already has a proven pattern for URL-synced filter state on other pages (voters, participants). The core work is migrating the elections list from its Zustand-based filter store to TanStack Router's `validateSearch` pattern, then systematically exposing API filter parameters that the UI currently ignores (date range, registration status, early voting status). No new frameworks or libraries are needed beyond two shadcn/ui components (Calendar for date range, Switch for boolean toggles) installed via CLI.

The recommended approach is a two-phase build. Phase 1 uses only filters the API already supports and focuses on the Zustand-to-URL migration plus exposing hidden API parameters. Phase 2 adds filters that require backend changes (server-side text search, race category, geographic filtering, election date) using a feature-detection pattern that shows controls only when the API responds to the new parameters. This phased approach lets the frontend ship independently of backend timelines while maintaining a good user experience throughout.

The primary risk is the feature-detection mechanism for Phase 2. FastAPI silently ignores unknown query parameters by default, making it impossible to reliably distinguish "API filtered by this parameter" from "API silently discarded it" through response inspection alone. The recommended mitigation is a configuration flag (simplest, most reliable) with an optional probe-based fallback. Secondary risks are well-understood state management pitfalls (dual source of truth during migration, navigation replacing all search params instead of merging, pagination not resetting on filter changes) that are preventable with disciplined use of established patterns already present in the codebase.

## Key Findings

### Recommended Stack

The existing stack requires zero changes. All core technologies are already installed and proven in the codebase across 15+ routes. The only additions are two shadcn/ui components and their transitive dependencies.

**Core technologies (all existing):**
- **TanStack Router `validateSearch` + Zod 4:** URL search params as single source of truth for filter state. Already proven in `/voters/` and `/elections/$electionDate`. Zod 4 works natively with TanStack Router (no adapter needed).
- **TanStack Query with `keepPreviousData`:** Data fetching with queryKey driven by URL params. Adding `placeholderData: keepPreviousData` prevents loading flicker between filter changes.
- **shadcn/ui Select, Input, Badge, Popover:** Already installed. Filter controls use these directly.

**New additions (minimal):**
- **shadcn/ui Calendar** (via CLI): Pulls in `react-day-picker` v9 + `date-fns` v4 as transitive deps. Used for date range picker with Popover.
- **shadcn/ui Switch** (via CLI): Boolean toggle for `registration_open` and `early_voting_active` filters. No external deps.
- **Custom `useDebouncedValue` hook** (6 lines): For server-side text search debounce. No library needed.

### Expected Features

**Must have (table stakes):**
- URL-persisted filter state -- foundational; every other feature depends on this
- Date range filter (date_from/date_to) -- highest-impact filter the API already supports but UI ignores
- Registration open / early voting active toggles -- API-supported, quick wins
- Result count display ("Showing X of Y elections") -- trivial, large UX improvement
- Active filter chips with removal and "Clear all" -- makes multi-filter state visible
- Empty state with filter guidance -- prevents user confusion and abandonment
- Pagination reset on filter change -- already implemented, must be preserved during migration

**Should have (differentiators):**
- Server-side text search (q param) -- the single biggest discovery improvement, replaces broken client-side search
- Race category filter -- authoritative API field replaces fragile client-side heuristic
- Geographic filter (county/district) -- narrows results, extends navigation context
- Election date exact filter -- specific day selection, complements date range
- Feature-detection infrastructure -- enables shipping UI before backend is ready

**Defer (v2+):**
- Sort controls (date, name, relevance) -- useful but not blocking
- Faceted counts per filter value -- requires significant backend support
- Map-based geographic selection -- complex, separate UI paradigm
- Keyboard shortcuts for filter actions -- polish after core is stable

### Architecture Approach

The architecture is a unidirectional data flow from URL search params through filter components to data fetching: URL (Zod schema via `validateSearch`) -> Filter UI (reads params, navigates to update) -> TanStack Query (queryKey includes params) -> API Client (strips undefined/sentinel values). Feature detection is a cross-cutting concern that probes API capabilities once per session and controls filter visibility. This is not new architecture -- it extends the established voter search pattern to the elections domain.

**Major components:**
1. **Route definition** (`elections/index.tsx`) -- Declares Zod search schema, provides `Route.useSearch()`
2. **Election Filter Bar** -- Reads search params, renders filter controls, navigates on change. Phase 1 filters always visible; Phase 2 filters conditionally rendered based on API capabilities.
3. **useElections hook** -- Accepts filter params as queryKey, calls API client with `placeholderData: keepPreviousData`
4. **API client** (`getElections`) -- Converts filter object to HTTP query params, stripping `undefined` and sentinel values
5. **Feature Detection hook** (`useApiCapabilities`) -- Probes API once per session, caches capability flags with `staleTime: Infinity`
6. **Active filter summary** -- Reads URL params, renders removable badges, provides "Clear all"

### Critical Pitfalls

1. **Dual source of truth (Zustand + URL)** -- During migration, keeping the Zustand store alongside URL params causes drift, stale filters on back-navigation, and lost state on refresh. Prevention: delete `useElectionFilters` entirely, use `validateSearch` + `Route.useSearch()` exclusively.

2. **Navigation replaces all search params** -- TanStack Router's `navigate({ search: { status: "active" } })` wipes all other params. Prevention: always use the functional form `navigate({ search: (prev) => ({ ...prev, status: "active", page: undefined }) })`.

3. **Feature-detection cannot distinguish "ignored" from "empty results"** -- FastAPI silently ignores unknown query parameters. Prevention: use a configuration flag as the primary detection mechanism, not response body inspection. Request a capabilities endpoint from the backend team.

4. **Timezone off-by-one in date filters** -- JavaScript `Date` objects shift calendar dates across timezones. Prevention: store and transmit dates as plain strings (`"2024-11-05"`) everywhere, never convert to/from `Date` objects for filter state.

5. **Client-side search removal creates UX regression** -- Current instant search on 25 items feels fast; server-side search adds latency. Prevention: hybrid approach during transition, `keepPreviousData` for smooth transitions, 300ms debounce.

## Implications for Roadmap

Based on research, the project divides into three phases with clear dependency ordering.

### Phase 1: URL Migration and Existing API Filters
**Rationale:** URL-persisted filter state is the foundation everything else depends on. Every filter control, active filter chip, and shareable link requires the Zustand-to-URL migration to complete first. This phase uses only API parameters that already exist, requiring zero backend coordination.
**Delivers:** Fully functional, URL-persisted filter bar with date range, status toggles, active filter chips, result counts, and improved empty states. Shareable and bookmarkable filtered views.
**Features addressed:** URL-persisted filter state, date range filter, registration/early voting toggles, result count display, active filter chips, empty state guidance, pagination reset
**Pitfalls to avoid:** Dual source of truth (P1), navigation replacing params (P2), pagination not resetting (P3), Zod `.default()` vs `.catch()` confusion (P6), timezone off-by-one in dates (P8), "all" sentinel collision (P9), history pollution (P13), loading flicker (P12)

### Phase 2: Feature-Detection Infrastructure
**Rationale:** Before any API-dependent filter can be rendered, the feature-detection mechanism must exist. This is a standalone infrastructure piece that gates all subsequent filters requiring new API parameters.
**Delivers:** `useApiCapabilities` hook that probes or checks configuration for API parameter support. Capability flags that control filter visibility.
**Features addressed:** Feature-detection infrastructure
**Pitfalls to avoid:** Cannot detect ignored params (P4), probing on every render (Anti-Pattern 4)

### Phase 3: API-Dependent Filters
**Rationale:** With feature-detection in place, new filters can be added incrementally as the backend deploys support. Server-side text search is highest priority (the core problem: finding a specific contest among 1K+ races). Race category and geographic filters layer on top.
**Delivers:** Server-side text search replacing client-side search, race category dropdown, county/district geographic filters, election date exact filter. All conditionally rendered based on API capabilities.
**Features addressed:** Server-side text search, race category filter, geographic filter, election date filter
**Pitfalls to avoid:** Client-side search removal regression (P5), dependent filters without cascading reset (P10), cache explosion from granular query keys (P7)

### Phase Ordering Rationale

- Phase 1 before everything: The Zod schema and URL state migration is a hard prerequisite. Building filters on Zustand and then rewriting them for URL params doubles the work.
- Phase 2 before Phase 3: Feature detection is the gate for all API-dependent filters. Building it first means Phase 3 filters can be developed in any order.
- Phase 3 is internally parallelizable: Once feature detection exists, text search, race category, geographic, and election date filters are independent and can be built in priority order without blocking each other.
- This ordering avoids the worst pitfalls: Dual source of truth is eliminated in Phase 1 before complexity increases. Feature detection is settled before UI for new params is built.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Feature Detection):** The detection strategy depends on backend behavior (FastAPI `extra=forbid` vs default). Need to coordinate with backend team on whether to add a capabilities endpoint, use response headers, or rely on configuration flags. STACK.md rates this area MEDIUM confidence.
- **Phase 3 (Geographic Filters):** County-to-district dependency cascading and the interaction with navigation context store need careful design. Filter dependency graph becomes non-trivial.

Phases with standard patterns (skip research-phase):
- **Phase 1 (URL Migration):** Well-documented patterns already proven in 15+ routes in this codebase. TanStack Router and Query docs are comprehensive. All HIGH confidence sources.
- **Phase 3 (Text Search, Race Category, Election Date):** Standard filter controls with feature-detection gating. The individual filter UX patterns are well-established.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified against `package.json`. Only 2 transitive deps added via shadcn CLI. No version conflicts. |
| Features | HIGH | Feature landscape well-mapped against competitors (Ballotpedia, Vote411, BallotReady). Clear differentiation as researcher/analyst tool vs voter-facing. |
| Architecture | HIGH | URL-as-state pattern already proven in 15+ routes. Migration path documented file-by-file. Unidirectional data flow is standard. |
| Pitfalls | HIGH | 13 pitfalls identified with concrete prevention strategies. Most reference existing codebase patterns (positive and negative examples). |

**Overall confidence:** HIGH

### Gaps to Address

- **Feature-detection strategy requires backend coordination:** The probe-based approach has known limitations with FastAPI's default behavior. A configuration flag is recommended but the team needs to decide on the specific mechanism. This should be resolved before Phase 2 planning begins.
- **API parameter specification for backend team:** The project needs a formal request document listing the 5 new API parameters (`q`, `district`, `county`, `race_category`, `election_date`) with expected behavior, query semantics, and response format. This document should be drafted during Phase 1 to give the backend team lead time.
- **Race category taxonomy:** The Zod schema assumes categories of `federal`, `state_senate`, `state_house`, `local`. The actual taxonomy depends on the backend team's implementation. Needs alignment before Phase 3 race category filter is built.
- **`useElectionFilters` scope after migration:** The Zustand store may contain `raceFilters` state used by the race list within individual election detail pages. Need to verify whether the store can be fully deleted or if a subset must be preserved for non-list-page usage.
- **Election date unique values:** For an "election date" exact filter, need to determine if the API can return distinct election dates efficiently, or if the frontend should derive them from the current result set.
- **Geographic filter data source:** For county/district dropdowns, need to determine where the option lists come from -- a dedicated API endpoint, or derived from existing boundary data already in the app.

## Sources

### Primary (HIGH confidence)
- [TanStack Blog: Search Params Are State](https://tanstack.com/blog/search-params-are-state) -- architectural philosophy for URL-as-state
- [TanStack Router: Validate Search Params with Schemas](https://tanstack.com/router/latest/docs/how-to/validate-search-params) -- Zod integration
- [TanStack Router: Navigate with Search Params](https://tanstack.com/router/latest/docs/how-to/navigate-with-search-params) -- functional updater pattern
- [TanStack Query: keepPreviousData](https://github.com/TanStack/query/discussions/6460) -- smooth filter transitions
- [Zod 4 + TanStack Router compatibility](https://github.com/TanStack/router/issues/4322) -- no adapter needed
- [shadcn/ui Calendar (react-day-picker v9)](https://ui.shadcn.com/docs/components/base/calendar) -- date range picker
- [shadcn/ui Date Picker docs](https://ui.shadcn.com/docs/components/radix/date-picker) -- range mode configuration
- Existing codebase patterns: `src/routes/voters/index.tsx`, `src/components/elections/ParticipantFilters.tsx` -- proven URL state patterns

### Secondary (MEDIUM confidence)
- [FastAPI: Forbid Extra Query Parameters](https://github.com/fastapi/fastapi/issues/2859) -- feature-detection implications
- [FastAPI: Unknown Parameters Discussion](https://github.com/fastapi/fastapi/discussions/9016) -- default ignore behavior
- [TanStack Router Issue #4973](https://github.com/TanStack/router/issues/4973) -- debounce and lifecycle gaps
- [Enterprise Filter UX Patterns -- Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-filtering) -- filter bar best practices
- [Filtering UX -- Smashing Magazine](https://smart-interface-design-patterns.com/articles/filtering-ux/) -- UX patterns
- [Filter Categories and Values -- NN/g](https://www.nngroup.com/articles/filter-categories-values/) -- filter design
- [Managing Filters In URL -- Trustica](https://trustica.cz/en/blog/2025/11/20/url-params-functions/) -- URL state patterns

---
*Research completed: 2026-03-13*
*Ready for roadmap: yes*
