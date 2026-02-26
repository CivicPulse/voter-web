# Implementation Plan: Admin Election Management — Delete & Local Election Creation

**Branch**: `010-election-admin-mgmt` | **Date**: 2026-02-26 | **Spec**: `specs/010-election-admin-mgmt/spec.md`

## Summary

Add three admin capabilities to the election management panel: (1) delete elections with a two-step confirmation dialog (admin role only, inline error on backend rejection), (2) replace the district plain text input with a searchable boundary combobox that links elections to geographic district records, and (3) display a source badge on admin election list/detail views indicating whether each election originated from the SOS feed or was created manually.

## Technical Context

**Language/Version**: TypeScript 5.9+ (strict mode)
**Primary Dependencies**: React 19.2+, TanStack Router (file-based routing), TanStack Query (data fetching/mutation), shadcn/ui (Dialog, Badge, Select, Command/Popover), React Hook Form + Zod, Sonner (toasts), Lucide React (Trash2, X icons), ky (HTTP client)
**Storage**: N/A (frontend SPA — all data from voter-api backend at `/api/v1`)
**Testing**: Vitest + React Testing Library (unit, 95% coverage); Playwright (E2E)
**Target Platform**: Browser SPA (Vite 7, deployed to Cloudflare Pages)
**Project Type**: Single web application (React SPA)
**Performance Goals**: Boundary selector search responds within 1s (SC-004); debounce 300ms
**Constraints**: Admin-only delete (role guard); source badge admin-panel only; boundary field optional (FR-011)
**Scale/Scope**: Small feature; ~7 files new, ~8 files modified; 3 user stories across 2 issues

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Branch-Based Development | ✅ PASS | Branch `010-election-admin-mgmt` already created |
| II. Pull Request Review | ✅ PASS | Will be merged via PR against `main` |
| III. 95% Unit Test Coverage | ✅ PASS | New files + modified hooks require tests; plan includes test files |
| IV. Code Quality & Maintainability | ✅ PASS | Uses `@/` alias, strict TypeScript, established patterns (TanStack Query, RHF+Zod, shadcn) |

No violations. No complexity justification required.

## Project Structure

### Documentation (this feature)

```text
specs/010-election-admin-mgmt/
├── plan.md              ← this file
├── research.md          ← Phase 0 decisions
├── data-model.md        ← entities, types, new/modified interfaces
├── quickstart.md        ← implementation sequence and patterns
├── contracts/
│   ├── elections-delete.md           ← DELETE /elections/{id}
│   ├── elections-create-updated.md   ← POST /elections changes (boundary_id, source)
│   └── boundaries-search.md          ← GET /boundaries with search param
└── tasks.md             ← Phase 2 output (not yet created)
```

### Source Code (repository root)

```text
src/
├── types/
│   ├── elections.ts         ← add source?, boundary_id? to Election; boundary_id? to CreateElectionRequest
│   └── boundary.ts          ← add BoundaryListItem, BoundaryListResponse
├── lib/
│   ├── schemas/
│   │   └── election-form.ts ← relax data_source_url; add boundary_id?
│   ├── api/
│   │   ├── elections.ts     ← add deleteElection()
│   │   └── boundaries.ts    ← NEW: getBoundaries(), getBoundaryTypes()
│   └── hooks/
│       ├── use-admin-elections.ts  ← add useDeleteElection()
│       └── use-boundaries.ts      ← NEW: useBoundaries(), useBoundaryTypes()
└── routes/
    └── admin/
        └── elections/
            ├── index.tsx            ← fetch useUserRole(), pass isAdmin to table
            ├── $electionId.tsx      ← add delete button+dialog, source badge
            └── _components/
                ├── election-form.tsx          ← replace district with BoundarySelector
                ├── election-table.tsx         ← add Source column, delete button
                ├── boundary-selector.tsx      ← NEW: combobox + type filter
                └── delete-election-dialog.tsx ← NEW: confirmation dialog

tests/
└── lib/
    ├── api/
    │   └── elections.test.ts         ← add deleteElection test
    └── hooks/
        ├── use-admin-elections.test.ts  ← add useDeleteElection tests
        └── use-boundaries.test.ts       ← NEW
    (and component tests in tests/routes/admin/elections/_components/)
```

**Structure Decision**: Single project (React SPA). All new code lives under `src/`. The `_components/` underscore prefix convention prevents TanStack Router from treating these as routes.

## Complexity Tracking

No violations to justify.

## Phase 0: Research Summary

See `research.md` for full decision log. Key resolved questions:

- **Dialog pattern**: Use `Dialog` (not `AlertDialog`) — consistent with existing admin confirmation patterns
- **Delete error**: Show inline inside dialog (FR-007); 409 Conflict message displayed without closing dialog
- **Boundary selector**: `Popover` + `Command` combobox (shadcn pattern); type `Select` filter + 300ms debounced search
- **data_source_url**: Relaxed to optional in schema (manual elections have no SOS feed URL)
- **Role guard**: Check `useUserRole().data?.role === "admin"` at page level; pass `isAdmin` prop to table
- **Source badge**: Inline Tailwind classes (blue/amber); admin-panel only; graceful null handling
- **`/boundaries` search param**: Include in API call; backend support pending voter-api#92

## Phase 1: Design Summary

See `data-model.md` for full type/schema/component contracts.

### New Types
- `BoundaryListItem`, `BoundaryListResponse` in `src/types/boundary.ts`
- `source?: "sos_feed" | "manual" | null` on `Election`
- `boundary_id?: string` on `CreateElectionRequest`

### New API Functions
- `deleteElection(id)` → `DELETE /elections/{id}` → void (204)
- `getBoundaries(params?)` → `GET /boundaries` → `BoundaryListResponse`
- `getBoundaryTypes()` → `GET /boundaries/types` → `BoundaryTypesResponse`

### New Hooks
- `useDeleteElection()` — mutation with inline error propagation
- `useBoundaries(params?)` — enabled on type selection or ≥2-char search
- `useBoundaryTypes()` — static list for type filter

### New Components
- `DeleteElectionDialog` — Dialog with name, warning, inline error, Cancel/Delete buttons
- `BoundarySelector` — type Select filter + Command combobox; emits `(boundaryId, districtName)`

### Modified Components
- `ElectionTable` — new `isAdmin` prop; Source column; delete button per row
- `ElectionForm` — district field replaced with `BoundarySelector`
- `AdminElectionsPage` (`index.tsx`) — add role check
- `AdminElectionDetailPage` (`$electionId.tsx`) — source badge, delete button

## Implementation Order

1. **Types & schema** — foundation for all other changes (no tests needed here)
2. **Delete Election** — P1, fully independent; api function + hook + dialog + table + detail page
3. **Source Badge** — P3, independent; add to table + detail page
4. **Boundaries API & hooks** — P2 foundation; api module + hooks
5. **Boundary Selector** — P2 UI; component + form integration
6. **Tests** — unit tests for all new/modified logic; visual verification via Playwright MCP
