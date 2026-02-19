# Tasks: Voter Search & Geocoding

**Input**: Design documents from `/specs/003-voter-search-geocoding/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/voter-api.md, quickstart.md

**Tests**: Included — constitution requires 95% unit test coverage on new code.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the shared types, API functions, and test utilities that all user stories depend on.

- [x] T001 Create voter type definitions (VoterSummary, VoterDetail, VoterSearchResponse, VoterFilterOptions, VoterSearchParams, DistrictTypeOption, DistrictOption) in src/types/voter.ts per contracts/voter-api.md
- [x] T002 Create voter API wrapper functions (searchVoters, getVoterDetail, getVoterFilters, triggerVoterGeocode, deleteGeocodedLocation) using shared ky client in src/api/voters.ts per contracts/voter-api.md
- [x] T003 [P] Create unit test mock factories for voter data (mockVoterSummary, mockVoterDetail, mockVoterSearchResponse, mockVoterFilterOptions, mockVoterGeocodedLocation) in src/test/mocks/voters.ts following existing pattern in src/test/mocks/elections.ts
- [x] T004 [P] Unit tests for all voter API functions (searchVoters, getVoterDetail, getVoterFilters, triggerVoterGeocode, deleteGeocodedLocation) in tests/api/voters.test.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create hooks, routing infrastructure, and E2E fixtures that MUST be complete before any user story can be implemented.

**CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T005 Create voter TanStack Query hooks (useVoterSearch, useVoterDetail, useVoterFilters, useTriggerGeocode, useDeleteGeocodedLocation) with query keys, caching, invalidation, and error handling in src/hooks/useVoters.ts following patterns in src/hooks/useAddressLookup.ts
- [ ] T006 Unit tests for all voter hooks in tests/hooks/useVoters.test.ts
- [ ] T007 [P] Add "Voters" nav item (Users icon from Lucide) to both desktop and mobile navigation in src/routes/__root.tsx, visible to all authenticated users, positioned alongside Elections/Counties/Districts
- [ ] T008 [P] Create voters layout route with auth guard (beforeLoad with requireAuth) in src/routes/voters.tsx following pattern in src/routes/admin.tsx
- [ ] T008a [P] Unit tests for voters layout route (auth guard redirects unauthenticated users, authenticated users render child routes) in tests/routes/voters/voters-layout.test.tsx
- [ ] T009 [P] Create E2E mock fixtures with voter search, detail, filters, geocoded locations, and point-lookup route intercepts in e2e/fixtures/voter-api.ts following pattern in e2e/fixtures/election-api.ts
- [ ] T010 [P] Add mock voter data (voter summaries, voter detail, filter options, geocoded locations, district assignments) to e2e/fixtures/mock-data.ts

**Checkpoint**: Foundation ready — voter hooks, navigation, routing, and test infrastructure in place. User story implementation can begin.

---

## Phase 3: User Story 1 — Search & Browse Voters (Priority: P1) MVP

**Goal**: Staff can search for voters by name, filter by county/status/district, sort columns, and page through results. All search state is URL-driven.

**Independent Test**: Navigate to /voters, type a name, verify results table populates. Apply filters and sort. Navigate pages. Bookmark and reload a search URL.

### Implementation for User Story 1

- [ ] T011 [P] [US1] Create VoterSearchFilters component with debounced search input (300ms), county select, status select, and two-level cascade district filter (type select → district select) using shadcn Select components in src/routes/voters/_components/VoterSearchFilters.tsx. Filters read from and write to URL search params via navigate(). Filter options loaded from useVoterFilters hook.
- [ ] T012 [P] [US1] Create VoterTable component with sortable columns (name, county, voter ID, registration date, status), clickable rows linking to /voters/{id}, and pagination controls (previous/next, page counter) using shadcn Table in src/routes/voters/_components/VoterTable.tsx. Sort state read from URL params. Empty state message when no results.
- [ ] T013 [US1] Create voter search page with Zod-validated search params schema (q, county, status, district_type, district_id, sort_by, sort_order, page), composing VoterSearchFilters and VoterTable, wired to useVoterSearch hook in src/routes/voters/index.tsx. Include loading skeleton and error state.
- [ ] T014 [P] [US1] Unit tests for VoterSearchFilters (renders all filter controls, populates options from mock data, updates URL params on filter change, debounces search input) in tests/routes/voters/_components/VoterSearchFilters.test.tsx
- [ ] T015 [P] [US1] Unit tests for VoterTable (renders voter rows with correct columns, sorts on header click, paginates, shows empty state, links to detail page) in tests/routes/voters/_components/VoterTable.test.tsx
- [ ] T016 [US1] Unit tests for voter search page (renders filters and table, passes search params to hook, handles loading/error states) in tests/routes/voters/index.test.tsx
- [ ] T017 [US1] E2E test for voter search flow (navigate to /voters, search by name, verify table results, apply county filter, apply district cascade filter, sort by column, paginate, verify URL updates) in e2e/voter-search.spec.ts

**Checkpoint**: User Story 1 is complete — staff can search, filter, sort, and page through voters. The search page is a standalone, useful voter lookup tool.

---

## Phase 4: User Story 2 — View Voter Detail (Priority: P2)

**Goal**: Staff can click a voter in search results to view their full registration info, geocoded locations (in a list and on a map), and district assignments.

**Independent Test**: Navigate to /voters/{id}, verify registration card shows all fields. Verify geocoded locations appear in table and as map pins. Verify districts are listed. Test empty states (no locations, no official location).

### Implementation for User Story 2

- [ ] T018 [P] [US2] Create VoterRegistrationCard component displaying name (with middle name and suffix), address (line 1, line 2, city, state, zip), county, voter ID, registration date, and status badge using shadcn Card in src/routes/voters/_components/VoterRegistrationCard.tsx
- [ ] T019 [P] [US2] Create GeocodedLocationMap component using React-Leaflet (MapContainer, TileLayer, Marker) with distinct pin colors for official vs. non-official locations, auto-fit bounds, and OpenStreetMap tiles in src/routes/voters/_components/GeocodedLocationMap.tsx following pattern in src/components/CountyDetailMap.tsx
- [ ] T020 [P] [US2] Create GeocodedLocationsCard component (read-only for this story) displaying locations in a table (provider, confidence score, formatted address, coordinates) with official location visually highlighted (badge/row highlight), and empty state message when no locations (geocode trigger CTA deferred to US3/T029) in src/routes/voters/_components/GeocodedLocationsCard.tsx
- [ ] T021 [P] [US2] Create DistrictAssignmentsCard component displaying districts grouped by boundary type (county, precinct, congressional, state senate, state house, commission, school district) using shadcn Card with badges, and empty/no-official-location states in src/routes/voters/_components/DistrictAssignmentsCard.tsx
- [ ] T022 [US2] Create voter detail page composing VoterRegistrationCard, GeocodedLocationsCard, GeocodedLocationMap, and DistrictAssignmentsCard, wired to useVoterDetail, useVoterGeocodedLocations, and usePointLookup hooks in src/routes/voters/$voterId.tsx. Include loading skeleton, 404 error handling, and back-to-search link.
- [ ] T023 [P] [US2] Unit tests for VoterRegistrationCard (renders all fields including optional middle name/suffix, formats dates, shows status badge) in tests/routes/voters/_components/VoterRegistrationCard.test.tsx
- [ ] T024 [P] [US2] Unit tests for GeocodedLocationMap (renders map container, shows markers for locations, highlights official location pin, handles empty locations, fits bounds) in tests/routes/voters/_components/GeocodedLocationMap.test.tsx
- [ ] T025 [P] [US2] Unit tests for GeocodedLocationsCard (renders location table, highlights official location, shows empty state) in tests/routes/voters/_components/GeocodedLocationsCard.test.tsx
- [ ] T026 [P] [US2] Unit tests for DistrictAssignmentsCard (renders districts grouped by type, shows empty state when no official location, shows "no matching districts" message when official location exists but point-lookup returns zero results) in tests/routes/voters/_components/DistrictAssignmentsCard.test.tsx
- [ ] T027 [US2] Unit tests for voter detail page (renders all sections, handles loading/error/404 states, fetches voter and locations) in tests/routes/voters/voter-detail.test.tsx
- [ ] T028 [US2] E2E test for voter detail view (navigate from search, verify registration info, verify geocoded locations table and map, verify district assignments, test 404 page for invalid voter ID) in e2e/voter-detail.spec.ts

**Checkpoint**: User Stories 1 AND 2 are complete — staff can search for voters AND view their full details including locations on a map and district assignments.

---

## Phase 5: User Story 3 — Trigger Geocoding & View Provider Results (Priority: P3)

**Goal**: Admins/analysts can trigger geocoding for a voter to get fresh results from all providers, displayed with loading state and provider error handling.

**Independent Test**: As admin, click "Geocode" on a voter detail page. Verify loading indicator appears. Verify provider results appear with confidence scores. Verify button is hidden for viewers.

### Implementation for User Story 3

- [ ] T029 [US3] Add geocode trigger button to GeocodedLocationsCard with role-based visibility (hidden for viewers), loading spinner during useTriggerGeocode mutation, disabled state while in-flight, success/error toast notifications, and display of provider errors/no-match results in src/routes/voters/_components/GeocodedLocationsCard.tsx
- [ ] T030 [US3] Update unit tests for GeocodedLocationsCard: geocode button visible for admin/analyst, hidden for viewer, loading state during geocoding, error toast on failure, provider error results display in tests/routes/voters/_components/GeocodedLocationsCard.test.tsx
- [ ] T031 [US3] E2E test for geocoding flow: click geocode button as admin, verify loading indicator, verify results appear with provider details; verify button hidden as viewer in e2e/voter-detail.spec.ts

**Checkpoint**: User Stories 1, 2, AND 3 are complete — staff can search, view details, and admins can trigger geocoding.

---

## Phase 6: User Story 4 — Select Official Location (Priority: P4)

**Goal**: Admins/analysts can set a geocoded location as official, triggering automatic district assignment refresh.

**Independent Test**: As admin, click "Set as Official" on a non-primary location. Verify it becomes highlighted. Verify district assignments refresh with new data. Verify action hidden for viewers.

### Implementation for User Story 4

- [ ] T032 [US4] Add "Set as Official" action button to each non-primary location row in GeocodedLocationsCard with role-based visibility, wired to existing useSetPrimaryLocation hook, success/error toasts in src/routes/voters/_components/GeocodedLocationsCard.tsx
- [ ] T033 [US4] Wire district assignments auto-refresh in voter detail page: after setPrimaryLocation mutation succeeds, invalidate point-lookup query so DistrictAssignmentsCard re-fetches districts for the new official location coordinates in src/routes/voters/$voterId.tsx
- [ ] T034 [US4] Update unit tests for set official action: button visible for admin/analyst, hidden for viewer, optimistic UI update, district refresh after success, error preservation on failure in tests/routes/voters/_components/GeocodedLocationsCard.test.tsx
- [ ] T035 [US4] E2E test for set official flow: click "Set as Official", verify location highlighted, verify district assignments refresh; verify action hidden as viewer in e2e/voter-detail.spec.ts

**Checkpoint**: User Stories 1–4 complete — full search, detail, geocoding, and official location selection workflow is functional.

---

## Phase 7: User Story 5 — Remove Geocoded Location (Priority: P5)

**Goal**: Admins/analysts can remove stale/incorrect geocoded locations with a confirmation dialog, and the system handles removing the official location gracefully.

**Independent Test**: As admin, click "Remove" on a location, confirm deletion, verify it disappears. Remove the official location and verify districts are cleared. Verify action hidden for viewers.

### Implementation for User Story 5

- [ ] T036 [US5] Add "Remove" action button to each location row in GeocodedLocationsCard with role-based visibility, confirmation dialog (shadcn AlertDialog or Dialog), wired to useDeleteGeocodedLocation hook, success/error toasts in src/routes/voters/_components/GeocodedLocationsCard.tsx
- [ ] T037 [US5] Handle removing the official location: after delete mutation succeeds for a primary location, clear district assignments and show "no official location" message in src/routes/voters/$voterId.tsx
- [ ] T038 [US5] Update unit tests for remove action: button visible for admin/analyst, hidden for viewer, confirmation dialog appears, location removed on confirm, cancel preserves state, removing official location clears districts, removing last remaining location shows empty state with no map in tests/routes/voters/_components/GeocodedLocationsCard.test.tsx
- [ ] T039 [US5] E2E test for remove flow: click "Remove", verify confirmation dialog, confirm and verify location removed; cancel and verify location preserved; remove official location and verify districts cleared in e2e/voter-detail.spec.ts

**Checkpoint**: All 5 user stories complete — the full voter search, detail, geocoding, official location, and removal workflow is functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Quality assurance, linting, coverage verification, and visual verification across all user stories.

- [ ] T040 [P] Run ESLint on all new files and fix any linting issues (`npm run lint`)
- [ ] T041 [P] Run TypeScript type-check on entire project and fix any type errors (`tsc -b`)
- [ ] T042 Run full unit test suite with coverage and verify ≥95% on all new files (`npm test -- --run --coverage`)
- [ ] T043 Run full E2E test suite and fix any failures (`npm run build && npm run test:e2e`)
- [ ] T044 Visual verification with Playwright MCP: navigate to /voters search page, take screenshot, verify layout and search UI render correctly. Save to screenshots/voter-search.png
- [ ] T045 Visual verification with Playwright MCP: navigate to /voters/{id} detail page, take screenshot, verify registration card, map, locations table, and districts render correctly. Save to screenshots/voter-detail.png

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — can start once foundation is complete
- **US2 (Phase 4)**: Depends on Phase 2 — can run in parallel with US1 but benefits from US1 (search → detail navigation)
- **US3 (Phase 5)**: Depends on US2 (GeocodedLocationsCard must exist)
- **US4 (Phase 6)**: Depends on US2 (GeocodedLocationsCard and detail page must exist)
- **US5 (Phase 7)**: Depends on US2 (GeocodedLocationsCard and detail page must exist)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

```text
Phase 1 (Setup)
  └─▶ Phase 2 (Foundational)
        ├─▶ US1 (Search & Browse) ────────────────────────────▶ Phase 8 (Polish)
        └─▶ US2 (Voter Detail) ──┬─▶ US3 (Trigger Geocoding) ─▶ Phase 8
                                 ├─▶ US4 (Select Official) ───▶ Phase 8
                                 └─▶ US5 (Remove Location) ───▶ Phase 8
```

- **US1** and **US2** can be implemented in parallel after Phase 2
- **US3**, **US4**, **US5** can be implemented in parallel after US2 (they all modify GeocodedLocationsCard and the detail page)
- In practice, **US3 → US4 → US5** is recommended sequential order because they incrementally add actions to the same components

### Within Each User Story

- Components (marked [P]) can be implemented in parallel within a story
- Page composition task depends on all component tasks in that story
- Unit tests (marked [P]) can run in parallel after their component is implemented
- E2E test runs last in each story as integration validation

### Parallel Opportunities

**Phase 2** — T005/T006 sequential (hooks → tests), T007/T008/T009/T010 all parallel with each other and with T005
**US1** — T011/T012 parallel (different components), T014/T015 parallel (different test files)
**US2** — T018/T019/T020/T021 all parallel (4 independent components), T023/T024/T025/T026 all parallel (4 test files)
**US3/US4/US5** — Mostly sequential (same files modified incrementally)

---

## Parallel Example: User Story 2

```bash
# Launch all 4 detail components in parallel (different files):
Task: "Create VoterRegistrationCard in src/routes/voters/_components/VoterRegistrationCard.tsx"
Task: "Create GeocodedLocationMap in src/routes/voters/_components/GeocodedLocationMap.tsx"
Task: "Create GeocodedLocationsCard in src/routes/voters/_components/GeocodedLocationsCard.tsx"
Task: "Create DistrictAssignmentsCard in src/routes/voters/_components/DistrictAssignmentsCard.tsx"

# Then compose them into the detail page (depends on all 4):
Task: "Create voter detail page in src/routes/voters/$voterId.tsx"

# Then launch all 4 component test files in parallel:
Task: "Unit tests for VoterRegistrationCard"
Task: "Unit tests for GeocodedLocationMap"
Task: "Unit tests for GeocodedLocationsCard"
Task: "Unit tests for DistrictAssignmentsCard"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (types + API)
2. Complete Phase 2: Foundational (hooks + nav + layout + fixtures)
3. Complete Phase 3: User Story 1 (search & browse)
4. **STOP and VALIDATE**: Test search independently — filters, sort, pagination, URL state
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Search & Browse) → Test → Deploy/Demo (**MVP!**)
3. Add US2 (Voter Detail) → Test → Deploy/Demo (read-only detail view)
4. Add US3 (Trigger Geocoding) → Test → Deploy/Demo (geocoding capability)
5. Add US4 (Select Official) → Test → Deploy/Demo (district assignment workflow)
6. Add US5 (Remove Location) → Test → Deploy/Demo (data hygiene)
7. Polish phase → Final validation → PR

### Recommended Commit Points

- After Phase 1: `feat(voters): add voter types and API functions`
- After Phase 2: `feat(voters): add hooks, navigation, and routing infrastructure`
- After US1: `feat(voters): add voter search page with filters, sort, and pagination`
- After US2: `feat(voters): add voter detail page with registration, locations map, and districts`
- After US3: `feat(voters): add geocoding trigger for admin/analyst users`
- After US4: `feat(voters): add official location selection with district refresh`
- After US5: `feat(voters): add geocoded location removal with confirmation`
- After Polish: `test(voters): add full coverage and visual verification`

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in the same phase
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable at its checkpoint
- Commit after each phase or user story completion
- Existing hooks reused: useVoterGeocodedLocations, useSetPrimaryLocation, usePointLookup (from src/hooks/useAddressLookup.ts)
- New hooks needed: useVoterSearch, useVoterDetail, useVoterFilters, useTriggerGeocode, useDeleteGeocodedLocation
- Constitution: 95% unit test coverage on all new code, branch-based workflow, conventional commits
