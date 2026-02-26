# Tasks: Elections Discovery and Details Redesign

**Input**: Design documents from `/specs/007-elections-discovery/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Included — required by project constitution (95% unit test coverage).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root (React SPA)

---

## Phase 1: Setup

**Purpose**: Install missing dependencies and verify branch state.

- [x] T001 Install shadcn Avatar component via `npx shadcn@latest add avatar` (creates src/components/ui/avatar.tsx — needed for candidate photo/initials display)
- [x] T002 Verify branch `007-elections-discovery` is up to date with `main` and dev server starts cleanly with `npm run dev`

---

## Phase 2: Foundational (Types, API Clients, Hooks, Mocks)

**Purpose**: Core type definitions, API client functions, hooks, and test mocks that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Types

- [x] T003 [P] Extend Election interface in src/types/elections.ts — add 9 new nullable metadata fields (description, purpose, eligibility_description, registration_deadline, early_voting_start, early_voting_end, absentee_request_deadline, qualifying_start, qualifying_end) per data-model.md
- [x] T004 [P] Extend ElectionFilters in src/types/elections.ts — add registration_open (boolean), early_voting_active (boolean), and search (string) fields per data-model.md
- [x] T005 [P] Extend UpdateElectionRequest in src/types/elections.ts — add 9 new metadata fields matching Election per data-model.md
- [x] T006 [P] Create src/types/candidates.ts — define FilingStatus, CandidateLinkType, CandidateLink, CandidateSummary, CandidateDetail, PaginatedCandidateListResponse, CandidateListParams, CreateCandidateRequest, UpdateCandidateRequest, CreateCandidateLinkRequest per data-model.md

### API Clients

- [x] T007 [P] Create src/lib/api/candidates.ts — implement public functions: getCandidates(electionId, params?) calling GET /elections/{id}/candidates and getCandidateDetail(candidateId) calling GET /candidates/{id} using publicApi; implement admin functions: createCandidate(electionId, data) calling POST, updateCandidate(candidateId, data) calling PATCH, deleteCandidate(candidateId) calling DELETE, createCandidateLink(candidateId, data) calling POST, deleteCandidateLink(candidateId, linkId) calling DELETE using api client per contracts/candidates-api.md
- [x] T008 [P] Update src/lib/api/elections.ts — add registration_open, early_voting_active params to getElections() searchParams per contracts/elections-api-changes.md

### Hooks

- [x] T009 Create src/lib/hooks/use-candidates.ts — implement useCandidates(electionId, params?) with TanStack Query, queryKey ["elections", electionId, "candidates", params], staleTime 30s, disabled when electionId is empty; implement useCandidateDetail(candidateId) with queryKey ["candidates", candidateId], staleTime 30s, disabled when candidateId is empty per research.md R6

### Utilities

- [x] T010 [P] Add synthesizeDescription utility function to src/types/elections.ts — return election.purpose ?? `${capitalize(election_type)} — ${election.district}` per research.md R5
- [x] T011 [P] Add getCandidateInitials(fullName: string): string utility to src/types/candidates.ts — extract first letter of first and last name (e.g., "Jane Doe" → "JD", "Madonna" → "M") for Avatar fallback
- [x] T012 [P] Add sortCandidates(candidates: CandidateSummary[]): CandidateSummary[] utility to src/types/candidates.ts — sort by ballot_order (nulls last), then alphabetically by full_name

### Mock Factories

- [x] T013 [P] Create src/test/mocks/candidates.ts — implement mockCandidateSummary(overrides?), mockCandidateDetail(overrides?), mockCandidateLink(overrides?), mockPaginatedCandidateList(overrides?) following existing patterns in src/test/mocks/elections.ts
- [x] T014 [P] Update src/test/mocks/elections.ts — add 9 new metadata fields (all null by default) to mockElection factory

### Unit Tests

- [x] T015 [P] Write unit tests for candidates API client in tests/lib/api/candidates.test.ts — test getCandidates (with/without status filter, pagination), getCandidateDetail, createCandidate, updateCandidate, deleteCandidate, createCandidateLink, deleteCandidateLink; verify public vs admin client usage and request shapes
- [x] T016 [P] Write unit tests for useCandidates and useCandidateDetail hooks in tests/lib/hooks/use-candidates.test.tsx — test success, loading, error, disabled when empty ID, param passthrough
- [x] T017 [P] Update unit tests for elections API client in tests/lib/api/elections.test.ts — add tests for new registration_open and early_voting_active filter params
- [x] T018 [P] Write unit tests for getCandidateInitials and sortCandidates in tests/types/candidates.test.ts — test initials edge cases (single name, hyphenated, empty), sort by ballot_order nulls-last then alphabetical
- [x] T019 [P] Write unit tests for synthesizeDescription in tests/types/elections-utils.test.ts — test purpose field preferred over synthesis, fallback to type+district format

**Checkpoint**: Foundation ready — all types, API clients, hooks, utilities, and mocks are in place and tested. User story implementation can begin.

---

## Phase 3: User Story 1 — Browse and Search Elections (Priority: P1) 🎯 MVP

**Goal**: Replace the date-based drill-down elections list with a flat, searchable list of individual races. Each entry shows name, date, and description. Support text search, status/type filters, "Registration Open" and "Early Voting Now" toggles, and pagination (25/page). Clicking navigates to the election detail page. Legacy URLs redirect.

**Independent Test**: Navigate to `/elections/`, see a flat list of elections with name/date/description, type into the search box to filter, use status/type/registration/early-voting filters, click through to a detail page. Legacy URLs `/elections/2024-11-05/` and `/elections/2024-11-05/{id}` redirect properly.

### Implementation

- [x] T020 [US1] Update useElectionFilters Zustand store in src/lib/hooks/use-election-filters.ts — add search (string), registration_open (boolean), early_voting_active (boolean) fields; update defaults and reset logic to include new fields
- [x] T021 [US1] Update useElections hook in src/lib/hooks/use-elections.ts — return flat Election[] (remove groupElectionsByDate call); change default page_size to 25; pass new API filter params (registration_open, early_voting_active); add client-side search filtering with useDeferredValue over name, district, and synthesized description per FR-004 and research.md R4. PREREQUISITE: Before implementing, verify API sort order by calling `GET /api/v1/elections?page_size=5` and inspecting the response order. If API does not return date DESC + name ASC, add client-side sort as a temporary measure: `elections.sort((a, b) => b.election_date.localeCompare(a.election_date) || a.name.localeCompare(b.name))` and file a voter-api issue for a server-side `sort` parameter.
- [x] T022 [US1] Create new election detail route in src/routes/elections/$electionId.tsx — add `params.parse` validation with UUID regex so this route only matches UUID-shaped params (non-UUIDs fall through to $electionDate.tsx); migrate Results tab content and Participation tab content from src/routes/elections/$electionDate/$electionId.tsx; add "info" to Zod search schema enum `z.enum(["info", "results", "participation"]).optional()`; preserve all existing state (county select, map view, district outline, sound alerts, auto-polling, notifications); default tab to "info" for now (US3 adds intelligent defaulting) per research.md R2 and R9 — NOTE: Route was extracted to ElectionDetailPage component and $electionDate.tsx handles UUID detection directly (TanStack Router params.parse doesn't fall through)
- [x] T023 [US1] Rewrite elections list page in src/routes/elections/index.tsx — flat list with search Input (debounced 300ms), status/type Select filters, "Registration Open" and "Early Voting Now" toggle chips (FR-022), pagination controls (prev/next, page indicator), geographic context banner from useNavigationContext with "Show all" clear button (FR-019), per-election visual highlight (subtle border or badge) when election district name matches context county/state (case-insensitive substring match per FR-019), election items showing name/date/synthesized description with Link to /elections/$electionId, empty state ("No elections found matching your search" with clear-filters suggestion), loading skeleton per FR-001 through FR-009, FR-019, FR-022
- [x] T024 [US1] Convert src/routes/elections/$electionDate.tsx to redirect — detect if param matches UUID pattern (redirect to /elections/$electionId) or date pattern (render Outlet for child redirect routes) per research.md R2 — NOTE: Handles UUID directly in component instead of redirect (avoids infinite redirect loop)
- [x] T025 [P] [US1] Convert src/routes/elections/$electionDate/index.tsx to redirect — redirect to /elections/ per research.md R2
- [x] T026 [P] [US1] Convert src/routes/elections/$electionDate/$electionId.tsx to redirect — redirect to /elections/$electionId preserving ?tab= search params per research.md R2

### Unit Tests

- [x] T027 [P] [US1] Update unit tests for useElectionFilters in tests/lib/hooks/use-election-filters.test.ts — add tests for new search, registration_open, early_voting_active fields; test reset includes new fields
- [x] T028 [P] [US1] Update unit tests for useElections hook in tests/lib/hooks/use-elections.test.tsx — test flat list return shape (no ElectionEvent grouping), page_size=25, new filter params passed to API, client-side search filtering, sort order verification (date DESC primary, name ASC secondary for same-date elections)
- [ ] T029 [US1] Write unit tests for elections list page in tests/routes/elections/elections-list.test.tsx — test list rendering, search filtering, filter controls, pagination, empty state, geographic context banner with "Show all" clear, per-election highlighting when district matches context (case-insensitive substring), navigation to detail
- [ ] T030 [P] [US1] Write unit tests for redirect routes in tests/routes/elections/election-redirects.test.tsx — test $electionId params.parse accepts valid UUIDs and rejects date strings, $electionDate UUID detection and redirect, $electionDate/index redirect to /elections/, $electionDate/$electionId redirect with ?tab= preservation

**Checkpoint**: User Story 1 is complete. The elections list is flat, searchable, and filterable. Legacy URLs redirect. The detail page works with Results and Participation tabs preserved.

---

## Phase 4: User Story 2 — View Election Information (Priority: P1)

**Goal**: Add an "Election Information" tab to the election detail page showing candidates (from Candidates API with results fallback), eligibility, geographic area, key dates, and metadata. Add a candidate detail page at /candidates/{id}.

**Independent Test**: Navigate to an election detail page, click the "Election Information" tab, verify candidates section shows candidate names/parties/photos/incumbent badges (or "not yet announced" if empty), eligibility description (with fallback), geographic area, key dates (or hidden if all null), and metadata (date, type, status). Click a candidate name to see their detail page.

### Components

- [x] T031 [P] [US2] Create CandidateCard component in src/components/elections/CandidateCard.tsx — display single candidate: shadcn Avatar (AvatarImage for photo_url, AvatarFallback with initials from getCandidateInitials), full_name as Link to /candidates/${id}, party Badge, "Incumbent" Badge when is_incumbent, filing status Badge with opacity dimming for withdrawn/disqualified, "Write-In" Badge for write_in per FR-011
- [x] T032 [P] [US2] Create ElectionKeyDates component in src/components/elections/ElectionKeyDates.tsx — accept election prop; display registration_deadline, early_voting_start/end, absentee_request_deadline, qualifying_start/end as labeled date rows in a Card; highlight upcoming dates (within 30 days); return null when all date fields are null per FR-021 and research.md R8
- [x] T033 [P] [US2] Create ElectionEligibility component in src/components/elections/ElectionEligibility.tsx — accept election prop; display eligibility_description when non-null, fall back to "Registered voters in {district}", fall back to generic "Contact your local election office for eligibility details" per FR-012
- [x] T034 [P] [US2] Create ElectionGeographicArea component in src/components/elections/ElectionGeographicArea.tsx — accept election prop; display election.district as the geographic area label per FR-013. Minimal component — a Card with the district string and an optional MapPin icon.
- [x] T035 [P] [US2] Create ElectionMetadata component in src/components/elections/ElectionMetadata.tsx — accept election prop; display formatted date, capitalized election type, status Badge, and data_source_url as external link (when non-null, with Globe icon) per FR-014
- [x] T036 [US2] Create CandidateList component in src/components/elections/CandidateList.tsx — fetch candidates via useCandidates(electionId, { page_size: 100 }) to ensure all candidates are returned (API max is 100, expected 2-20 per election), fall back to results candidates from useRaceResults when candidates are empty, show "Candidates not yet announced" when neither source has data; render sorted CandidateCard components; show inline error with retry button when API fails; accept isAdmin prop for admin controls placeholder per FR-011 and edge cases
- [x] T037 [US2] Create ElectionInfoTab container in src/components/elections/ElectionInfoTab.tsx — accept election and electionId props; compose CandidateList, ElectionEligibility, ElectionGeographicArea, ElectionKeyDates, ElectionMetadata in structured Card layout per FR-010 through FR-014, FR-021

### Routes

- [x] T038 [US2] Integrate ElectionInfoTab into src/routes/elections/$electionId.tsx — add TabsTrigger value="info" label "Election Information" and TabsContent rendering ElectionInfoTab — NOTE: Integrated into ElectionDetailPage component (extracted from route)
- [x] T039 [US2] Create candidate detail route in src/routes/candidates/$candidateId.tsx — fetch getCandidateDetail via useCandidateDetail; display Avatar (photo or initials), full_name, party, filing status Badge, incumbent Badge, bio section, external links grouped by link_type with Lucide icons (Globe for website, ExternalLink for campaign, social icons), election results section (vote count, party) when available; back-navigation "← Back to {election.name}" Link using election_id; 404 handling with link to /elections per FR-028, FR-029, FR-030

### Unit Tests

- [x] T040 [P] [US2] Write unit tests for CandidateCard in tests/components/elections/CandidateCard.test.tsx — test Avatar with photo, Avatar with initials fallback, party badge, incumbent badge, filing status badges (all 4 statuses), dimming for non-qualified, Link to candidate detail
- [x] T041 [P] [US2] Write unit tests for ElectionKeyDates in tests/components/elections/ElectionKeyDates.test.tsx — test all dates displayed, upcoming highlighting, returns null when all null, partial dates
- [x] T042 [P] [US2] Write unit tests for ElectionEligibility in tests/components/elections/ElectionEligibility.test.tsx — test API field preferred, district fallback, generic fallback
- [x] T043 [P] [US2] Write unit tests for ElectionGeographicArea in tests/components/elections/ElectionGeographicArea.test.tsx — test district string renders, handles null/empty district gracefully
- [x] T044 [P] [US2] Write unit tests for ElectionMetadata in tests/components/elections/ElectionMetadata.test.tsx — test date formatting, type capitalization, status badge, data_source_url link rendered when present and hidden when null
- [x] T045 [P] [US2] Write unit tests for CandidateList in tests/components/elections/CandidateList.test.tsx — test candidates from API with page_size=100, results fallback, "not yet announced" empty state, error state with retry, sort order, admin placeholder visibility
- [x] T046 [US2] Write unit tests for ElectionInfoTab in tests/components/elections/ElectionInfoTab.test.tsx — test all sections render, candidates integration
- [x] T047 [US2] Write unit tests for candidate detail page in tests/routes/candidates/candidate-detail.test.tsx — test candidate info renders, back link, external links grouped by type, results data, 404 handling

**Checkpoint**: User Stories 1 AND 2 are both independently functional. The elections list and election information tab work end-to-end. Candidate detail page works.

---

## Phase 5: User Story 3 — Intelligent Default Tab (Priority: P2)

**Goal**: Automatically select the most relevant tab on page load. Default to "Election Information" when no results exist; default to "Results" when results are available. URL ?tab= param always overrides.

**Independent Test**: Navigate to an election with no results → info tab is default. Navigate to an election with results → results tab is default. Open URL with ?tab=info on an election with results → info tab shown. Manually click tabs → works regardless of default.

### Implementation

- [x] T048 [US3] Implement tab defaulting logic in src/routes/elections/$electionId.tsx — determine hasResults from useRaceResults (check results.candidates.length > 0); compute defaultTab as hasResults ? "results" : "info"; use URL ?tab= param when present as override; set initial tab value to searchParam.tab ?? defaultTab; ensure tab default is computed once on load and does not force-switch if results arrive while user is on another tab per FR-015 through FR-018 and research.md R3 — NOTE: Implemented in ElectionDetailPage component

### Unit Tests

- [ ] T049 [US3] Write unit tests for tab defaulting in tests/routes/elections/election-detail-tabs.test.tsx — test no results → info default, active results → results default, finalized results → results default, ?tab=info override, ?tab=participation override, manual tab switch, results arriving while on info tab does not force switch

**Checkpoint**: All three voter-facing user stories are independently functional. Tab defaulting works correctly across all election lifecycle stages.

---

## Phase 6: User Story 4 — Admin Candidate Management (Priority: P2)

**Goal**: Admin users can create, edit, and delete candidates for an election via shadcn Dialog forms on the Election Information tab. Includes link management (add/remove external links).

**Independent Test**: Log in as admin, navigate to an election, verify "Add Candidate" button visible. Click → Dialog opens → fill form (name, party, bio, links) → submit → candidate appears in list. Click "Edit" on a candidate → Dialog opens pre-populated → change fields → save. Click "Delete" → confirmation AlertDialog → confirm → candidate removed. Verify non-admin users do not see any admin controls.

### Hooks

- [x] T050 [P] [US4] Create src/lib/hooks/use-admin-candidates.ts — implement TanStack Query mutations: useCreateCandidate() calling createCandidate (invalidates ["elections", electionId, "candidates"], handles 409 with toast), useUpdateCandidate() calling updateCandidate (invalidates candidates + candidate detail queries), useDeleteCandidate() calling deleteCandidate (invalidates candidates query), useCreateCandidateLink() calling createCandidateLink (invalidates candidate detail), useDeleteCandidateLink() calling deleteCandidateLink (invalidates candidate detail). All show success/error toasts via Sonner and handle 401/403 typed errors per contracts/candidates-api.md

### Components

- [x] T051 [P] [US4] Create src/components/elections/AdminCandidateLinkForm.tsx — dynamic form array for candidate links using React Hook Form useFieldArray; each row: link_type Select (8 options), url Input, label Input, remove IconButton; "Add Link" button appends new row per FR-025
- [x] T052 [US4] Create src/components/elections/AdminCandidateDialog.tsx — shadcn Dialog with React Hook Form + Zod validation. Fields: full_name (required, max 200), party, bio (Textarea), photo_url (URL validation), ballot_order (number), filing_status (Select: 4 options, default "qualified"), is_incumbent (Checkbox), links section (AdminCandidateLinkForm). Mode prop: "create" shows empty form with inline link editing (links embedded in POST body), "edit" pre-populates from existing candidate with current links displayed. Handle 409 conflict → inline error on full_name. On submit: CREATE mode calls createCandidate (links included in request body); EDIT mode calls updateCandidate for candidate fields, then diffs original vs. modified links array — calls useDeleteCandidateLink for removed links, useCreateCandidateLink for added links (sequential after candidate update succeeds). Close dialog on success, invalidate queries per FR-023, FR-024, FR-026, FR-027
- [x] T053 [US4] Update src/components/elections/CandidateList.tsx — add useUserRole() check; show "Add Candidate" Button (admin only) opening AdminCandidateDialog in create mode; add "Edit" IconButton on each CandidateCard (admin only) opening AdminCandidateDialog in edit mode; add "Delete" IconButton (admin only) opening shadcn AlertDialog with confirmation, calling useDeleteCandidate on confirm per FR-027

### Unit Tests

- [ ] T054 [P] [US4] Write unit tests for admin candidate hooks in tests/lib/hooks/use-admin-candidates.test.ts — test all 5 mutations: correct API calls, query invalidation, toast notifications, 409 conflict handling, 401/403 error handling
- [ ] T055 [P] [US4] Write unit tests for AdminCandidateLinkForm in tests/components/elections/AdminCandidateLinkForm.test.tsx — test render link rows, add link, remove link, link_type select options, URL/label inputs
- [ ] T056 [US4] Write unit tests for AdminCandidateDialog in tests/components/elections/AdminCandidateDialog.test.tsx — test create mode empty form with inline links submitted in POST body, edit mode pre-populated with existing links, Zod validation (full_name required, max 200, photo_url URL), 409 inline error, dialog closes on success, edit mode link diff (adding a new link calls useCreateCandidateLink, removing an existing link calls useDeleteCandidateLink)
- [ ] T057 [US4] Update unit tests for CandidateList in tests/components/elections/CandidateList.test.tsx — add admin control tests: "Add Candidate" button visible only for admin role, "Edit"/"Delete" buttons on cards for admin only, AlertDialog confirmation on delete, all controls hidden for non-admin users

**Checkpoint**: Admin users can fully manage candidates via Dialog forms. Links manageable within Dialog. Non-admins see read-only view.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: E2E tests, visual verification, linting, build validation.

### E2E Fixtures

- [x] T058 [P] Update E2E mock data in e2e/fixtures/mock-data.ts — add candidateListResponse (CandidateSummary[]), candidateDetailResponse (CandidateDetail with links), elections with new metadata fields (purpose, eligibility_description, key dates), elections with and without results (for tab defaulting tests)
- [x] T059 [P] Update E2E API fixture in e2e/fixtures/election-api.ts — add page.route() intercepts for GET /elections/{id}/candidates → mock list, GET /candidates/{id} → mock detail, updated GET /elections and GET /elections/{id} with metadata fields

### E2E Tests

- [x] T060 [P] Write E2E test for elections list in e2e/elections-list.spec.ts — test list renders with name/date/description, search filters results, status/type filters work, pagination, click navigates to detail page, legacy URL redirect
- [x] T061 [P] Write E2E test for Election Information tab in e2e/election-info-tab.spec.ts — test info tab visible, candidates display with names/parties/badges, eligibility display, key dates display (or hidden), geographic area, metadata, tab defaulting (no results → info, with results → results), ?tab= URL override
- [x] T062 [P] Write E2E test for candidate detail in e2e/candidate-detail.spec.ts — test candidate page renders with name/party/badges/bio/links, back navigation works, 404 for invalid ID

### Visual Verification

- [x] T063 Visually verify elections list using Playwright MCP — navigate to http://localhost:5173/elections, take screenshot to screenshots/elections-list.png, verify list items, filters, pagination — NOTE: Verified with empty state (no election data in DB); UI structure correct
- [x] T064 Visually verify election info tab using Playwright MCP — navigate to an election detail, take screenshot to screenshots/election-info-tab.png, verify 3 tabs, candidates, key dates, eligibility — NOTE: Verified error state renders correctly (no election data in DB)
- [x] T065 Visually verify candidate detail using Playwright MCP — navigate to a candidate page, take screenshot to screenshots/candidate-detail.png, verify avatar, name, badges, bio, links — NOTE: Verified error/404 state renders correctly with "Back to elections" link

### Final Checks

- [x] T066 Run `npm run lint` and fix any ESLint errors across all new and modified files
- [x] T067 Run `npm run build` and verify clean typecheck and production build
- [x] T068 Run `npm test -- --run --coverage` and verify new code meets 95% coverage threshold — 688 tests passed
- [x] T069 Run `npm run test:e2e` and verify all E2E tests pass — 49 E2E tests passed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — install Avatar, verify branch
- **Foundational (Phase 2)**: Depends on Phase 1 (Avatar install) — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — creates flat list and migrated detail route
- **US2 (Phase 4)**: Depends on Phase 2 + T022 from US1 ($electionId.tsx route must exist)
- **US3 (Phase 5)**: Depends on US2 (needs info tab integrated into detail route)
- **US4 (Phase 6)**: Depends on US2 (extends CandidateList with admin controls)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Depends only on Phase 2 — creates the flat list and migrated detail route
- **US2 (P1)**: Depends on Phase 2 + T022 ($electionId.tsx from US1) — adds info tab and candidate detail
- **US3 (P2)**: Depends on US2 — adds tab defaulting logic to existing detail route
- **US4 (P2)**: Depends on US2 — extends CandidateList with admin CRUD controls
- **US3 and US4**: Independent of each other — can be done in either order or in parallel

### Within Each User Story

- Types/API/hooks before components
- Components before route integration
- Implementation before tests (tests validate implementation)
- Commit after each logical group

### Parallel Opportunities

**Phase 2 (Foundational)**:
```
Parallel: T003, T004, T005, T006 (type definitions)
Parallel: T007, T008 (API clients)
Parallel: T010, T011, T012 (utilities)
Parallel: T013, T014 (mocks)
Parallel: T015, T016, T017, T018, T019 (tests)
```

**Phase 3 (US1)**:
```
Sequential: T020 → T021 → T022 → T023 → T024
Parallel: T025, T026 (redirect routes)
Parallel: T027, T028 (hook tests)
After routes: T029, T030 (route tests)
```

**Phase 4 (US2)**:
```
Parallel: T031, T032, T033, T034, T035 (leaf components)
Sequential: T036 (CandidateList, depends on T031)
Sequential: T037 (ElectionInfoTab, depends on T032-T036)
Sequential: T038 (route integration), T039 (candidate detail route)
Parallel: T040, T041, T042, T043, T044, T045 (component tests)
Sequential: T046, T047 (container + route tests)
```

**Phase 6 (US4)**:
```
Parallel: T050, T051 (hooks + link form)
Sequential: T052 (dialog, depends on T051)
Sequential: T053 (CandidateList update, depends on T052)
Parallel: T054, T055 (hook + link form tests)
Sequential: T056, T057 (dialog + list tests)
```

**Phase 7 (Polish)**:
```
Parallel: T058, T059 (fixture updates)
Parallel: T060, T061, T062 (E2E tests)
Parallel: T063, T064, T065 (visual verification)
Sequential: T066 → T067 → T068 → T069 (final checks)
```

**Cross-phase**: US1 and US2 can overlap — US1 creates the route shell (T022), US2 adds info tab (T038).

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Navigate to `/elections/`, search, filter, click through to detail page. Verify legacy URLs redirect.
5. Complete Phase 4: User Story 2
6. **STOP and VALIDATE**: Verify Election Information tab with candidates, eligibility, key dates. Verify candidate detail page.
7. Commit and deploy/demo MVP

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Commit (MVP: flat searchable elections list)
3. Add User Story 2 → Test independently → Commit (Election Information tab with candidates, eligibility, key dates, candidate detail page)
4. Add User Story 3 → Test independently → Commit (Intelligent tab defaulting)
5. Add User Story 4 → Test independently → Commit (Admin candidate CRUD)
6. Polish → E2E tests, lint, build, visual verify → Final commit

### Suggested Commit Points

- After Phase 2: `feat(elections): add candidate types, API client, hooks, and utilities`
- After Phase 3: `feat(elections): replace date drill-down with flat searchable list`
- After Phase 4: `feat(elections): add Election Information tab and candidate detail page`
- After Phase 5: `feat(elections): add intelligent default tab based on results availability`
- After Phase 6: `feat(elections): add admin candidate management with Dialog CRUD`
- After Phase 7: `test(elections): add E2E tests and visual verification for elections discovery`

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The `groupElectionsByDate` function and `ElectionEvent` type in src/types/elections.ts can be retained for backward compatibility, but the elections list page no longer uses them
- The `_components/` directory under `$electionDate/` (race-list.tsx, race-list-item.tsx) will become unused after legacy routes become redirects — can be cleaned up in Polish phase
