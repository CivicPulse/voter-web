# Implementation Plan: Admin API Access

**Branch**: `001-admin-api-access` | **Date**: 2026-02-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-admin-api-access/spec.md`

## Summary

Enable admin users to access and utilize admin-specific API endpoints through the UI. The feature provides role-based access to user management (list/create users) and data operations (import/export of voters and boundaries). The UI dynamically adapts to API-provided user roles, displays helpful empty states, validates files before upload (100MB limit, type checking), and provides job monitoring with auto-polling for active imports/exports.

**Technical Approach**: Extend the existing React SPA with new admin routes under a dedicated "Admin" navigation section. Leverage TanStack Router for navigation, TanStack Query for data fetching with polling, React Hook Form + Zod for user creation forms, and existing `ky` HTTP client for authenticated API calls. Implement role-based UI rendering by fetching user role from JWT/API and conditionally displaying admin navigation and features.

## Technical Context

**Language/Version**: TypeScript 5.8+ (strict mode), React 19.2+
**Primary Dependencies**:
- React 19.2, React DOM 19.2
- Vite 7 (build tool, dev server)
- TanStack Router 1.159+ (file-based routing)
- TanStack Query 5.90+ (data fetching, polling, caching)
- React Hook Form 7.71+ (form state management)
- Zod 4.3+ (schema validation)
- `ky` 1.14+ (HTTP client with JWT bearer token)
- Zustand 5.0+ (client state for auth tokens, user role)
- shadcn/ui components (Button, Dialog, Table, Form, etc.)
- Tailwind CSS v4 (styling)
- Lucide React (icons)

**Storage**:
- Client-side: localStorage for JWT tokens (`access_token`)
- Server-side: voter-api PostgreSQL database (managed by backend)

**Testing**:
- Framework: To be established (Vitest + React Testing Library recommended)
- Target: 95% unit test coverage per constitution
- UI Verification: Playwright MCP tools for visual verification
- Manual: Dev server testing before PR

**Target Platform**: Modern web browsers (ES2020+), deployed as static SPA on Cloudflare Pages

**Project Type**: Web application (frontend SPA)

**Performance Goals**:
- Admin feature access within 2 clicks (SC-001)
- UI responsiveness: <1 second for permission checks, file validation (SC-003, SC-010)
- Job status updates within 3-5 seconds via polling (SC-007)
- Form submission feedback within 2-3 seconds (SC-005, SC-008)

**Constraints**:
- 100MB max file upload size (client-side validation)
- Auto-polling limited to 3-5 second intervals for active jobs
- No WebSocket - use HTTP polling for job status
- JWT authentication required for all admin API calls
- Role enforcement on backend (UI role display for UX only)

**Scale/Scope**:
- Users: ~10-50 admin/analyst users initially
- Data: Voter imports (county-level, typically 10-50MB CSV), boundary files (GeoJSON/shapefile <100MB)
- UI: 3 main admin pages (User Management, Imports, Exports) + navigation
- Components: ~15-20 new React components (pages, forms, tables, dialogs, empty states)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**✅ I. Branch-Based Development (Non-Negotiable)**
- Status: **PASS** - Feature branch `001-admin-api-access` created from `main` before work started
- Evidence: Branch exists, spec and planning done on feature branch

**✅ II. Pull Request Review (Required)**
- Status: **PASS** - Will be merged via PR after implementation complete
- Plan: All code will go through PR review before merge to `main`

**⏳ III. Test Coverage Standard (95% Unit Test Coverage)**
- Status: **PENDING** - No code written yet
- Plan: All components, hooks, forms, and utility functions will have unit tests
- Strategy:
  - Component tests: User interactions, conditional rendering based on role, empty states
  - Hook tests: Role fetching, polling logic, file validation
  - Form tests: User creation form validation, confirmation dialogs
  - Integration tests: Navigation flow, API calls with mocked responses
- Expected coverage: 95%+ on all new admin code

**✅ IV. Code Quality & Maintainability**
- Status: **PASS** - Plan follows all project conventions
- Evidence:
  - Uses `@/` path alias for imports
  - TypeScript strict mode
  - Follows TanStack Router (file-based routes in `src/routes/`)
  - Follows TanStack Query for data fetching
  - Leverages shadcn/ui components
  - No over-engineering: focused on spec requirements only

**Additional Checks:**

**✅ Technology Constraints**
- React 19 + TypeScript + Vite 7: **PASS** - Using exact stack
- Node.js LTS (via `.nvmrc`): **PASS** - No change
- npm package management: **PASS** - No change
- Tailwind CSS v4 utility-first: **PASS** - Using existing Tailwind setup
- shadcn/ui components: **PASS** - Will use existing + add new as needed

**✅ Conventional Commits**
- Commits will use format: `feat(admin): <description>`
- PR title will use same format

**GATE RESULT: ✅ PASS** - All non-negotiable principles satisfied. No constitution violations. Proceed to Phase 0.

## Complexity Tracking

> No constitution violations requiring justification.

This feature adds necessary admin functionality using established patterns (TanStack Router routes, TanStack Query hooks, React Hook Form). No complexity beyond what's required for the spec.

## Project Structure

### Documentation (this feature)

```text
specs/001-admin-api-access/
├── spec.md               # Feature specification (complete)
├── plan.md               # This file (/speckit.plan output)
├── research.md           # Phase 0 output (to be generated)
├── data-model.md         # Phase 1 output (to be generated)
├── quickstart.md         # Phase 1 output (to be generated)
├── contracts/            # Phase 1 output (to be generated)
│   └── admin-api.d.ts    # TypeScript types for admin API endpoints
└── tasks.md              # Phase 2 output (/speckit.tasks - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── routes/
│   ├── admin/                    # NEW: Admin section routes
│   │   ├── index.tsx             # Admin dashboard/landing page
│   │   ├── users/
│   │   │   ├── index.tsx         # User list page
│   │   │   └── create.tsx        # User creation page
│   │   ├── imports/
│   │   │   ├── index.tsx         # Imports list page
│   │   │   └── _components/
│   │   │       ├── import-upload-dialog.tsx
│   │   │       ├── import-job-table.tsx
│   │   │       └── import-retry-dialog.tsx
│   │   └── exports/
│   │       ├── index.tsx         # Exports list page
│   │       └── _components/
│   │           ├── export-request-dialog.tsx
│   │           └── export-job-table.tsx
│   └── __root.tsx                # MODIFY: Add admin nav item (conditional)
│
├── components/
│   └── ui/                       # Existing shadcn/ui components
│       └── (add as needed: data-table, dialog, form, etc.)
│
├── lib/
│   ├── api/
│   │   ├── client.ts             # EXISTING: ky HTTP client with JWT
│   │   └── admin.ts              # NEW: Admin API calls (users, imports, exports)
│   ├── hooks/
│   │   ├── use-user-role.ts      # NEW: Fetch and cache user role
│   │   ├── use-admin-users.ts    # NEW: TanStack Query hook for users
│   │   ├── use-import-jobs.ts    # NEW: TanStack Query hook for imports (with polling)
│   │   └── use-export-jobs.ts    # NEW: TanStack Query hook for exports (with polling)
│   ├── stores/
│   │   └── auth-store.ts         # MODIFY: Add user role to Zustand store
│   ├── schemas/
│   │   └── user-form.ts          # NEW: Zod schema for user creation form
│   └── utils/
│       └── file-validation.ts    # NEW: Client-side file type/size validation
│
└── types/
    └── admin.ts                  # NEW: TypeScript types for admin entities
```

**Structure Decision**: Single web application (frontend SPA). Backend is separate voter-api repo. This feature adds new routes under `src/routes/admin/` following TanStack Router file-based conventions, new API client functions in `src/lib/api/admin.ts`, and new hooks in `src/lib/hooks/` for data fetching with polling.

## Phase 0: Research & Decisions

**Status**: ✅ **COMPLETE** (research.md generated 2026-02-14)

### Research Tasks

1. **TanStack Query polling patterns**
   - How to implement 3-5 second polling for active jobs
   - How to stop polling when jobs reach terminal states
   - How to handle polling failures gracefully

2. **File upload with validation**
   - Best practices for client-side file type validation (CSV, GeoJSON, shapefile)
   - How to validate file size before upload (100MB limit)
   - How to integrate with React Hook Form for upload flows

3. **Role-based UI rendering**
   - How to fetch user role from JWT token or API
   - Where to store role (Zustand store vs. TanStack Query cache)
   - How to conditionally render navigation based on role

4. **Confirmation dialog patterns**
   - shadcn/ui Dialog component usage
   - How to chain: file select → confirmation → upload
   - How to show file details in confirmation dialog

5. **Empty state patterns**
   - Component structure for helpful empty states
   - How to show empty state vs. data table conditionally
   - Action button integration in empty states

6. **Job list table patterns**
   - TanStack Table for job lists
   - How to show job states (pending, processing, completed, failed)
   - How to integrate retry/download action buttons in table rows

### ✅ Unknowns Resolved (research.md completed 2026-02-14)

- **User role provided by API**: Via `GET /api/v1/auth/me` endpoint
  - Returns `UserResponse` with role field (admin/analyst/viewer)
  - Requires OAuth2 Bearer token authentication
  - Implementation: Fetch on app mount, cache in Zustand store

- **Import/export endpoints confirmed**: All required endpoints exist in voter-api
  - Imports: `GET /api/v1/imports`, `POST /api/v1/imports/voters`, `POST /api/v1/imports/boundaries`, `GET /api/v1/imports/{job_id}`
  - Exports: `GET /api/v1/exports`, `POST /api/v1/exports`, `GET /api/v1/exports/{job_id}`, `GET /api/v1/exports/{job_id}/download`
  - All POST endpoints return 202 Accepted with async job response

- **Import retry mechanism**: NO API retry endpoint exists
  - Failed imports cannot be updated/retried via PATCH/PUT
  - Retry implementation: Create new import job with corrected file (same as initial upload)
  - Old failed job remains in history for audit trail

## Phase 1: Design & Contracts

**Status**: To be generated in `data-model.md` and `contracts/`

### Data Model (Preview)

**Entities** (from spec):
- Admin User
- Admin Operation
- Import Job
- Export Job
- Permission Error

**To be detailed in `data-model.md`**:
- TypeScript types for each entity
- API request/response types
- Form validation schemas
- Job state transitions

### API Contracts (Preview)

**To be generated in `contracts/admin-api.d.ts`**:

```typescript
// User Management
GET    /api/v1/users              → UserListResponse
POST   /api/v1/users              → UserCreateResponse

// Import Operations
GET    /api/v1/imports            → ImportJobListResponse
POST   /api/v1/imports/voters     → ImportJobResponse
POST   /api/v1/imports/boundaries → ImportJobResponse
GET    /api/v1/imports/{job_id}   → ImportJobDetailResponse

// Export Operations
GET    /api/v1/exports            → ExportJobListResponse
POST   /api/v1/exports            → ExportJobResponse
GET    /api/v1/exports/{job_id}   → ExportJobDetailResponse
GET    /api/v1/exports/{job_id}/download → FileDownload
```

### Quickstart Guide (Preview)

**To be generated in `quickstart.md`**:
- How to add admin navigation
- How to create a new admin route
- How to use role-based rendering hooks
- How to implement file upload with validation
- How to use polling hooks for job status

## Next Steps

1. **Execute `/speckit.plan` Phase 0**: Generate `research.md` by researching TanStack Query polling, file upload patterns, role-based rendering, etc.

2. **Execute `/speckit.plan` Phase 1**: Generate `data-model.md` and `contracts/admin-api.d.ts` after research complete

3. **Update agent context**: Run `.specify/scripts/bash/update-agent-context.sh claude` to add admin feature context

4. **Execute `/speckit.tasks`**: Generate actionable task breakdown after planning complete

5. **Implementation**: Begin coding following task breakdown, commit incrementally per constitution

---

**Plan Status**: ✅ Ready for Phase 0 (Research)
