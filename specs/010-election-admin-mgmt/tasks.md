# Tasks: Admin Election Management — Delete & Local Election Creation

**Input**: Design documents from `/specs/010-election-admin-mgmt/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to ([US1] Delete, [US2] Boundary Selector, [US3] Source Badge)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install missing UI components needed by the boundary selector.

- [x] T001 Install shadcn `command` component: `npx shadcn@latest add command` (creates `src/components/ui/command.tsx`)
- [x] T002 Install shadcn `popover` component: `npx shadcn@latest add popover` (creates `src/components/ui/popover.tsx`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type and schema changes that all three user stories depend on.

**⚠️ CRITICAL**: All three user story phases depend on T003–T005 being complete.

- [x] T003 Update `src/types/elections.ts` — add `source?: "sos_feed" | "manual" | null` and `boundary_id?: string | null` to `Election` interface; add `boundary_id?: string` to `CreateElectionRequest`; change `data_source_url` in `CreateElectionRequest` to optional (`data_source_url?: string`)
- [x] T004 [P] Update `src/types/boundary.ts` — add `BoundaryListItem` interface (`id`, `name`, `boundary_type`, `boundary_identifier`, `county: string | null`, `source: string`), `BoundaryListResponse` interface (`items: BoundaryListItem[]`, `pagination: { total, page, page_size, total_pages }`), and `BoundaryTypesResponse` interface (`types: string[]`)
- [x] T005 Update `src/lib/schemas/election-form.ts` — change `data_source_url` from `z.string().url()` to `z.union([z.string().url(), z.literal("")]).optional()` (accepts valid URL, empty string, or undefined — aligns with `data_source_url?: string` TypeScript type); add `boundary_id: z.string().uuid().optional()` field to `createElectionSchema` — **⚠️ After changing `data_source_url` to optional, check `tests/lib/schemas/election-form.test.ts` (or wherever `createElectionSchema` is tested) for any assertions that `data_source_url` is required and update them to reflect the new optional behavior**

**Checkpoint**: Type foundation complete — all three user story phases can now proceed.

---

## Phase 3: User Story 1 — Delete an Election (Priority: P1) 🎯 MVP

**Goal**: Administrators can delete elections from the list and detail pages via a two-step confirmation dialog. Non-admins cannot see the delete button.

**Independent Test**: Log in as admin, navigate to `/admin/elections`, click the Trash icon on any election row, confirm the dialog appears, click Delete, verify the election disappears from the list. Then log in as analyst and verify no Trash icon is visible.

### Implementation

- [x] T006 [P] [US1] Add `deleteElection(electionId: string): Promise<void>` to `src/lib/api/elections.ts` — `DELETE /elections/{electionId}`, no response body (204)
- [x] T007 [US1] Add `useDeleteElection()` mutation hook to `src/lib/hooks/use-admin-elections.ts` — `mutationFn: deleteElection`, `onSuccess`: invalidate `["admin", "elections"]` + `["elections"]` + `toast.success("Election deleted")`; `onError`: re-throw for caller on 409 (inline dialog error), `toast.error` on 401/403 (depends on T006)
- [x] T008 [US1] Create `src/routes/admin/elections/_components/delete-election-dialog.tsx` — `Dialog` component accepting `open`, `onOpenChange`, `electionName`, `electionId`, `onDeleted?: () => void` props; renders warning text, inline `Alert` for error state, Cancel + Delete buttons; uses `useDeleteElection()` mutation; on 409 HTTPError extract `error.response.json()` detail and show inline; on success call `onDeleted?.()` then close (depends on T007)
- [x] T009 [US1] Update `src/routes/admin/elections/_components/election-table.tsx` — add `isAdmin: boolean` prop to `ElectionTableProps`; when `isAdmin` is true, add Actions column as last column with `Trash2` icon `Button` variant="ghost" size="icon" per row; manage `deleteTargetId: string | null` state; render `DeleteElectionDialog` controlled by that state (depends on T008)
- [x] T010 [US1] Update `src/routes/admin/elections/index.tsx` — import and call `useUserRole()`; derive `const isAdmin = data?.role === "admin"`; pass `isAdmin` to `<ElectionTable>` (depends on T009)
- [x] T011 [US1] Update `src/routes/admin/elections/$electionId.tsx` — import `useUserRole` and `DeleteElectionDialog`; derive `isAdmin`; add delete action zone (styled like finalize/reactivate zones but `border-red-300 bg-red-50`) with `Trash2` icon button visible only when `isAdmin`; on `onDeleted` callback navigate to `/admin/elections` (depends on T008)

### Unit Tests for User Story 1

- [x] T012 [P] [US1] Add `deleteElection` unit tests to `tests/lib/api/elections.test.ts` — mock ky `.delete()`, assert 204 resolves void, assert HTTPError propagates
- [x] T013 [P] [US1] Add `useDeleteElection` unit tests to `tests/lib/hooks/use-admin-elections.test.tsx` — mock `deleteElection`; test success path (invalidates queries, shows success toast); test 409 path (error re-thrown to caller, no toast); test 401/403 path (toast.error)
- [x] T014 [P] [US1] Create `tests/routes/admin/elections/_components/delete-election-dialog.test.tsx` — render with `open=true`; assert Cancel closes dialog without mutation; assert Delete button calls mutation; assert inline error shown when mutation rejects with 409; assert `onDeleted` called on success

**Checkpoint**: User Story 1 complete and independently testable. Commit: `feat(admin): add election delete with confirmation dialog`

---

## Phase 4: User Story 3 — Election Source Indicator (Priority: P3)

**Goal**: Admins can distinguish SOS-feed elections from manually-created elections via a colored source badge on the admin list and detail pages. Badge is not shown on public pages.

**Independent Test**: Verify the admin elections list shows a colored "SOS Feed" or "Manual" badge in a Source column on each row. Navigate to an election detail page and verify the source badge appears in the header next to the status badge. Verify no badge appears on the public election detail page.

### Implementation

- [x] T015 [US3] Create `src/routes/admin/elections/_components/source-badge.tsx` — export `SourceBadge` component that renders a `Badge` with `bg-blue-100 text-blue-700 border-blue-200` for `"sos_feed"` (label "SOS Feed"), `bg-amber-100 text-amber-700 border-amber-200` for `"manual"` (label "Manual"), returns `null` for `null`/undefined (FR-016); then update `src/routes/admin/elections/_components/election-table.tsx` to import `SourceBadge` from `./source-badge` and add "Source" `TableHead` and `SourceBadge` `TableCell` to each row (note: modifies same file as T009 — apply after T009 is complete)
- [x] T016 [P] [US3] Update `src/routes/admin/elections/$electionId.tsx` — import `SourceBadge` from `./_components/source-badge` and add it to the header section, rendered next to the existing status `Badge` on the `flex items-center gap-3` line (note: modifies same file as T011 — apply after T011 is complete)

### Unit Tests for User Story 3

- [x] T017 [P] [US3] Create `tests/routes/admin/elections/_components/election-table.test.tsx` — render `ElectionTable` with elections having `source: "sos_feed"`, `source: "manual"`, and `source: null`; assert correct badge text and CSS classes; assert no delete button when `isAdmin=false`; assert delete button visible when `isAdmin=true`
- [x] T017b [P] [US1+US3] Create `tests/routes/admin/elections/$electionId.test.tsx` — render detail page with `isAdmin=true`: assert delete button visible and opens `DeleteElectionDialog`; assert `onDeleted` navigates to `/admin/elections`; render with `isAdmin=false`: assert no delete button; render election with `source="sos_feed"`: assert `SourceBadge` shows "SOS Feed"; render with `source="manual"`: assert badge shows "Manual"; render with `source=null`: assert no badge (FR-016) — **⚠️ Write after T011 (US1) AND T016 (US3) are both complete**

**Checkpoint**: User Story 3 complete and independently testable. Commit: `feat(admin): add election source badge to list and detail pages`

---

## Phase 5: User Story 2 — Create a Local Election with District Boundary (Priority: P2)

**Goal**: The election creation form replaces the district plain-text input with a searchable boundary selector combobox. Administrators can filter by boundary type and search by name/identifier. Selecting a boundary auto-populates the district field. Submitting with a boundary includes `boundary_id` in the API request.

**Independent Test**: Navigate to `/admin/elections/create`. Verify the district field is now a Combobox (not a plain Input). Select a boundary type, type a partial name, pick a boundary — verify the district field below auto-populates. Clear the selection and verify the district field becomes a plain text input. Submit the form without a boundary and verify it succeeds. Submit with a boundary and verify `boundary_id` appears in the outgoing request.

### Sub-Phase A: Boundaries API & Hooks

- [x] T018 [P] [US2] Create `src/lib/api/boundaries.ts` — `getBoundaries(params?: { type?: string; search?: string; county?: string; page?: number; page_size?: number }): Promise<BoundaryListResponse>` using `api.get("boundaries", { searchParams })` and `getBoundaryTypes(): Promise<BoundaryTypesResponse>` using `api.get("boundaries/types")`
- [x] T019 [US2] Create `src/lib/hooks/use-boundaries.ts` — export `useBoundaries({ type, search, page_size? })` TanStack Query hook (enabled when `!!type || (search?.length ?? 0) >= 2`, staleTime 60s, error handling with toast on auth errors); export `useBoundaryTypes()` hook (staleTime 5min, returns `data?.types ?? []`) (depends on T018)
- [x] T020 [P] [US2] Create `tests/lib/hooks/use-boundaries.test.ts` — mock `getBoundaries` and `getBoundaryTypes`; test `useBoundaries` is disabled when no type and search < 2 chars; test it fetches when type is set; test `useBoundaryTypes` returns types array; test error toast on auth failure

### Sub-Phase B: Boundary Selector Component

- [x] T021 [US2] Create `src/routes/admin/elections/_components/boundary-selector.tsx` — accepts `value: string | null` (selected boundary_id), `district: string` (current district text), `onChange: (boundaryId: string | null, districtName: string) => void`; renders: (1) `Select` for boundary type populated from `useBoundaryTypes()`; (2) `Popover` + `Command` combobox with search Input debounced 300ms, `CommandList` showing `useBoundaries({ type, search })` results formatted as `"{boundary_type} — {boundary_identifier}{county ? ` ({county})` : ""}`; (3) when boundary selected: show selected name + X clear button; (4) when no boundary selected and type filter cleared: show plain text `Input` for manual district entry (depends on T019, T001, T002)
- [x] T022 [P] [US2] Create `tests/routes/admin/elections/_components/boundary-selector.test.tsx` — render with no selection: assert type Select and manual text Input visible; select a type: assert boundaries loaded in combobox; pick a boundary: assert `onChange` called with correct id and name; click clear: assert `onChange(null, "")` called; assert debounce on search input

### Sub-Phase C: Form Integration

- [x] T023 [US2] Update `src/routes/admin/elections/_components/election-form.tsx` — add `enableBoundarySelector?: boolean` prop (default `true`); when `enableBoundarySelector` is true, replace the `district` `FormField` with `BoundarySelector` + a hidden/read-only district display; when `enableBoundarySelector` is false, keep the existing plain `Input`; wire `BoundarySelector.onChange` to `form.setValue("boundary_id", id ?? undefined)` and `form.setValue("district", name)` (depends on T021)
- [x] T024 [US2] Update `src/routes/admin/elections/create.tsx` — ensure the `onSubmit` handler passes `boundary_id` from `ElectionFormValues` to `CreateElectionRequest`; confirm `enableBoundarySelector` prop is not passed (defaults to `true`)
- [x] T025 [US2] Update `src/routes/admin/elections/$electionId.tsx` — pass `enableBoundarySelector={false}` to `<ElectionForm>` on the edit page (district field stays plain text when editing an existing election)
- [x] T026 [P] [US2] Update `tests/routes/admin/elections/_components/election-form.test.tsx` (create if not exists) — render with `enableBoundarySelector=true`: assert `BoundarySelector` renders; render with `enableBoundarySelector=false`: assert plain district `Input` renders; test form submission includes `boundary_id` when boundary is selected; test submission succeeds when `boundary_id` is omitted (optional field)

**Checkpoint**: User Story 2 complete and independently testable. Commit: `feat(admin): add boundary selector to election creation form`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification, cleanup, and final quality gate.

- [x] T027 [P] Run TypeScript typecheck: `npm run build` — resolve any type errors introduced by schema/type changes
- [x] T028 [P] Run ESLint: `npm run lint` — fix any lint warnings in new/modified files
- [x] T029 Run unit tests with coverage: `npm test -- --run --coverage` — verify ≥95% coverage on new files (`boundary-selector.tsx`, `delete-election-dialog.tsx`, `use-boundaries.ts`)
- [x] T030 Visual verification via Playwright MCP — start dev server (`npm run dev`), navigate to `http://localhost:5173/admin/elections`, take screenshot to `screenshots/010-elections-list.png`; navigate to `/admin/elections/create`, take screenshot to `screenshots/010-elections-create.png`; verify delete button visible (admin), source badge rendered, boundary selector shown in create form

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — install shadcn components immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion; **BLOCKS all user story phases**
- **US1 Delete (Phase 3)**: Depends on Phase 2; fully independent of US2 and US3
- **US3 Source Badge (Phase 4)**: Depends on Phase 2; modifies same files as US1 — sequence after US1
- **US2 Boundary Selector (Phase 5)**: Depends on Phase 2 (and Phase 1 for Popover/Command); independent of US1 and US3
- **Polish (Phase 6)**: Depends on all desired user story phases complete

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2 — no dependencies on US2 or US3
- **US3 (P3)**: Starts after Phase 2 — **sequence after US1** since T015 modifies `election-table.tsx` (also modified by T009) and T016 modifies `$electionId.tsx` (also modified by T011)
- **US2 (P2)**: Starts after Phase 1 + Phase 2 — fully independent; can proceed in parallel with US1/US3

### Within Each User Story

- API function before hook (T006 → T007, T018 → T019)
- Hook before component (T007 → T008, T019 → T021)
- Component before page integration (T008 → T009 → T010/T011, T021 → T023)
- Unit tests can be written in parallel with implementation (marked [P])

### Parallel Opportunities

Within US1:
```
T006 (api fn) → T007 (hook) → T008 (dialog component) → T009 (table) → T010, T011
                                                          T012 [P], T013 [P], T014 [P] (tests — run while implementing T009–T011)
```

Within US2:
```
T018 [P] (api) → T019 (hooks) ─┐
T020 [P] (hook tests)           ├→ T021 (BoundarySelector) → T023 (form) → T024, T025
                                     T022 [P] (component tests)              T026 [P] (form tests)
```

Within US3:
```
T015 (table badge) ─┐
T016 [P] (detail page badge) ─┤→ T017 [P] (table tests)
```

---

## Parallel Example: User Story 1

```bash
# Step 1 — API layer (sequential):
Task: "Add deleteElection() to src/lib/api/elections.ts" (T006)
Task: "Add useDeleteElection() to src/lib/hooks/use-admin-elections.ts" (T007)

# Step 2 — Component (sequential, after step 1):
Task: "Create src/routes/admin/elections/_components/delete-election-dialog.tsx" (T008)

# Step 3 — Page integration + tests in parallel:
Task: "Update election-table.tsx with isAdmin prop + delete button" (T009)
Task: "Add deleteElection tests to tests/lib/api/elections.test.ts" (T012) [P]
Task: "Add useDeleteElection tests to tests/lib/hooks/use-admin-elections.test.tsx" (T013) [P]
Task: "Create delete-election-dialog.test.tsx" (T014) [P]

# Step 4 — Remaining page integrations:
Task: "Update index.tsx with useUserRole + isAdmin" (T010)
Task: "Update $electionId.tsx with delete button + dialog" (T011)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Install shadcn components
2. Complete Phase 2: Type/schema foundation
3. Complete Phase 3: User Story 1 (delete)
4. **STOP and VALIDATE**: Test delete flow end-to-end in dev
5. Commit and optionally demo

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ready
2. Phase 3 (US1) → Delete working → Demo MVP
3. Phase 4 (US3) → Source badges → Demo
4. Phase 5 (US2) → Boundary selector → Demo
5. Phase 6 → Polish + verify + commit all

### Parallel Team Strategy

With two developers after Phase 2:
- **Developer A**: Phase 3 (US1 Delete) → Phase 4 (US3 Source Badge)
- **Developer B**: Phase 5 (US2 Boundary Selector, sub-phases A+B+C)

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in the same phase
- US3 (Phase 4) is sequenced AFTER US1 (Phase 3) even though lower priority — both touch the same files
- The `election-form.tsx` edit mode uses `enableBoundarySelector={false}` to keep plain text district field on edit (spec focuses creation form only)
- If `DELETE /elections/{id}` backend endpoint is not yet available, T006–T014 can be implemented against a mocked API response and the UI will be ready when the backend ships
- If `?search=` boundary param is not yet in voter-api (voter-api#92), T021 will show all boundaries of the selected type (graceful degradation — the combobox Command input still filters client-side as a fallback)
- Always commit after each checkpoint (T014, T017, T026) using Conventional Commits format
