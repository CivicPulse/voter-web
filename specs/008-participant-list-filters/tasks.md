# Tasks: Participant List Filters

**Input**: Design documents from `/specs/008-participant-list-filters/`
**Branch**: `008-participant-list-filters`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Organization**: Tasks grouped by user story for independent implementation and testing.
**Tests**: Included per constitution (95% coverage requirement).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task serves

---

## Phase 1: Setup

**Purpose**: Minimal initialization — branch already exists, no new packages needed.

- [X] T001 Verify dev server runs and participation tab loads in `src/components/elections/ElectionParticipantList.tsx`
- [X] T002 Add `ParticipantUrlParams` type and `ParticipantFilterParams` interface to `src/types/elections.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infrastructure that ALL user story phases depend on. Must be complete before any filter phase begins.

**⚠️ CRITICAL**: Nothing in Phase 3+ can work until this phase is complete.

- [X] T003 Extend `searchSchema` in `src/routes/elections/$electionDate.tsx` with all `p_*` params (`p_q`, `p_county`, `p_voter_status`, `p_mismatch`, `p_precinct`, `p_ballot_style`, `p_congressional`, `p_senate`, `p_house`, `p_page`)
- [X] T004 [P] Extend `getElectionParticipants()` in `src/lib/api/elections.ts` to accept and forward `county`, `voter_status`, `has_district_mismatch`, `county_precinct`, `ballot_style`, `congressional_district`, `state_senate_district`, `state_house_district` query params
- [X] T005 Extend `useElectionParticipants` hook in `src/lib/hooks/use-election-participants.ts` to accept all filter params in its `params` object and include them in the query key (depends on T004)
- [X] T006 Refactor `ElectionParticipantList` in `src/components/elections/ElectionParticipantList.tsx` to accept `params: ParticipantUrlParams` and `onUpdate: (updates: Partial<ParticipantUrlParams>) => void` props; remove internal `useState` for `page` and `searchInput`; derive page from `params.p_page ?? 1` (depends on T002)
- [X] T007 Update `ParticipationTab` in `src/components/elections/ParticipationTab.tsx` to read `p_*` search params via `useSearch({ from: "/elections/$electionDate" })`, provide `navigate`-based `onUpdate` callback, and pass both to `ElectionParticipantList` (depends on T003, T006)
- [X] T008 [P] Write unit tests for `getElectionParticipants` filter param forwarding in `tests/lib/api/elections.test.ts`
- [X] T009 Write unit tests for `useElectionParticipants` with extended params and query key in `tests/lib/hooks/use-election-participants.test.ts` (depends on T005)
- [X] T010 Write unit tests for refactored `ElectionParticipantList` prop interface (params-driven pagination, empty state) in `tests/components/elections/ElectionParticipantList.test.tsx` (depends on T006)

**Checkpoint**: Foundation complete — route schema, API layer, hook, and component interfaces are in place. No filters are visible yet; the list still renders (with page from URL or defaulting to 1) and search still works via `p_q`.

---

## Phase 3: User Story 1 — County Filter + User Story 2 — URL Persistence (Priority: P1) 🎯 MVP

**US1 Goal**: Analyst can select a county from a dropdown; participant list updates to show only that county's voters.

**US2 Goal**: Filter state lives in URL search params — applying a county filter updates the URL; sharing the URL opens the same filtered view.

> **Note**: US1 and US2 are implemented together because URL persistence is the mechanism through which the county filter operates. There is no intermediate state where county filtering works without URL sync.

**Independent Test**: Select a county from the dropdown → list updates → copy URL → open in new tab → same county selected, same results shown.

- [X] T011 [US1] Create `ParticipantFilters` component scaffold in `src/components/elections/ParticipantFilters.tsx` with props `{ electionId, params, onUpdate }`, debounced search input wired to `p_q`, and `updateFilter` helper that resets `p_page` on every call
- [X] T012 [US1] Add county Select dropdown to `ParticipantFilters` in `src/components/elections/ParticipantFilters.tsx`: load county options from `useParticipationStats(electionId)` → `county_breakdown`, "All Counties" sentinel, `onValueChange` calls `updateFilter({ p_county })`
- [X] T013 [US1] Render `<ParticipantFilters>` inside `ElectionParticipantList` in `src/components/elections/ElectionParticipantList.tsx`, above the table; update empty state to use `hasActiveFilters(params)` for dual-message logic (depends on T011, T012)
- [X] T014 [US2] Verify URL updates correctly: county param appears/disappears in URL on select/clear; resetting to "All Counties" removes `p_county` from URL (test in `tests/components/elections/ParticipantFilters.test.tsx`, verify navigation mock called with `undefined` for "all")
- [X] T015 [P] [US1] Write unit tests for `ParticipantFilters` county dropdown: renders options from stats, calls `onUpdate` with county value, calls `onUpdate` with `undefined` on "All Counties" — in `tests/components/elections/ParticipantFilters.test.tsx`
- [X] T016 [P] [US2] Write unit tests for `ParticipationTab` URL bridge: `useSearch` params passed to `ElectionParticipantList`, `onUpdate` calls `navigate` with merged search — in `tests/components/elections/ParticipationTab.test.tsx`
- [X] T017 [US1] Visual verification: `npm run dev` → navigate to election participation tab → confirm county dropdown renders, selecting a county updates the list and URL, clearing restores all results — save screenshots to `screenshots/008/county-filter.png`

**Checkpoint**: US1 + US2 complete. County filter is functional. URL reflects filter state. Shareable/bookmarkable county-filtered views work.

---

## Phase 4: User Story 3 — Voter Status Filter (Priority: P2)

**Goal**: Analyst can filter participants by voter registration status (Active, Inactive, etc.).

**Independent Test**: Select "Active" from status dropdown → list shows only Active voters → URL includes `p_voter_status=Active` → copying URL restores filter.

- [X] T018 [US3] Add voter status Select dropdown to `ParticipantFilters` in `src/components/elections/ParticipantFilters.tsx`: load status options from `useVoterFilters(undefined)` → `statuses[]`, "All Statuses" sentinel, `onValueChange` calls `updateFilter({ p_voter_status })`
- [X] T019 [P] [US3] Write unit tests for voter status dropdown: renders dynamic status options, fires correct `onUpdate` on selection — in `tests/components/elections/ParticipantFilters.test.tsx`
- [X] T020 [US3] Visual verification: select "Active" status → URL shows `p_voter_status=Active` → list refreshes — save screenshot to `screenshots/008/status-filter.png`

**Checkpoint**: US3 complete. Status dropdown works alongside county filter. Both P1 stories remain functional.

---

## Phase 5: User Story 4 — Legislative District Filters (Priority: P2)

**Goal**: Analyst can filter by congressional, state senate, or state house district.

**Independent Test**: Select a congressional district → list shows only participants in that district → URL includes `p_congressional=002` → combining with county filter shows intersection.

- [X] T021 [US4] Add congressional district, state senate district, and state house district Select dropdowns to `ParticipantFilters` in `src/components/elections/ParticipantFilters.tsx`: load options from `useVoterFilters({ county: params.p_county })` when county is selected, otherwise `useVoterFilters(undefined)`, with "All Congressional/State Senate/State House" sentinels
- [X] T022 [US4] Handle county change clearing county-scoped filters: when `p_county` changes, clear **only `p_precinct`** from URL in `ParticipantFilters` using a `useEffect` tracking `params.p_county`. Congressional, state senate, and state house district params are preserved — they combine with the new county filter per US4 AC5 and the spec edge case. (Same pattern as `VoterSearchFilters` prevCountyRef, but scoped to precinct only)
- [X] T023 [P] [US4] Write unit tests for district dropdowns: options load from voter filters hook, county change clears district selection, `onUpdate` called with correct district param — in `tests/components/elections/ParticipantFilters.test.tsx`
- [X] T024 [US4] Visual verification: select congressional district → URL shows `p_congressional=002` → combine with county filter → list narrows to intersection — save screenshot to `screenshots/008/district-filters.png`

**Checkpoint**: US4 complete. All P2 stories functional. Six filters now available.

---

## Phase 6: User Story 5 — Precinct & Ballot Style Filters (Priority: P3)

**Goal**: Analyst can filter by county precinct or ballot style.

**Independent Test**: Select a precinct from the precinct dropdown (available when county is selected) → list narrows to that precinct. Select ballot style → list shows only that ballot variant.

- [X] T025 [US5] Add county precinct Select dropdown to `ParticipantFilters` in `src/components/elections/ParticipantFilters.tsx`: visible and populated when `p_county` is set; load from `useVoterFilters({ county: params.p_county })` → `county_precincts[]`; "All Precincts" sentinel; grouped in county-scoped second row (matching `VoterSearchFilters` second-row pattern)
- [X] T026 [US5] Add ballot style Select dropdown to `ParticipantFilters` in `src/components/elections/ParticipantFilters.tsx`: load from `useParticipationStats(electionId)` → `method_breakdown` (ballot styles); "All Styles" sentinel; rendered in county second row alongside precinct (or first row if no county)
- [X] T027 [P] [US5] Write unit tests for precinct dropdown (only renders when county set, populated from voter-filters hook) and ballot style dropdown (populated from stats) — in `tests/components/elections/ParticipantFilters.test.tsx`
- [X] T028 [US5] Visual verification: select county, then select precinct → URL shows `p_precinct=001A` → select ballot style → list narrows further — save screenshot to `screenshots/008/precinct-ballot-filter.png`

**Checkpoint**: US5 complete. Precinct and ballot style filtering operational.

---

## Phase 7: User Story 6 — District Mismatch Filter (Priority: P3)

**Goal**: Analyst can filter participants to only those with a district mismatch (data quality workflow).

**Independent Test**: Select "Mismatch Only" from District Check dropdown → list shows only participants with `has_district_mismatch=true` → URL includes `p_mismatch=true` → select "No Mismatch" → list switches to non-mismatch participants.

- [X] T029 [US6] Add district mismatch Select dropdown to `ParticipantFilters` in `src/components/elections/ParticipantFilters.tsx`: static options `[{ value: "true", label: "Mismatch Only" }, { value: "false", label: "No Mismatch" }]`; "All Districts" sentinel; `onValueChange` calls `updateFilter({ p_mismatch })`; convert `"true"/"false"` string to boolean when forwarding to `useElectionParticipants` hook
- [X] T030 [P] [US6] Write unit tests for mismatch dropdown: static options render, "Mismatch Only" calls `onUpdate` with `"true"`, "All Districts" calls `onUpdate` with `undefined` — in `tests/components/elections/ParticipantFilters.test.tsx`
- [X] T031 [US6] Visual verification: select "Mismatch Only" → URL shows `p_mismatch=true` → list updates → "No Mismatch" shows opposite set — save screenshot to `screenshots/008/mismatch-filter.png`

**Checkpoint**: US6 complete. All 8 filters implemented. Full filter matrix operational.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final quality checks, accessibility, and CI validation.

- [X] T032 [P] Run `npm run lint` and fix any ESLint violations across all new/modified files
- [X] T033 [P] Run `npm test -- --run` and verify coverage ≥ 95% for all new/modified files (adjust tests if threshold not met)
- [X] T034 Run `npm run build` to verify TypeScript compiles with no type errors
- [X] T035 Full end-to-end visual verification: apply multiple combined filters (county + status + district), copy URL, open in new tab, verify filter state restored — save screenshots to `screenshots/008/combined-filters.png`
- [X] T036 Verify empty state messages: filter to impossible combination → confirm "No voters match the current filters" message appears (not "No participants found")
- [X] T037 Verify pagination reset: navigate to page 3 of an unfiltered list → apply county filter → confirm page resets to 1

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup): No dependencies — start immediately
  └─→ Phase 2 (Foundational): Depends on Phase 1 — BLOCKS all story phases
        └─→ Phase 3 (US1+US2 P1): Can start after Phase 2 ✓
        └─→ Phase 4 (US3 P2): Can start after Phase 2 (or after Phase 3)
        └─→ Phase 5 (US4 P2): Can start after Phase 2 (or after Phase 3)
        └─→ Phase 6 (US5 P3): Can start after Phase 2
        └─→ Phase 7 (US6 P3): Can start after Phase 2
              └─→ Phase 8 (Polish): After all story phases complete
```

### User Story Dependencies

- **US1+US2 (P1, Phase 3)**: Depends on Phase 2 only. No story dependencies.
- **US3 (P2, Phase 4)**: Depends on Phase 2. T011 (`ParticipantFilters` scaffold) from Phase 3 must exist first.
- **US4 (P2, Phase 5)**: Depends on Phase 2 + T011. Can parallel with US3.
- **US5 (P3, Phase 6)**: Depends on Phase 2 + T011. Can parallel with US3/US4.
- **US6 (P3, Phase 7)**: Depends on Phase 2 + T011. Can parallel with US3/US4/US5.

> All story phases after Phase 3 add a new Select to `ParticipantFilters` — same file, so US3/US4/US5/US6 must be sequential (or carefully coordinated if parallel).

### Within Each Phase

- Foundational API/hook tasks (T004, T005): T004 before T005
- Component refactor (T006): depends on T002 (types)
- Bridge (T007): depends on T003, T006
- Tests for each: after the implementation task completes
- Visual verification: always last in each phase

---

## Parallel Opportunities

### Phase 2 Parallel Block
```
T003 (route schema)  ←─ can start immediately
T004 (API client)    ←─ can start immediately (different file)
T008 (API tests)     ←─ can start immediately (different file)
```
Then sequentially: T005 → T009 → T006 → T010 → T007

### Story Phases (if multiple developers)
Once Phase 3 (T011 scaffold) is complete:
```
Dev A: Phase 4 (US3 — status dropdown)
Dev B: Phase 5 (US4 — district dropdowns)
Dev C: Phase 6 (US5 — precinct/ballot)
Dev D: Phase 7 (US6 — mismatch)
```

---

## Implementation Strategy

### MVP (US1 + US2 — County Filter + URL Persistence)

1. ✅ Phase 1: Setup (T001–T002)
2. ✅ Phase 2: Foundational (T003–T010) — builds the whole filter infrastructure
3. ✅ Phase 3: County filter + URL persistence (T011–T017)
4. **STOP and VALIDATE**: County filter works, URL is bookmarkable → meaningful analyst value delivered

### Incremental Delivery

```
Phase 3 complete → Deploy: county filter + URL persistence (US1+US2)
Phase 4 complete → Deploy: + voter status filter (US3)
Phase 5 complete → Deploy: + district filters (US4)
Phase 6 complete → Deploy: + precinct + ballot style (US5)
Phase 7 complete → Deploy: + district mismatch (US6)
Phase 8 complete → Full feature ready for PR
```

---

## Notes

- All `p_*` URL params use `.catch(undefined)` in Zod so invalid values in the URL don't crash the page — they silently clear.
- `updateFilter` always passes `p_page: undefined` to reset pagination — this is the central pagination-reset mechanism (FR-004).
- `useVoterFilters` is called with county scope when `p_county` is set; TanStack Query deduplicates parallel calls with the same args.
- `useParticipationStats` is already called in `ParticipationStatsCard` — same query key means `ParticipantFilters` calling it again costs zero network requests.
- Commit after each phase checkpoint for incremental, reviewable progress (constitution Principle I).
- Run `npm run lint` before each commit.
