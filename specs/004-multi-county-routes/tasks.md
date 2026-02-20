# Tasks: Multi-State & Multi-County URL Routing

**Input**: Design documents from `/specs/004-multi-county-routes/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/routes.md, quickstart.md

**Tests**: Included — project constitution requires 95% coverage threshold and quickstart.md specifies unit tests for each phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify branch and project structure are ready for implementation

- [X] T001 Verify `004-multi-county-routes` branch is checked out and run `npm install` to ensure dependencies are current

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the data layer utilities and hooks that ALL user stories depend on. Maps to quickstart.md Phase A.

**CRITICAL**: No user story work can begin until this phase is complete

### Implementation

- [X] T002 Update `districtSlugPath()` in `src/lib/slugs.ts` — add new 4-arg overload `(name, boundaryType, stateAbbrev, county: string | null)` that generates `/districts/{state}/{countySlug}/{typeSlug}/{nameSlug}` for county-scoped or `/districts/{state}/{typeSlug}/{nameSlug}` for state-scoped districts; keep old 2-arg signature working (deprecated)
- [X] T003 [P] Create `src/hooks/useAvailableStates.ts` — depends on `useCountyBoundaries()`, extracts unique state FIPS prefixes from `boundary_identifier` fields, maps via `FIPS_TO_ABBREV` to `{ abbreviation, fipsCode, countyCount }[]`, exposes `isSingleState` convenience flag
- [X] T004 [P] Create `src/hooks/useDistrictSlugResolverScoped.ts` — accepts `(stateAbbrev, countySlug | null, typeSlug, nameSlug)`, filters boundary features by state FIPS prefix and optional county slug, returns `{ districtId, isLoading, isNotFound }`
- [X] T005 [P] Create `src/hooks/useDistrictDisambiguation.ts` — accepts `(typeSlug, nameSlug)`, finds ALL matching boundaries across states/counties, returns `{ matches: DisambiguationMatch[], isLoading, isSingleMatch }` with fully-qualified URLs

### Tests

- [X] T006 Update unit tests for `districtSlugPath()` in `tests/lib/slugs.test.ts` — test 4-arg overload for county-scoped and state-scoped URLs, verify deprecated 2-arg still works
- [X] T007 [P] Write unit tests for `useAvailableStates` in `tests/hooks/useAvailableStates.test.ts` — test single state, multiple states, loading state, `isSingleState` flag
- [X] T008 [P] Write unit tests for `useDistrictSlugResolverScoped` in `tests/hooks/useDistrictSlugResolverScoped.test.ts` — test state-level resolution, county-level resolution, not-found case, loading state
- [X] T009 [P] Write unit tests for `useDistrictDisambiguation` in `tests/hooks/useDistrictDisambiguation.test.ts` — test single match, multiple matches, zero matches, fully-qualified URL generation

**Checkpoint**: Foundation ready — all new hooks and utilities are implemented and tested. User story implementation can now begin.

---

## Phase 3: User Story 1 — State & County Selection (Priority: P1)

**Goal**: Enable users to navigate by state, with a state detail page showing the state's county map. Generalizes map components from Georgia-specific to any state.

**Independent Test**: Navigate from home to a state page (e.g., `/ga`), verify county map renders with correct bounds and URL contains state identifier. Click a county to verify navigation to `/counties/ga/bibb`.

### Implementation

- [X] T010 [US1] Rename `src/components/GeorgiaCountyMap.tsx` to `src/components/StateCountyMap.tsx` — remove `GA_CENTER`/`GA_ZOOM` hardcoding, auto-fit map bounds to data bbox using Turf.js `bbox()` and Leaflet `fitBounds()`, accept state-filtered county features as prop
- [X] T011 [P] [US1] Update `src/components/CountyDetailMap.tsx` — replace `GA_CENTER`/`GA_ZOOM` with neutral default center, keep existing `fitBounds` behavior
- [X] T012 [P] [US1] Update `src/components/DistrictDetailMap.tsx` — replace `GA_CENTER`/`GA_ZOOM` with neutral default center, keep existing `fitBounds` behavior
- [X] T012a [P] [US1] Update `src/components/LayerBar.tsx` to accept a `jurisdictionUnit` prop (default `"County"`) instead of hardcoded string in label text
- [X] T013 [US1] Create `src/routes/$state.tsx` — validate `$state` param against `ABBREV_TO_FIPS`, filter county boundaries by state FIPS, render `StateCountyMap`, active election banner, layer bar, drawer with `ElectedOfficialsCard` and `StateCensusProfileCard`
- [X] T014 [P] [US1] Write unit tests for `StateCountyMap` in `tests/components/StateCountyMap.test.tsx` — test auto-fit bounds, rendering with filtered county features, prop passing
- [X] T015 [US1] Write unit tests for state detail route in `tests/routes/$state.test.tsx` — test valid state param, invalid state rejection, county boundary filtering, overlay search param

**Checkpoint**: State detail page (`/$state`) is functional. Users can view any state's county map with correct bounds. Map components work for any state, not just Georgia.

---

## Phase 4: User Story 2 — Collision-Free District URLs (Priority: P1)

**Goal**: Add fully-qualified district URLs with state and county context. County-level districts include `/districts/{state}/{county}/{type}/{name}`, state-level include `/districts/{state}/{type}/{name}`.

**Independent Test**: Load district data for two counties with identically-named districts (e.g., "county-commission/005" in Bibb and Houston), navigate to each via its fully-qualified URL, verify correct district data displays.

### Implementation

- [X] T016 [P] [US2] Create `src/routes/districts/$state/$type/$name.tsx` — state-level district route (3 params), use `useDistrictSlugResolverScoped(state, null, type, name)`, render `DistrictDetailContent` with resolved UUID
- [X] T017 [P] [US2] Create `src/routes/districts/$state/$county/$type/$name.tsx` — county-level district route (4 params), use `useDistrictSlugResolverScoped(state, county, type, name)`, render `DistrictDetailContent` with resolved UUID
- [X] T018 [US2] Update `src/components/CountyDetailContent.tsx` — update district links to use new `districtSlugPath()` with state abbreviation and county from route params or resolved from FIPS
- [X] T019 [US2] Update `src/components/DistrictDetailContent.tsx` — update navigation links (county links, related district links) to use fully-qualified URLs with state/county context
- [X] T020 [US2] Update `handleDistrictDblClick` in `src/components/StateCountyMap.tsx` and `src/components/CountyDetailMap.tsx` to use new `districtSlugPath()` with state abbreviation and county from feature properties, navigating to fully-qualified district routes
- [X] T021 [P] [US2] Write unit tests for state-level district route in `tests/routes/districts/state-district.test.tsx` — test slug resolution, DistrictDetailContent rendering, invalid state handling
- [X] T022 [P] [US2] Write unit tests for county-level district route in `tests/routes/districts/county-district.test.tsx` — test slug resolution with county filter, rendering, invalid state/county handling

**Checkpoint**: All district URLs are collision-free. County-level districts include state+county in URL, state-level include state only. Internal navigation links generate fully-qualified URLs.

---

## Phase 5: User Story 3 — Backward-Compatible Legacy URLs (Priority: P2)

**Goal**: Existing URLs without state/county qualifiers continue to work via redirect or disambiguation.

**Depends on**: Phase 4 (US2) — new fully-qualified routes must exist as redirect targets

**Independent Test**: Visit `/districts/county-commission/005` (legacy), verify redirect to fully-qualified URL when single match, or disambiguation page when multiple matches. Visit `/counties/{uuid}`, verify redirect to `/counties/{state}/{county}`.

### Implementation

- [X] T023 [US3] Modify `src/routes/districts/$type/$name.tsx` — replace direct `DistrictDetailContent` rendering with `useDistrictDisambiguation(type, name)`; single match → `navigate(fullyQualifiedUrl, { replace: true })`; multiple → render `DisambiguationPage`; none → render not-found
- [X] T024 [P] [US3] Create `src/components/DisambiguationPage.tsx` — receives `DisambiguationMatch[]`, renders list of matches with state/county/district info and links to fully-qualified URLs using shadcn/ui `Card` components
- [X] T025 [US3] Modify `src/routes/counties/$countyId.tsx` — detect UUID format, fetch boundary detail to resolve state + county name, redirect to `/counties/$state/$county` with `replace: true`, preserve `overlay` search param through redirect
- [X] T026 [P] [US3] Write unit tests for legacy district disambiguation in `tests/routes/districts/legacy-disambiguation.test.tsx` — test single match redirect, multiple match disambiguation page, zero match not-found
- [X] T027 [P] [US3] Write unit tests for `DisambiguationPage` in `tests/components/DisambiguationPage.test.tsx` — test rendering with multiple matches, link generation, state/county display
- [X] T028 [P] [US3] Write unit tests for legacy county UUID redirect in `tests/routes/counties/legacy-county-redirect.test.tsx` — test redirect with resolved state/county, overlay param preservation, not-found handling

**Checkpoint**: All legacy URLs work. Single-match slugs redirect transparently. Collisions show disambiguation. UUID routes remain functional. No existing URL returns a 404.

---

## Phase 6: User Story 4 — State-Aware Home Page (Priority: P2)

**Goal**: Home page dynamically adapts to available states. Single state shows map inline. Multiple states show selection interface.

**Depends on**: Phase 3 (US1) — state page must exist for navigation targets

**Independent Test**: With one state: home page shows that state's county map (identical to current Georgia behavior). With multiple states: home page shows state selection with links to `/$state`.

### Implementation

- [X] T029 [US4] Modify `src/routes/index.tsx` — use `useAvailableStates()`, single state renders `StateCountyMap` inline (current behavior parameterized), multiple states renders `StateSelectionPage`; remove hardcoded `fipsState="13"`, `stateName="Georgia"`, and Georgia-specific overlay enum
- [X] T030 [P] [US4] Create `src/components/StateSelectionPage.tsx` — displays available states as cards or list, each linking to `/$state`, using shadcn/ui components
- [X] T031 [US4] Update `src/routes/__root.tsx` — add `useMatch` for `/$state` route, add route matching for new district route patterns, update `handleTypeChange` to navigate to `/$state` overlay on state page, update header title logic for state page context
- [X] T032 [P] [US4] Write unit tests for `StateSelectionPage` in `tests/components/StateSelectionPage.test.tsx` — test rendering with multiple states, link generation, state card display
- [X] T033 [US4] Write unit tests for updated home page in `tests/routes/index.test.tsx` — test single state auto-display, multiple state selection, `useAvailableStates` integration
- [X] T034 [US4] Write unit tests for updated root layout in `tests/routes/__root.test.tsx` — test new route matching, header title for state page, `handleTypeChange` navigation

**Checkpoint**: Home page adapts to available states. Single state shows map directly. Multiple states show selection. Root layout correctly handles all route patterns.

---

## Phase 7: User Story 5 — Contextual Voters & Elections (Priority: P3)

**Goal**: Voter and election views reflect the user's current geographic context. Pre-populate filters from navigation path.

**Independent Test**: Navigate from Bibb County detail page to Voters page — county filter defaults to "Bibb". Navigate directly to `/voters` — no filter pre-applied.

### Implementation

- [X] T035 [US5] Add geographic navigation context to Zustand store in `src/stores/navigation-context.ts` — track current state abbreviation and county slug from route navigation
- [X] T036 [US5] Update voter search page in `src/routes/voters/index.tsx` to read navigation context and pre-populate county filter when arriving from a county detail page
- [X] T037 [US5] Update election page in `src/routes/elections/index.tsx` to support state/county context filtering when navigating from a geographic page
- [X] T038 [US5] Write unit tests for navigation context store in `tests/stores/navigation-context.test.ts` and filter pre-population behavior

**Checkpoint**: Voter and election pages respect geographic context from navigation. Filters pre-populate when arriving from county/state pages. Direct navigation shows unfiltered data.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: E2E tests, visual verification, cleanup of deprecated code, documentation

- [X] T039 Write E2E test for multi-state navigation in `e2e/multi-state-navigation.spec.ts` — test state page rendering, county navigation from state, district URL resolution for both state-level and county-level
- [X] T040 [P] Write E2E test for legacy URL compatibility in `e2e/legacy-url-compat.spec.ts` — test legacy district slug redirect, disambiguation page, legacy UUID county redirect, and verify UUID district route (`/districts/{uuid}`) still renders correctly (FR-003 regression)
- [X] T041 Run full test suite (`npm test -- --run`) and linter (`npm run lint`) — fix any failures
- [X] T042 Visual verification using Playwright MCP — state page map rendering, disambiguation page layout, state selection page, verify screenshots saved to `screenshots/`
- [X] T043 Remove deprecated code paths — remove old 2-arg `districtSlugPath` signature if all callers updated, remove any unused Georgia-specific constants
- [X] T044 Update CLAUDE.md with new route patterns and any new conventions introduced
- [X] T045 Measure page load times for district and county detail routes before and after implementation to validate SC-006 (within 20% of baseline) — use browser DevTools or Lighthouse via Playwright MCP

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — uses `useAvailableStates`, `StateCountyMap`
- **US2 (Phase 4)**: Depends on Foundational — uses `districtSlugPath`, `useDistrictSlugResolverScoped`
- **US3 (Phase 5)**: Depends on US2 — redirects target the new fully-qualified routes from Phase 4
- **US4 (Phase 6)**: Depends on US1 — home page links to `/$state` routes from Phase 3
- **US5 (Phase 7)**: Depends on Foundational only — navigation context is orthogonal to route changes
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational (BLOCKS ALL)
    ↓                     ↓                ↓
Phase 3: US1 (P1)   Phase 4: US2 (P1)   Phase 7: US5 (P3)
    ↓                     ↓
Phase 6: US4 (P2)   Phase 5: US3 (P2)
    ↓                     ↓
         Phase 8: Polish
```

### Within Each User Story

- Implementation tasks before tests (write the code, then test it)
- Core components before integration points
- Commit after each task or logical group

### Parallel Opportunities

- **Phase 2**: T003, T004, T005 can run in parallel (different hook files); T007, T008, T009 can run in parallel (different test files)
- **Phase 3**: T011, T012 can run in parallel (different map components); T014 parallel with map tests
- **Phase 4**: T016, T017 can run in parallel (different route files); T021, T022 in parallel (different test files)
- **Phase 5**: T024 (DisambiguationPage) parallel with T023 (route modification); T026, T027, T028 in parallel (different test files)
- **Phase 6**: T030 (StateSelectionPage) parallel with other components; T032 parallel
- **After Foundational**: US1, US2, and US5 can ALL begin in parallel since they have no inter-dependencies
- **Phase 8**: T039, T040 can run in parallel (different E2E test files)

---

## Parallel Example: Foundational Phase

```bash
# Launch all hooks in parallel (different files, no dependencies):
Task: "Create useAvailableStates in src/hooks/useAvailableStates.ts"
Task: "Create useDistrictSlugResolverScoped in src/hooks/useDistrictSlugResolverScoped.ts"
Task: "Create useDistrictDisambiguation in src/hooks/useDistrictDisambiguation.ts"

# After hooks complete, launch all hook tests in parallel:
Task: "Write tests for useAvailableStates in tests/hooks/useAvailableStates.test.ts"
Task: "Write tests for useDistrictSlugResolverScoped in tests/hooks/useDistrictSlugResolverScoped.test.ts"
Task: "Write tests for useDistrictDisambiguation in tests/hooks/useDistrictDisambiguation.test.ts"
```

## Parallel Example: US1 + US2 After Foundational

```bash
# US1 and US2 can start simultaneously after Phase 2:
# Developer A (US1):
Task: "Rename GeorgiaCountyMap to StateCountyMap in src/components/StateCountyMap.tsx"
Task: "Create state detail page in src/routes/$state.tsx"

# Developer B (US2):
Task: "Create state-level district route in src/routes/districts/$state/$type/$name.tsx"
Task: "Create county-level district route in src/routes/districts/$state/$county/$type/$name.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US1 — State & County Selection
4. Complete Phase 4: US2 — Collision-Free District URLs
5. **STOP and VALIDATE**: Test US1 and US2 independently — new URLs work, maps render for any state
6. Deploy/demo if ready — new URLs work even without legacy support

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 + US2 → New URL structure works, maps generalized (MVP!)
3. US3 → Legacy URLs preserved via redirect/disambiguation
4. US4 → Home page adapts to multiple states
5. US5 → Navigation context pre-populates filters
6. Polish → E2E tests, visual verification, cleanup

### Single Developer Strategy

1. Phase 1 → Phase 2 (sequential, foundation first)
2. Phase 3 (US1) → Phase 4 (US2) — both P1, do sequentially
3. Phase 5 (US3) — depends on US2
4. Phase 6 (US4) — depends on US1
5. Phase 7 (US5) — can be done anytime after Phase 2
6. Phase 8 — polish after all stories complete

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group (per CLAUDE.md: "commit after completing each task, story, or phase")
- Stop at any checkpoint to validate story independently
- 95% coverage threshold required per project constitution
- All new route files auto-registered by TanStack Router Vite plugin (regenerates `routeTree.gen.ts`)
- Visual verification with Playwright MCP required after UI changes (per CLAUDE.md)
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- **Deferred tech debt**: `src/components/elections/PrecinctMapView.tsx` and `src/components/elections/ElectionResultsMap.tsx` also hardcode `GA_CENTER`/`GA_ZOOM` but are out of scope for this feature (election routes are not geographic-scoped per spec). Address in a future election-specific feature if needed.
