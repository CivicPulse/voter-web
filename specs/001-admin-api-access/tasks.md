---
description: "Task breakdown for Admin API Access feature implementation"
---

# Tasks: Admin API Access

**Input**: Design documents from `/specs/001-admin-api-access/`
**Prerequisites**: plan.md (complete), spec.md (complete), types/admin.ts (complete)

**Tests**: All test tasks are MANDATORY per Constitution Principle III (95% test coverage required). Testing framework setup (Phase 0) MUST be complete before feature implementation begins. Use Vitest + React Testing Library for all tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

All paths relative to repository root (`/home/kwhatcher/projects/civicpulse/voter-web/`):
- `src/` - source code
- `src/routes/` - TanStack Router file-based routes
- `src/components/ui/` - shadcn/ui components
- `src/lib/` - utilities, hooks, API clients

---

## Phase 0: Testing Infrastructure Setup

**Purpose**: Establish testing framework to satisfy Constitution Principle III (95% test coverage requirement)

**⚠️ BLOCKING**: Must complete before any feature implementation begins

- [X] T000 [P] Install Vitest and React Testing Library: `npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
- [X] T000a [P] Create Vitest config file `vitest.config.ts` with React and jsdom setup
- [X] T000b [P] Create test utilities file `src/test/setup.ts` with RTL configuration and global test helpers
- [X] T000c Add test scripts to package.json: `"test": "vitest"`, `"test:ui": "vitest --ui"`, `"test:coverage": "vitest --coverage"`
- [X] T000d [P] Install coverage reporter: `npm install -D @vitest/coverage-v8`
- [X] T000e Verify setup by creating sample test: `src/lib/utils/__tests__/cn.test.ts` testing the `cn()` utility function
- [X] T000f Run `npm test` to verify test framework works, run `npm run test:coverage` to verify coverage reporting

**Checkpoint**: Testing framework ready - 95% coverage requirement can now be enforced

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add required shadcn/ui components and project dependencies

- [X] T001 [P] Add shadcn/ui dialog component: `npx shadcn@latest add dialog`
- [X] T002 [P] Add shadcn/ui badge component: `npx shadcn@latest add badge`
- [X] T003 [P] Add shadcn/ui table component: `npx shadcn@latest add table` (data-table is a pattern built on table)
- [X] T004 [P] Add shadcn/ui navigation-menu component: `npx shadcn@latest add navigation-menu`
- [X] T005 [P] Add shadcn/ui form component: `npx shadcn@latest add form`
- [X] T006 [P] Add shadcn/ui alert component: `npx shadcn@latest add alert`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 [P] Create empty state component in `src/components/ui/empty-state.tsx` with title, description, icon, and action button support
- [X] T008 [P] Create file validation utility in `src/lib/utils/file-validation.ts` with functions for type checking (CSV, GeoJSON, ZIP) and size validation (100MB limit). ZIP validation should verify the archive contains at least one .shp file for shapefile boundary imports
- [X] T009 Extend Zustand auth store in `src/stores/authStore.ts` to include `userRole: UserRole | null` field and `setUserRole(role: UserRole | null)` action
- [X] T010 Create admin API client in `src/lib/api/admin.ts` with base functions: `getUsers()`, `createUser()`, `getImportJobs()`, `createVoterImport()`, `createBoundaryImport()`, `getImportJob(id)`, `getExportJobs()`, `createExport()`, `getExportJob(id)`
- [X] T011 Create `useUserRole` hook in `src/lib/hooks/use-user-role.ts` that fetches user role from API (or JWT) and stores in Zustand auth store
- [X] T012 Create base admin route layout in `src/routes/admin.tsx` with role check (redirect non-admins) and common layout structure

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Access Admin Dashboard (Priority: P1) 🎯 MVP

**Goal**: Enable admin users to see and access admin navigation section with User Management, Imports, and Exports menu items. Non-admin users should not see admin navigation.

**Independent Test**: Log in as admin user → verify "Admin" section appears in navigation with 3 submenu items → click each item → verify pages load without errors. Log in as non-admin → verify no "Admin" section.

### Tests for User Story 1 (MANDATORY per Constitution) ✅

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T013 [P] [US1] Unit test for `useUserRole` hook in `src/lib/hooks/__tests__/use-user-role.test.ts` - verify role fetching and store updates
- [ ] T014 [P] [US1] Component test for admin navigation in `src/components/__tests__/admin-nav.test.tsx` - verify conditional rendering based on role

### Implementation for User Story 1

- [X] T015 [US1] Modify root route in `src/routes/__root.tsx` to conditionally render "Admin" navigation item based on `useUserRole()` hook (show only if role === 'admin' or 'analyst')
- [X] T016 [US1] Create admin navigation submenu component in `src/components/admin-nav-menu.tsx` with items: User Management, Imports, Exports (using shadcn/ui navigation-menu)
- [X] T017 [US1] Create admin index route in `src/routes/admin/index.tsx` as landing page with overview cards linking to User Management, Imports, Exports
- [X] T018 [US1] Create user management index route in `src/routes/admin/users/index.tsx` (empty placeholder for now, will be populated in US2)
- [X] T019 [US1] Create imports index route in `src/routes/admin/imports/index.tsx` (empty placeholder for now, will be populated in US2)
- [X] T020 [US1] Create exports index route in `src/routes/admin/exports/index.tsx` (empty placeholder for now, will be populated in US2)
- [X] T021 [US1] Add access control guard in admin layout (`src/routes/admin.tsx`) that checks `useUserRole()` and shows access denied message or redirects to home if user is not admin/analyst
- [ ] T022 [US1] UI verification: Start dev server, log in as admin, verify admin nav appears, click through all 3 submenu items using Playwright MCP tools (`browser_navigate`, `browser_snapshot`, `browser_take_screenshot`)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently - admin users can navigate to all admin pages

---

## Phase 4: User Story 2 - Perform Admin Operations (Priority: P2)

**Goal**: Enable admin users to (1) list users and create new users with role assignments, and (2) trigger/monitor voter imports, boundary imports, and data exports with helpful empty states, file validation, and auto-polling.

**Independent Test**:
1. User Management: Navigate to user management page → verify empty state if no users → create new user with elevated role → verify confirmation dialog → confirm → verify user appears in list
2. Imports: Navigate to imports page → verify empty state → upload CSV voter file → verify confirmation → confirm → verify job appears and status updates automatically
3. Exports: Navigate to exports page → verify empty state → request export → verify job appears → verify download button when complete

### Tests for User Story 2 (MANDATORY per Constitution) ✅

- [ ] T023 [P] [US2] Unit test for file validation in `src/lib/utils/__tests__/file-validation.test.ts` - verify CSV, GeoJSON, ZIP type validation and 100MB size limit
- [ ] T024 [P] [US2] Unit test for user form schema in `src/lib/schemas/__tests__/user-form.test.ts` - verify Zod validation rules (username, email, password, confirmPassword match)
- [ ] T025 [P] [US2] Hook test for `useAdminUsers` in `src/lib/hooks/__tests__/use-admin-users.test.ts` - verify TanStack Query caching and error handling
- [ ] T026 [P] [US2] Hook test for `useImportJobs` in `src/lib/hooks/__tests__/use-import-jobs.test.ts` - verify polling starts/stops based on job states
- [ ] T027 [P] [US2] Component test for user creation form in `src/routes/admin/users/__tests__/create.test.tsx` - verify form validation and confirmation dialog flow

### Implementation for User Story 2

#### User Management (US2.1)

- [X] T028 [P] [US2] Create Zod schema for user creation form in `src/lib/schemas/user-form.ts` with fields: username, email, password, confirmPassword (must match), role, is_active
- [X] T029 [P] [US2] Create `useAdminUsers` hook in `src/lib/hooks/use-admin-users.ts` using TanStack Query to fetch user list (GET /api/v1/users) and create user (POST /api/v1/users)
- [X] T030 [US2] Implement user list page in `src/routes/admin/users/index.tsx` with empty state component OR data table showing all users (id, username, email, role, is_active, created_at, last_login_at)
- [X] T031 [US2] Create user creation page in `src/routes/admin/users/create.tsx` with React Hook Form + Zod validation, form fields (username, email, password, confirmPassword, role select, is_active checkbox)
- [X] T032 [US2] Add confirmation dialog to user creation form (triggered before submit if role is 'admin' or 'analyst') showing "Creating user with elevated role: [role]. Continue?" with Cancel/Confirm buttons
- [X] T033 [US2] Wire up user creation form submission to `useCreateUser()` mutation, redirect to user list page on success

#### Import Operations (US2.2)

- [X] T034 [P] [US2] Create `useImportJobs` hook in `src/lib/hooks/use-import-jobs.ts` using TanStack Query with polling (refetchInterval: 3000ms when any job is active, disable when all terminal)
- [X] T035 [P] [US2] Create import job table component in `src/routes/admin/imports/_components/import-job-table.tsx` with columns: job ID, filename, import_type, status (badge with color), start time, completion/error time, error message, actions (retry button if failed)
- [X] T036 [US2] Create import upload dialog component in `src/routes/admin/imports/_components/import-upload-dialog.tsx` with file input, type selection (voter/boundary), file validation on change, confirmation step showing file details
- [X] T037 [US2] Create import retry dialog component in `src/routes/admin/imports/_components/import-retry-dialog.tsx` - pre-populates type from failed job, allows new file upload
- [X] T038 [US2] Implement imports list page in `src/routes/admin/imports/index.tsx` with empty state OR import job table with auto-polling via `useImportJobs` hook
- [X] T039 [US2] Wire up import upload dialog to call `createVoterImport()` or `createBoundaryImport()` based on type, close dialog, trigger refetch of job list
- [X] T040 [US2] Wire up retry dialog to create new import job with corrected file (same flow as upload)

#### Export Operations (US2.3)

- [X] T041 [P] [US2] Create `useExportJobs` hook in `src/lib/hooks/use-export-jobs.ts` using TanStack Query with polling (refetchInterval: 3000ms when any job is active, disable when all terminal)
- [X] T042 [P] [US2] Create export job table component in `src/routes/admin/exports/_components/export-job-table.tsx` with columns: job ID, export_type, status (badge with color), start time, completion/error time, error message, actions (download button if completed)
- [X] T043 [US2] Create export request dialog component in `src/routes/admin/exports/_components/export-request-dialog.tsx` with export type selection (voters/boundaries/full_database), Create Export button
- [X] T044 [US2] Implement exports list page in `src/routes/admin/exports/index.tsx` with empty state OR export job table with auto-polling via `useExportJobs` hook
- [X] T045 [US2] Wire up export request dialog to call `createExport()`, close dialog, trigger refetch of job list
- [X] T046 [US2] Wire up download button in export job table to fetch download URL from completed export job and trigger browser download

#### Cross-Feature Integration

- [ ] T047 [US2] Add access control check to all admin pages (user management, imports, exports) - if user attempts direct URL access without admin role, redirect to home or show access denied message
- [ ] T048 [US2] UI verification: Test user management flow (empty state → create user with elevated role → confirm → verify in list) using Playwright MCP tools
- [ ] T049 [US2] UI verification: Test import flow (empty state → upload CSV → confirm → verify job appears → verify polling updates status) using Playwright MCP tools
- [ ] T050 [US2] UI verification: Test export flow (empty state → request export → verify job appears → verify download button when complete) using Playwright MCP tools

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - full admin CRUD operations functional

---

## Phase 5: User Story 3 - Handle Permission Errors Gracefully (Priority: P3)

**Goal**: Provide clear, actionable error messages when sessions expire or roles change, and gracefully redirect users to login or home page as appropriate.

**Independent Test**: Simulate session expiration (delete access_token from localStorage) → attempt admin operation → verify clear error message and login prompt. Simulate role change (update JWT role claim) → verify admin UI elements disappear and access denied shown.

### Tests for User Story 3 (MANDATORY per Constitution) ✅

- [ ] T051 [P] [US3] Integration test for session expiration in `src/lib/api/__tests__/admin.test.ts` - verify 401 error handling and token refresh or redirect
- [ ] T052 [P] [US3] Component test for permission error display in `src/components/__tests__/permission-error.test.tsx` - verify error message rendering and action buttons

### Implementation for User Story 3

- [ ] T053 [P] [US3] Create permission error component in `src/components/permission-error.tsx` that displays clear error message based on error type (session expired → "Your session has expired. Please log in again", permission denied → "You don't have permission to access this feature")
- [ ] T054 [US3] Add error interceptor to admin API client in `src/lib/api/admin.ts` to detect 401 (unauthorized) and 403 (permission denied) responses and throw structured errors (`AuthenticationError`, `PermissionError` from `src/types/admin.ts`)
- [ ] T055 [US3] Update `useUserRole` hook in `src/lib/hooks/use-user-role.ts` to clear role and redirect to login on 401 errors, clear role and hide admin UI on 403 errors
- [ ] T056 [US3] Update admin route layout in `src/routes/admin.tsx` to catch permission errors and display permission error component with appropriate action buttons (Login / Go Home)
- [ ] T057 [US3] Add error boundaries to all admin pages (user management, imports, exports) to catch and display permission errors gracefully without crashing the app
- [ ] T058 [US3] Handle role change detection: if `useUserRole` hook detects role changed from admin/analyst to viewer, hide admin nav items and redirect away from admin pages
- [ ] T059 [US3] Update all admin hooks (`useAdminUsers`, `useImportJobs`, `useExportJobs`) to handle 401/403 errors and show user-friendly error messages via toast notifications
- [ ] T059a [US3] Add network error handling to polling hooks (`useImportJobs`, `useExportJobs`) - when polling fails due to network errors (timeout, connection refused, etc.), show non-intrusive toast notification, continue displaying last known job status, and automatically retry on next polling interval without disrupting user experience
- [ ] T060 [US3] UI verification: Simulate session expiration (clear localStorage token) → attempt admin operation → verify error message and login prompt using Playwright MCP tools
- [ ] T061 [US3] UI verification: Simulate permission denied (mock 403 response) → verify error message and admin UI hidden using Playwright MCP tools
- [ ] T061a [US3] UI verification: Simulate network error during polling (disconnect network or throttle to force timeout) → verify toast notification appears, last job status remains visible, and polling resumes when network recovers using Playwright MCP tools

**Checkpoint**: All user stories should now be independently functional with robust error handling

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, documentation, and final validation

- [ ] T062 [P] Add loading skeletons to user list, import list, export list pages (show while data is loading)
- [ ] T063 [P] Add optimistic updates to user creation and job creation (show in UI immediately, rollback on error)
- [ ] T064 Code cleanup: Remove console.logs, unused imports, and ensure all components follow consistent patterns
- [ ] T065 Performance optimization: Memoize expensive computations in job tables (progress calculations, date formatting)
- [ ] T066 Accessibility review: Verify all forms have proper labels, ARIA attributes, and keyboard navigation
- [ ] T067 [P] Update CLAUDE.md with admin feature documentation: routing conventions, polling patterns, role-based rendering examples
- [ ] T068 [P] Create internal developer documentation in `docs/admin-features.md` explaining admin API client, hooks usage, and polling patterns
- [ ] T069 Security review: Verify no sensitive data (passwords, tokens) logged or exposed in UI, confirm all admin endpoints use JWT auth
- [ ] T070 Final UI verification: Run full user journey test (login as admin → navigate all admin pages → create user → upload import → request export → verify polling → download export) using Playwright MCP tools
- [ ] T071 Run quickstart.md validation: Follow any quickstart guide generated in Phase 1 to ensure accuracy

---

## Dependencies & Execution Order

### Phase Dependencies

- **Testing Infrastructure (Phase 0)**: No dependencies - can start immediately, BLOCKS all other phases
- **Setup (Phase 1)**: Depends on Phase 0 completion - can start immediately after tests set up
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 navigation but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Enhances US1/US2 error handling but independently testable

### Within Each User Story

- Foundation tasks (hooks, API clients) before UI components
- Empty state components before data tables
- Form schemas before form components
- Dialogs before page integration
- Core implementation before UI verification
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**: All shadcn component additions (T001-T006) can run in parallel

**Phase 2 (Foundational)**:
- T007 (empty state), T008 (file validation) can run in parallel
- T010 (API client) and T011 (useUserRole hook) can run in parallel
- T009 (Zustand store) must complete before T011
- T012 (admin route layout) depends on T011

**Phase 3 (US1)**:
- T013, T014 (tests) can run in parallel if tests are written
- T015 (root route nav) and T016 (nav menu component) can run in parallel
- T018, T019, T020 (placeholder routes) can run in parallel after T017

**Phase 4 (US2)**:
- T023-T027 (all tests) can run in parallel if tests are written
- T028 (user schema) and T029 (user hook) can run in parallel
- T034 (import hook) and T041 (export hook) can run in parallel
- T035 (import table), T036 (import dialog), T037 (retry dialog) can run in parallel after T034
- T042 (export table) and T043 (export dialog) can run in parallel after T041

**Phase 5 (US3)**:
- T051, T052 (tests) can run in parallel if tests are written
- T053 (permission error component) and T054 (API error interceptor) can run in parallel

**Phase 6 (Polish)**:
- T062 (loading skeletons) and T063 (optimistic updates) can run in parallel
- T067 (CLAUDE.md) and T068 (developer docs) can run in parallel

---

## Parallel Example: User Story 2 (Imports)

```bash
# Launch all import components together after import hook is complete:
Task: "Create import job table component in src/routes/admin/imports/_components/import-job-table.tsx"
Task: "Create import upload dialog component in src/routes/admin/imports/_components/import-upload-dialog.tsx"
Task: "Create import retry dialog component in src/routes/admin/imports/_components/import-retry-dialog.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (add shadcn components)
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (admin navigation and route access)
4. **STOP and VALIDATE**: Test User Story 1 independently (verify admin nav, page access, role-based rendering)
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP - admin navigation!)
3. Add User Story 2 → Test independently → Deploy/Demo (admin operations!)
4. Add User Story 3 → Test independently → Deploy/Demo (error handling!)
5. Add Polish (Phase 6) → Final testing → Production deployment
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (navigation, routes)
   - Developer B: User Story 2.1 (user management)
   - Developer C: User Story 2.2 + 2.3 (imports + exports)
3. Developer D: User Story 3 (error handling) after US1/US2 integration
4. Stories complete and integrate independently

---

## Notes

- **[P] tasks** = different files, no dependencies, can run in parallel
- **[Story] label** maps task to specific user story for traceability
- **Each user story** should be independently completable and testable
- **Tests are MANDATORY** per Constitution Principle III (95% coverage required). Phase 0 (T000-T000f) establishes testing framework. All test tasks marked with ✅ are non-negotiable.
- **Verify with Playwright MCP** after UI changes per CLAUDE.md requirement
- **Commit after each task** or logical group per constitution
- **Stop at any checkpoint** to validate story independently
- **Avoid**: vague tasks, same file conflicts, cross-story dependencies that break independence
- **TanStack Router**: Use `createFileRoute()` for all route files, never edit `src/routeTree.gen.ts` manually
- **Path alias**: Always use `@/` imports (e.g., `@/components/ui/button`)
- **File validation**: Must happen on file select, before upload dialog confirmation step
- **Polling**: Only active when jobs are pending/processing, stop when all terminal
- **Role enforcement**: UI rendering only, all security enforced by API backend
