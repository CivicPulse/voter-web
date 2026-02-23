# Tasks: Voter History & Election Participation

**Input**: Design documents from `/specs/006-voter-history-participation/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Tests**: Required by Constitution Principle III (95% unit test coverage). Unit test tasks are included within each user story phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install new UI primitives required by multiple user stories

- [x] T001 Install shadcn/ui Tabs component via `npx shadcn@latest add tabs` to `src/components/ui/tabs.tsx`

---

## Phase 2: Foundational (Types & API Clients)

**Purpose**: Shared TypeScript types and API client functions that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Add `VoterParticipationRecord` interface (with `election_id`, `election_name`, `election_date`, `election_type`, `voting_method` fields) to `src/types/voter.ts`
- [x] T003 [P] Add participation types (`ParticipationStats`, `PartyBreakdownItem`, `MethodBreakdownItem`, `ElectionParticipant`, `ElectionParticipantsResponse`) to `src/types/elections.ts` per data-model.md
- [x] T004 Add `getVoterHistory(voterRegistrationNumber: string)` API client function to `src/api/voters.ts` calling `GET /voters/{voter_registration_number}/history` per contracts/voter-history.yaml (depends on T002)
- [x] T005 Add `getParticipationStats(electionId: string)` and `getElectionParticipants(electionId: string, params: { page?, page_size?, q? })` API client functions to `src/lib/api/elections.ts` per contracts/participation-stats.yaml and contracts/election-participants.yaml (depends on T003)

**Checkpoint**: All types and API client functions are in place — user story implementation can now begin

---

## Phase 3: User Story 1 — View a Voter's Election History (Priority: P1) 🎯 MVP

**Goal**: Display a voter's election participation history as a new card on the voter detail page, with client-side filtering by election type and date range, empty state, error handling, and clickable links to election detail pages.

**Independent Test**: Navigate to any voter detail page → scroll below District Assignments card → verify "Election History" card shows a chronological list (most recent first), election type filter dropdown, date range filter, clickable entries, and empty state when no records exist.

### Implementation for User Story 1

- [x] T006 [US1] Add `useVoterHistory(voterRegistrationNumber: string)` TanStack Query hook to `src/hooks/useVoters.ts` — fetches voter history via `getVoterHistory()`, returns `{ data, isLoading, isError, refetch }`
- [x] T007 [US1] Create `VoterHistoryCard` component in `src/routes/voters/_components/VoterHistoryCard.tsx` — renders shadcn Card with: chronological list (most recent first) showing election name, election date, election type badge, voting method; election type dropdown filter (all/general/primary/special/runoff); date range filter; clickable rows navigating to election detail page via TanStack Router; loading skeleton; error state with retry button; empty state message when no history exists
- [x] T008 [US1] Integrate `VoterHistoryCard` into voter detail page below the District Assignments card in `src/routes/voters/$voterId.tsx` — pass `voter_registration_number` from voter detail data

### Tests for User Story 1

- [x] T009 [P] [US1] Unit tests for `useVoterHistory` hook in `tests/hooks/useVoterHistory.test.ts` — test successful fetch, loading state, error state, refetch, and empty response
- [x] T010 [P] [US1] Unit tests for `VoterHistoryCard` component in `tests/components/VoterHistoryCard.test.tsx` — test rendering with data (election name, date, type badge, voting method), empty state, error state with retry, election type filter, date range filter, click navigation to election detail page, most-recent-first sorting
- [x] T011 [US1] Update voter detail page tests in `tests/routes/voters/$voterId.test.tsx` — add assertions for VoterHistoryCard presence below District Assignments card

**Checkpoint**: User Story 1 is fully functional and tested — voter history card visible on voter detail page with filtering and navigation

---

## Phase 4: User Story 2 — View Aggregate Participation Statistics for an Election (Priority: P2)

**Goal**: Add a "Participation" tab to the election detail page showing aggregate turnout statistics (headline figures + Recharts charts for party and voting method breakdowns), with preliminary data labeling for active elections.

**Independent Test**: Navigate to any election detail page → verify "Results" and "Participation" tabs appear → click "Participation" tab → verify headline stats (total eligible, total voted, turnout %), party donut chart, voting method bar chart, and preliminary badge on active elections.

### Implementation for User Story 2

- [x] T012 [US2] Create `useParticipationStats(electionId: string)` TanStack Query hook in `src/lib/hooks/use-participation-stats.ts` — fetches stats via `getParticipationStats()`, returns `{ data, isLoading, isError, refetch }`
- [x] T013 [US2] Create `ParticipationStatsCard` component in `src/components/elections/ParticipationStatsCard.tsx` — renders: headline summary row (total eligible, total voted, turnout % as large prominent figures); display "N/A" for turnout percentage when `total_eligible` is 0; `PieChart` (donut style via `innerRadius`) for party affiliation breakdown using existing `PARTY_COLORS` from `src/types/elections.ts`; horizontal `BarChart` (`layout="vertical"`) for voting method breakdown; "Preliminary" badge when `is_preliminary` is true; loading skeleton; error state with retry; empty state when no data available; all charts wrapped in `ResponsiveContainer` with defined parent height
- [x] T014 [US2] Create `ParticipationTab` container component in `src/components/elections/ParticipationTab.tsx` — renders `ParticipationStatsCard` passing `electionId`; accepts `electionId` prop
- [x] T015 [US2] Restructure election detail page in `src/routes/elections/$electionDate/$electionId.tsx` — add Zod `validateSearch` schema with `tab` param (default `"results"`); wrap existing page content (race results + map) in `TabsContent value="results"`; add `TabsContent value="participation"` with lazy-mounted `ParticipationTab`; shared header/breadcrumb/status remain above Tabs; sync active tab to URL via `navigate({ search: { tab }, replace: true })`

### Tests for User Story 2

- [x] T016 [P] [US2] Unit tests for `useParticipationStats` hook in `tests/hooks/use-participation-stats.test.ts` — test successful fetch, loading, error, refetch, and empty/null response
- [x] T017 [P] [US2] Unit tests for `ParticipationStatsCard` in `tests/components/ParticipationStatsCard.test.tsx` — test headline figures rendering, party donut chart, method bar chart, preliminary badge, zero-eligible turnout "N/A" handling, empty state, error state with retry
- [x] T018 [P] [US2] Unit tests for `ParticipationTab` in `tests/components/ParticipationTab.test.tsx` — test stats card rendering with election ID prop, loading/error state passthrough, no voter list present (added in Phase 5)

**Checkpoint**: User Story 2 is fully functional and tested — election detail page has tabbed interface with participation statistics

---

## Phase 5: User Story 3 — Browse Voters Who Participated in an Election (Priority: P3)

**Goal**: Add a paginated, searchable voter list to the Participation tab, restricted to admin/analyst roles. Viewers see only the stats card.

**Independent Test**: Log in as admin/analyst → navigate to election detail → Participation tab → verify voter table with columns (Name, Registration #, County, Voting Method), pagination controls, search field, and clickable voter links. Log in as viewer → verify voter list is NOT visible (only stats card).

### Implementation for User Story 3

- [ ] T019 [US3] Create `useElectionParticipants(electionId: string, params: { page, pageSize, search }, enabled: boolean)` TanStack Query hook in `src/lib/hooks/use-election-participants.ts` — fetches participants via `getElectionParticipants()` with `keepPreviousData: true` for smooth pagination; `enabled` flag gates the query on admin/analyst role
- [ ] T020 [US3] Create `ElectionParticipantList` component in `src/components/elections/ElectionParticipantList.tsx` — renders: search input (debounced, filters by voter name or registration number via `q` param); shadcn/ui Table with columns: Name (`first_name last_name`), Registration # (`voter_registration_number`), County, Voting Method; clickable voter name/registration navigates to voter detail page; pagination controls (prev/next/page indicator) using `pagination` response metadata; loading skeleton; error state with retry; empty state for no results; empty state for no matching search
- [ ] T021 [US3] Update `ParticipationTab` in `src/components/elections/ParticipationTab.tsx` — import `useUserRole()` hook; conditionally render `ElectionParticipantList` below `ParticipationStatsCard` only when `role === "admin" || role === "analyst"`; completely unmount (not just hide) the list component for viewer-role users

### Tests for User Story 3

- [ ] T022 [P] [US3] Unit tests for `useElectionParticipants` hook in `tests/hooks/use-election-participants.test.ts` — test fetch with pagination params, search param, enabled flag, loading/error states
- [ ] T023 [P] [US3] Unit tests for `ElectionParticipantList` in `tests/components/ElectionParticipantList.test.tsx` — test table rendering, column content, pagination controls, search input with debounce, click navigation to voter detail, empty state, no-match state, error with retry
- [ ] T023b [US3] Update `ParticipationTab` tests in `tests/components/ParticipationTab.test.tsx` — add assertions for: admin/analyst role renders `ElectionParticipantList` below stats card; viewer role renders only `ParticipationStatsCard` (no voter list component mounted); component unmounts (not hides) the list for viewer role
- [ ] T024 [US3] Update election detail page tests in `tests/routes/elections/$electionDate/$electionId.test.tsx` — add assertions for tab switching (Results/Participation), URL sync of tab param, participation content lazy mount

**Checkpoint**: All three user stories are independently functional and tested

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, quality checks, and E2E coverage

- [ ] T025 [P] Run ESLint and fix any linting issues across all new and modified files (`npm run lint`)
- [ ] T026 Run TypeScript type check and production build (`npm run build`)
- [ ] T027 [P] Add E2E mock data to `e2e/fixtures/mock-data.ts` (voter history records, participation stats, election participants) and create E2E test spec in `e2e/voter-history.spec.ts` covering: voter history card on voter detail page, election participation tab with stats, and voter list for admin users
- [ ] T028 Visual verification of all affected pages using Playwright MCP — voter detail page with history card, election detail page with Results/Participation tabs, stats charts, and voter list; include both desktop and mobile (375px) viewports (save screenshots to `screenshots/`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion — no dependencies on other stories
- **User Story 2 (Phase 4)**: Depends on Foundational phase completion — no dependencies on other stories
- **User Story 3 (Phase 5)**: Depends on User Story 2 completion (uses the `ParticipationTab` component and the tabbed election detail page structure from Phase 4)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent — only needs types (T002) and voter API client (T004)
- **User Story 2 (P2)**: Independent — needs types (T003), election API client (T005), and Tabs (T001)
- **User Story 3 (P3)**: Depends on User Story 2 — extends `ParticipationTab` (T014) and uses the tabbed election detail page (T015)

### Within Each User Story

- Hook before component (component uses the hook)
- Component before page integration (page imports the component)
- Container before page restructure (US2: ParticipationTab before election detail page tabs)
- Implementation before tests (tests import and exercise the implementations)

### Parallel Opportunities

- **Phase 2**: T002 + T003 in parallel (types), then T004 + T005 in parallel (API clients)
- **Phase 3 + Phase 4**: User Stories 1 and 2 are independent and can run in parallel
- **Within each story**: Test tasks marked [P] can run in parallel with each other after implementation completes
- **Phase 6**: T025 (lint) and T027 (E2E) can run in parallel

---

## Parallel Example: User Story 1 + User Story 2

```bash
# After Phase 2 completes, launch US1 and US2 in parallel:

# Stream 1 (US1): Voter History
Task: T006 — useVoterHistory hook in src/hooks/useVoters.ts
Task: T007 — VoterHistoryCard in src/routes/voters/_components/VoterHistoryCard.tsx
Task: T008 — Integrate into src/routes/voters/$voterId.tsx
Task: T009, T010 — Unit tests (parallel)
Task: T011 — Route test update

# Stream 2 (US2): Participation Statistics
Task: T012 — useParticipationStats hook in src/lib/hooks/use-participation-stats.ts
Task: T013 — ParticipationStatsCard in src/components/elections/ParticipationStatsCard.tsx
Task: T014 — ParticipationTab in src/components/elections/ParticipationTab.tsx
Task: T015 — Tabs in src/routes/elections/$electionDate/$electionId.tsx
Task: T016, T017, T018 — Unit tests (parallel)

# After US2 completes, start US3:
Task: T019–T024 — Election participant list + role gating + tests
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (install Tabs)
2. Complete Phase 2: Foundational (types + API clients)
3. Complete Phase 3: User Story 1 (voter history card + tests)
4. **STOP and VALIDATE**: Navigate to voter detail page → verify history card with filtering
5. Deploy/demo if ready — voters can see their participation history

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (election stats tab)
4. Add User Story 3 → Test independently → Deploy/Demo (voter list for admins)
5. Each story adds value without breaking previous stories

### Key Technical Decisions (from research.md)

- **Recharts**: First use in codebase. `PieChart` (donut) for party, `BarChart` (horizontal) for method. `Cell` is deprecated in 3.x — use `fill` in data objects or `shape` prop.
- **Tabs**: shadcn/ui Tabs with URL-synced `tab` search param. Default tab: `"results"`. Lazy mount participation content.
- **Role gating**: Existing `useUserRole()` hook with `enabled: isAdmin` on the participants query. Stats visible to all; voter list unmounted for viewers.
- **Client-side filtering**: Voter history loads all records; filters applied client-side. Election participants use server-side pagination + search (`q` param).

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Recharts is already installed (v3.7.0) but unused — first integration in this feature
- The `PARTY_COLORS` mapping in `src/types/elections.ts` provides Dem/Rep/Lib/Grn/Ind colors for charts
