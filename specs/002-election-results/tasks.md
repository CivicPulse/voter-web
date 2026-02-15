# Tasks: Live Election Results Visualization

**Input**: Design documents from `/specs/002-election-results/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/elections-api.md, research.md, quickstart.md

**Tests**: Included — constitution requires 95% unit test coverage. Test infrastructure setup in Phase 1, test tasks in each user story phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project (SPA)**: `src/` at repository root, `tests/` for test files
- Routes: `src/routes/` (TanStack Router file-based routing)
- Components: `src/components/elections/` (shared), `src/routes/*/_components/` (route-specific)
- Hooks: `src/lib/hooks/`
- API client: `src/lib/api/`
- Types: `src/types/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create TypeScript types, API client, and test utilities that all user stories depend on

- [x] T001 Create all TypeScript types, constants, and utility functions in `src/types/elections.ts` per data-model.md (Election, ElectionEvent, CandidateResult, VoteMethodResult, CountyResult, ElectionResultsResponse, PaginatedElectionListResponse, admin request/response types, GeoJSON types, filter/UI state types, PARTY_COLORS, utility functions)
- [x] T002 Create election API client functions (public + admin) in `src/lib/api/elections.ts` per contracts/elections-api.md (getElections, getElectionDetail, getElectionResults, getElectionGeoJSON, getPrecinctGeoJSON, createElection, updateElection, refreshElection) using existing `ky` client pattern from `src/lib/api/admin.ts`
- [x] T003 [P] Create custom test render wrapper with QueryClientProvider and RouterProvider in `src/test/render.tsx` per research.md §4
- [x] T004 [P] Create election mock data factories for all types in `src/test/mocks/elections.ts` (mock Election, ElectionEvent, CandidateResult, CountyResult, ElectionResultsResponse, GeoJSON features)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Navigation, layout routes, and shared state that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Add "Elections" top-level nav item visible to all users (authenticated and unauthenticated) linking to `/elections` in `src/routes/__root.tsx`
- [x] T006 [P] Create elections layout route with shared layout structure in `src/routes/elections.tsx`
- [x] T007 [P] Create client-side election filter state hook (ElectionFilters + RaceFilters) using Zustand in `src/lib/hooks/use-election-filters.ts`
- [x] T008 [P] Add "Elections" item to admin sidebar navigation in `src/routes/admin.tsx`
- [x] T060 [P] Write unit tests for election filter state hook (filter updates, reset) in `tests/lib/hooks/use-election-filters.test.ts`

**Checkpoint**: Foundation ready — navigation links exist, layout routes created, filter state available. User story implementation can now begin.

---

## Phase 3: User Story 1 — Browse and Select Elections (Priority: P1) 🎯 MVP

**Goal**: Users can discover elections via a list page at `/elections`, select an election event to see its races at `/elections/$electionDate`, and select a race to navigate to its results page.

**Independent Test**: Click "Elections" nav → verify list loads with filtering → select an election → verify race list at `/elections/$electionDate` → select a race → verify navigation to `/elections/$electionDate/$electionId`.

### Implementation for User Story 1

- [x] T009 [US1] Create elections list query hook with client-side date grouping into ElectionEvent objects in `src/lib/hooks/use-elections.ts` (uses getElections API, groups by election_date, supports pagination and filter params)
- [x] T010 [P] [US1] Create election detail query hook in `src/lib/hooks/use-election-detail.ts` (fetches races for a specific date using date_from/date_to filters)
- [x] T011 [US1] Implement elections list page (grouped by date) at `/elections` in `src/routes/elections/index.tsx` showing election event cards with date, type(s), race count, status, and filter controls (status, type, date range) per FR-001/FR-002/FR-003/FR-015
- [x] T012 [US1] Create election date layout route in `src/routes/elections/$electionDate.tsx` with date validation and breadcrumb support
- [x] T013 [P] [US1] Create race list component with text search and category filter (Federal, State Senate, State House, Local) in `src/routes/elections/$electionDate/_components/race-list.tsx` per FR-003b
- [x] T014 [P] [US1] Create race list item component showing race name, district, and election status in `src/routes/elections/$electionDate/_components/race-list-item.tsx` per FR-003a
- [x] T015 [US1] Implement race list page for an election date at `/elections/$electionDate` in `src/routes/elections/$electionDate/index.tsx` using race-list and race-list-item components with empty state handling
- [x] T016 [P] [US1] Write unit tests for elections list hook (grouping logic, filtering, pagination) in `tests/lib/hooks/use-elections.test.ts`
- [x] T017 [P] [US1] Write unit tests for type utility functions (getPartyColor, getVotePercentage, getReportingPercentage, categorizeRace, getCertificationLabel, isActiveElection) in `tests/types/elections.test.ts`
- [x] T055 [P] [US1] Write unit tests for election detail hook (date filtering, race fetching) in `tests/lib/hooks/use-election-detail.test.ts`

**Checkpoint**: Users can browse elections, filter by type/status/date, view race lists, and navigate to a race. The election discovery flow is fully functional.

---

## Phase 4: User Story 2 — View Race Results on a County Map (Priority: P1)

**Goal**: Users see a choropleth county map colored by race results with switchable data layers (leading candidate, precincts reporting %, total votes) and county hover tooltips.

**Independent Test**: Select an election and race → verify map renders with colored counties → hover to confirm tooltips → toggle data layers → click a county to confirm selection state.

### Implementation for User Story 2

- [x] T018 [US2] Create race results query hook (fetches election detail + results JSON) in `src/lib/hooks/use-race-results.ts` per contracts (GET /elections/{id} + GET /elections/{id}/results)
- [x] T019 [P] [US2] Create county results GeoJSON hook in `src/lib/hooks/use-race-geojson.ts` (fetches GET /elections/{id}/results/geojson, returns CountyResultFeatureCollection)
- [x] T020 [P] [US2] Create map layer selector component with three data layer options (leading candidate, precincts reporting %, total votes) in `src/components/elections/MapLayerSelector.tsx` per FR-005
- [x] T021 [P] [US2] Create certification badge component displaying "Unofficial Results" or "Official Results" based on election status in `src/components/elections/CertificationBadge.tsx` per FR-013
- [x] T022 [US2] Create election results choropleth map component with data-driven GeoJSON styling, county hover tooltips (county name, reporting progress, candidate summary), county click handler, and layer switching in `src/components/elections/ElectionResultsMap.tsx` per FR-004/FR-005/FR-006
- [x] T023 [US2] Create race results page with map, layer selector, and certification badge at `/elections/$electionDate/$electionId` in `src/routes/elections/$electionDate/$electionId.tsx` displaying race name, district, and county choropleth map
- [x] T024 [P] [US2] Write component tests for MapLayerSelector (layer selection, active state) in `tests/components/elections/MapLayerSelector.test.tsx`
- [x] T025 [P] [US2] Write component tests for CertificationBadge (active vs finalized rendering) in `tests/components/elections/CertificationBadge.test.tsx`
- [x] T056 [P] [US2] Write unit tests for race GeoJSON hook (county GeoJSON fetching, caching) in `tests/lib/hooks/use-race-geojson.test.ts`

**Checkpoint**: Users can view race results on a county choropleth map with tooltips, switch data layers, and click counties. Map renders within 3s target (SC-002).

---

## Phase 5: User Story 3 — Review Detailed Race Results in a Drawer (Priority: P1)

**Goal**: Users view detailed race results in a vaul bottom drawer with race-wide summary, per-candidate vote counts/percentages, collapsible vote method breakdowns, and county-specific results on map click.

**Independent Test**: Open race results page → tap drawer trigger → verify race-wide results display → expand a candidate's vote methods → click a county on map → verify drawer updates to county-specific results.

### Implementation for User Story 3

- [x] T026 [P] [US3] Create candidate result row component with name, party, vote count, percentage bar, and collapsible vote method breakdown section in `src/components/elections/CandidateResultRow.tsx` per FR-008/FR-009
- [x] T027 [P] [US3] Create county results panel showing county name, precincts reporting/participating, and per-candidate results in `src/components/elections/CountyResultsPanel.tsx` per FR-010
- [x] T028 [US3] Create election results drawer (vaul) with trigger button, race-wide summary view, and county-specific view following existing demographics drawer pattern in `src/components/elections/ElectionResultsDrawer.tsx` per FR-007/FR-008
- [x] T029 [US3] Integrate drawer with race results page — wire county map click to update drawer with county-specific results, show race-wide summary by default in `src/routes/elections/$electionDate/$electionId.tsx` per FR-010
- [x] T030 [P] [US3] Write component tests for CandidateResultRow (rendering, vote method expand/collapse) in `tests/components/elections/CandidateResultRow.test.tsx`
- [x] T057 [P] [US3] Write component tests for ElectionResultsDrawer (trigger, race-wide view, county-specific view toggle) in `tests/components/elections/ElectionResultsDrawer.test.tsx`
- [x] T058 [P] [US3] Write component tests for CountyResultsPanel (county data rendering, candidate rows) in `tests/components/elections/CountyResultsPanel.test.tsx`

**Checkpoint**: Users can view complete race results in the drawer with expandable vote method breakdowns and county-specific drill-down. The core P1 experience (browse → map → drawer) is complete.

---

## Phase 6: User Story 4 — View Precinct-Level Results Map (Priority: P2)

**Goal**: Users switch to a precinct-level map view showing precinct boundaries colored by leading candidate, filterable by county to manage data volume.

**Independent Test**: Select a race → switch to precinct view → verify precinct boundaries render → select a county filter → verify filtered precincts load → hover a precinct for tooltip.

### Implementation for User Story 4

- [x] T031 [US4] Add precinct GeoJSON query hook (with county filter parameter) to `src/lib/hooks/use-race-geojson.ts` (fetches GET /elections/{id}/results/geojson/precincts?county=X, returns PrecinctResultFeatureCollection)
- [x] T032 [US4] Create precinct map view component with county filter dropdown, precinct GeoJSON overlay, precinct hover tooltips, and empty state for unavailable precinct data in `src/components/elections/PrecinctMapView.tsx` per FR-011
- [x] T033 [US4] Integrate precinct view toggle (county vs precinct map switch) into race results page in `src/routes/elections/$electionDate/$electionId.tsx` per FR-011/SC-006

**Checkpoint**: Users can switch between county and precinct map views within 2s (SC-006). Precinct view is filterable by county.

---

## Phase 7: User Story 5 — Live Auto-Refresh During Active Elections (Priority: P2)

**Goal**: Active election results auto-refresh at the election's configured interval. A live status indicator shows last refresh time and live/final state. Finalized elections display "Final Results" with no polling.

**Independent Test**: View an active election → verify last-refreshed timestamp updates periodically → verify map and drawer reflect updated data → view a finalized election → verify no auto-refresh and "Final Results" indicator.

### Implementation for User Story 5

- [x] T034 [P] [US5] Create live status indicator component showing last refresh timestamp, next refresh countdown, and live/final badge in `src/components/elections/LiveStatusIndicator.tsx` per FR-013/FR-014
- [x] T035 [US5] Add auto-refresh polling logic using TanStack Query refetchInterval to race results hook — poll at election.refresh_interval_seconds when status is active, stop when finalized, handle network errors with warning toast in `src/lib/hooks/use-race-results.ts` per FR-012/FR-014/FR-016
- [x] T036 [US5] Integrate live status indicator into race results page header and wire auto-refresh behavior in `src/routes/elections/$electionDate/$electionId.tsx`
- [x] T037 [P] [US5] Write unit tests for auto-refresh polling logic (active polling, finalized stops, network error handling) in `tests/lib/hooks/use-race-results.test.ts`
- [x] T059 [P] [US5] Write component tests for LiveStatusIndicator (active vs finalized, timestamp display) in `tests/components/elections/LiveStatusIndicator.test.tsx`

**Checkpoint**: Active elections auto-refresh within the configured interval (SC-005). Finalized elections show "Official Results" with no polling.

---

## Phase 8: User Story 6 — Admin: Create a New Election (Priority: P2)

**Goal**: Admin users can view a management list of elections and create new elections with form validation and two-step confirmation, following established admin patterns.

**Independent Test**: Log in as admin → navigate to admin elections → verify election list displays → click "Create Election" → fill form → submit → confirm in dialog → verify new election appears in list.

### Implementation for User Story 6

- [x] T038 [US6] Create admin elections CRUD hooks (useAdminElections list query, useCreateElection mutation, useUpdateElection mutation, useRefreshElection mutation) with toast notifications and query invalidation in `src/lib/hooks/use-admin-elections.ts` following pattern in existing admin hooks
- [x] T039 [P] [US6] Create election form component with React Hook Form + Zod validation (name, election_date, election_type dropdown, district, data_source_url, refresh_interval_seconds with min 60) in `src/routes/admin/elections/_components/election-form.tsx` per FR-018/FR-019
- [x] T040 [P] [US6] Create election two-step confirmation dialog displaying election details for review before submission in `src/routes/admin/elections/_components/election-confirm-dialog.tsx` per FR-020
- [x] T041 [P] [US6] Create admin elections data table showing name, date, type, status, last refresh, reporting progress with sortable columns in `src/routes/admin/elections/_components/election-table.tsx` per FR-017
- [x] T042 [US6] Implement admin elections list page at `/admin/elections` with data table and "Create Election" button in `src/routes/admin/elections/index.tsx` per FR-017/FR-025
- [x] T043 [US6] Implement admin create election page at `/admin/elections/create` with form, validation, and confirmation dialog in `src/routes/admin/elections/create.tsx` per FR-018/FR-019/FR-020/FR-026
- [x] T044 [P] [US6] Write unit tests for admin elections hooks (list query, create mutation, error handling) in `tests/lib/hooks/use-admin-elections.test.ts`

**Checkpoint**: Admin users can view and create elections with full validation and confirmation. Admin election management is operational.

---

## Phase 9: User Story 7 — Admin: Update and Manage an Existing Election (Priority: P2)

**Goal**: Admin users can edit election details, change status (with finalization confirmation), and trigger manual data refreshes with feedback.

**Independent Test**: Navigate to an existing election's admin detail → edit fields and save → change status to finalized with confirmation → trigger manual refresh → verify success feedback.

### Implementation for User Story 7

- [x] T045 [US7] Implement admin election detail/edit page at `/admin/elections/$electionId` with editable form (name, data_source_url, status, refresh_interval_seconds), save functionality, and toast feedback in `src/routes/admin/elections/$electionId.tsx` per FR-021/FR-026
- [x] T046 [US7] Add manual refresh button with loading indicator and success toast (showing counties updated, precincts reporting) to admin election detail page — disabled for finalized elections in `src/routes/admin/elections/$electionId.tsx` per FR-023/FR-024
- [x] T047 [US7] Add finalization confirmation dialog warning that auto-refresh will stop when changing status to "finalized" in `src/routes/admin/elections/$electionId.tsx` per FR-022

**Checkpoint**: Admin users can fully manage election lifecycle — edit, finalize, and refresh. All admin operations provide clear feedback within 3s (SC-011).

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, empty states, responsiveness, and build verification across all user stories

- [x] T048 [P] Add empty state handling across election pages — no results yet, no elections match filters, no precinct boundaries available, zero precincts participating per edge cases in spec.md
- [x] T049 [P] Add mobile responsive layout adjustments for election map and drawer components per SC-008
- [x] T050 Add error boundary for election routes in `src/routes/elections.tsx` with graceful fallback UI per FR-016
- [x] T051 [P] Write API client unit tests for all election API functions in `tests/lib/api/elections.test.ts`
- [x] T052 Run ESLint (`npm run lint`) and fix all linting issues across new election files
- [x] T053 Run TypeScript build (`npm run build`) and verify all routes generate correctly with no errors
- [x] T054 Run quickstart.md validation — verify dev server starts, all new routes are accessible, and key navigation flows work
- [x] T061 Run full test suite with coverage verification (`npm run test:coverage`) and confirm 95% line/branch/function/statement thresholds pass per Constitution Principle III

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion (types and API client needed for hooks) — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — establishes navigation and election browsing
- **US2 (Phase 4)**: Depends on Phase 2 — can run in parallel with US1 but race results page depends on T015 route existing
- **US3 (Phase 5)**: Depends on US2 (T023 race results page must exist to integrate drawer)
- **US4 (Phase 6)**: Depends on US2 (extends race results page with precinct toggle)
- **US5 (Phase 7)**: Depends on US2 (extends race results hook and page with auto-refresh)
- **US6 (Phase 8)**: Depends on Phase 2 — can run in parallel with public-facing stories
- **US7 (Phase 9)**: Depends on US6 (admin elections list and hooks must exist)
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no dependencies on other stories
- **US2 (P1)**: After Phase 2 — independent from US1 (different route), but logically follows US1 for navigation flow
- **US3 (P1)**: After US2 — integrates with the race results page created in US2
- **US4 (P2)**: After US2 — extends race results page with precinct view toggle
- **US5 (P2)**: After US2 — adds auto-refresh to existing race results hook and page
- **US6 (P2)**: After Phase 2 — independent from public stories (admin section)
- **US7 (P2)**: After US6 — extends admin election management with edit/refresh

### Within Each User Story

- Models/types before hooks
- Hooks before route pages
- Shared components before page integration
- Tests can run in parallel with implementation (marked [P])
- Story complete before moving to dependent stories

### Parallel Opportunities

- Phase 1: T003 and T004 can run in parallel (different files)
- Phase 2: T006, T007, and T008 can run in parallel (different files)
- Phase 3: T010, T013, T014, T016, T017 can run in parallel
- Phase 4: T019, T020, T021, T024, T025 can run in parallel
- Phase 5: T026, T027, T030 can run in parallel
- Phase 7: T034 and T037 can run in parallel
- Phase 8: T039, T040, T041, T044 can run in parallel
- Phase 10: T048, T049, T051 can run in parallel
- **Cross-phase**: US6 (admin) can run in parallel with US3/US4/US5 (public) since they touch different route trees

---

## Parallel Example: User Story 2

```bash
# Launch parallel components for US2 (different files, no dependencies):
Task: "Create county results GeoJSON hook in src/lib/hooks/use-race-geojson.ts"
Task: "Create map layer selector component in src/components/elections/MapLayerSelector.tsx"
Task: "Create certification badge component in src/components/elections/CertificationBadge.tsx"
Task: "Write component tests for MapLayerSelector in tests/components/elections/MapLayerSelector.test.tsx"
Task: "Write component tests for CertificationBadge in tests/components/elections/CertificationBadge.test.tsx"

# Then sequentially (depends on above):
Task: "Create election results choropleth map in src/components/elections/ElectionResultsMap.tsx"
Task: "Create race results page in src/routes/elections/$electionDate/$electionId.tsx"
```

---

## Parallel Example: Admin Stories (US6 + US7)

```bash
# Launch admin components in parallel (different files):
Task: "Create election form component in src/routes/admin/elections/_components/election-form.tsx"
Task: "Create election confirmation dialog in src/routes/admin/elections/_components/election-confirm-dialog.tsx"
Task: "Create admin elections data table in src/routes/admin/elections/_components/election-table.tsx"
Task: "Write unit tests for admin elections hooks in tests/lib/hooks/use-admin-elections.test.ts"

# Then sequentially:
Task: "Implement admin elections list page in src/routes/admin/elections/index.tsx"
Task: "Implement admin create election page in src/routes/admin/elections/create.tsx"
Task: "Implement admin election detail/edit page in src/routes/admin/elections/$electionId.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1–3 Only)

1. Complete Phase 1: Setup (types, API client, test utilities)
2. Complete Phase 2: Foundational (navigation, layout routes, filter state)
3. Complete Phase 3: US1 — Browse and select elections
4. Complete Phase 4: US2 — County choropleth map
5. Complete Phase 5: US3 — Results drawer
6. **STOP and VALIDATE**: Test the full P1 flow: browse → select → map → drawer
7. Deploy/demo if ready — this is the MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Election browsing works → Demo
3. US2 → County map visualizes results → Demo
4. US3 → Drawer shows detailed results → Demo (MVP complete!)
5. US4 → Precinct-level granularity added → Demo
6. US5 → Live auto-refresh during active elections → Demo
7. US6 → Admin can create elections → Demo
8. US7 → Admin can manage full election lifecycle → Demo
9. Polish → Error handling, responsiveness, build verification → Final

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (elections browsing) → US3 (drawer)
   - Developer B: US2 (county map) → US4 (precincts) → US5 (auto-refresh)
   - Developer C: US6 (admin create) → US7 (admin manage)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The backend API uses one-race-per-election records; frontend groups by `election_date` for multi-race UX (see research.md §1)
- Test infrastructure (Vitest, testing-library) already configured — custom render wrapper and mock factories needed (Phase 1)
- Follow existing admin patterns for US6/US7 (route structure, hooks, error handling, two-step confirmation)
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
