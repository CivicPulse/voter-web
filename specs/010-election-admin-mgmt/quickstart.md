# Quickstart: Admin Election Management (010)

**Feature Branch**: `010-election-admin-mgmt`

---

## What's Being Built

Three capabilities added to the admin elections panel:

1. **Delete elections** — Trash icon per row in ElectionTable (admin role only); confirmation dialog with inline error handling.
2. **Boundary selector** — Replace the district plain text input in ElectionForm with a searchable combobox that links elections to geographic boundary records.
3. **Source badge** — Visual indicator on admin election list and detail pages showing whether an election came from the SOS feed or was created manually.

---

## Dev Setup

```bash
# From voter-web project root
nvm use
npm install
cp .env.example .env   # set VITE_API_BASE_URL to your local voter-api
npm run dev            # starts on http://localhost:5173
```

Admin panel requires a logged-in user with `admin` or `analyst` role. Navigate to `/admin/elections`.

---

## New Files

| File | Purpose |
|------|---------|
| `src/lib/api/boundaries.ts` | `getBoundaries()`, `getBoundaryTypes()` API functions |
| `src/lib/hooks/use-boundaries.ts` | `useBoundaries()`, `useBoundaryTypes()` TanStack Query hooks |
| `src/routes/admin/elections/_components/boundary-selector.tsx` | Searchable combobox for district boundary selection |
| `src/routes/admin/elections/_components/delete-election-dialog.tsx` | Delete confirmation dialog with inline error display |
| `tests/lib/hooks/use-boundaries.test.ts` | Unit tests for boundary hooks |
| `tests/routes/admin/elections/_components/boundary-selector.test.tsx` | Unit tests for BoundarySelector |
| `tests/routes/admin/elections/_components/delete-election-dialog.test.tsx` | Unit tests for DeleteElectionDialog |

---

## Modified Files

| File | Change |
|------|--------|
| `src/types/elections.ts` | Add `source?`, `boundary_id?` to `Election`; add `boundary_id?` to `CreateElectionRequest`; make `data_source_url` optional in request |
| `src/types/boundary.ts` | Add `BoundaryListItem`, `BoundaryListResponse` interfaces |
| `src/lib/schemas/election-form.ts` | Relax `data_source_url` to optional; add `boundary_id?: z.string().uuid().optional()` |
| `src/lib/api/elections.ts` | Add `deleteElection(electionId)` function |
| `src/lib/hooks/use-admin-elections.ts` | Add `useDeleteElection()` mutation hook |
| `src/routes/admin/elections/_components/election-form.tsx` | Replace district text input with `BoundarySelector`; add boundary_id to form state |
| `src/routes/admin/elections/_components/election-table.tsx` | Add Source column; add delete button (admin only); accept `isAdmin` prop |
| `src/routes/admin/elections/index.tsx` | Fetch `useUserRole()`, pass `isAdmin` to table |
| `src/routes/admin/elections/$electionId.tsx` | Add delete button + dialog; add source badge in header |
| `tests/lib/hooks/use-admin-elections.test.tsx` | Add tests for `useDeleteElection` |
| `tests/lib/api/elections.test.ts` | Add test for `deleteElection` |

---

## Implementation Sequence

Implement in this order (each step is independently testable and committable):

### Step 1 — Types & Schema (foundation)
1. Add `source?`, `boundary_id?` to `Election` interface
2. Add `BoundaryListItem`, `BoundaryListResponse` to `src/types/boundary.ts`
3. Relax `data_source_url`, add `boundary_id?` to `createElectionSchema`
4. Add `boundary_id?` to `CreateElectionRequest`

### Step 2 — Delete Election (P1, independent)
1. Add `deleteElection()` to `src/lib/api/elections.ts`
2. Add `useDeleteElection()` to `src/lib/hooks/use-admin-elections.ts`
3. Create `delete-election-dialog.tsx` component
4. Add delete button + dialog to `election-table.tsx` (pass `isAdmin` from index)
5. Update `index.tsx` to fetch role + pass `isAdmin`
6. Add delete button + dialog to `$electionId.tsx` with redirect on success

### Step 3 — Source Badge (P3, independent)
1. Create `SourceBadge` component (inline or separate file)
2. Add Source column to `election-table.tsx`
3. Add source badge to `$electionId.tsx` header

### Step 4 — Boundaries API & Hooks (P2 foundation)
1. Create `src/lib/api/boundaries.ts`
2. Create `src/lib/hooks/use-boundaries.ts`

### Step 5 — Boundary Selector Component (P2)
1. Create `boundary-selector.tsx`
2. Update `election-form.tsx` to use `BoundarySelector`
3. Pass `boundary_id` through form submission in `create.tsx` and `$electionId.tsx`

### Step 6 — Tests & Verification
1. Unit tests for all new/modified hooks and components
2. Visual verification via Playwright MCP

---

## Key Patterns

### Delete mutation with inline error
```typescript
// useDeleteElection returns mutation; onError passes error to dialog
const { mutate, isPending } = useDeleteElection()

mutate(electionId, {
  onSuccess: () => {
    onOpenChange(false)
    onSuccess?.()
  },
  onError: (error) => {
    // 409 → show inline in dialog; 401/403 → toast handled by hook
    if (isConflictError(error)) {
      setErrorMessage(extractErrorDetail(error))
    }
  }
})
```

### BoundarySelector usage in form
```tsx
<BoundarySelector
  value={form.watch("boundary_id") ?? null}
  district={form.watch("district")}
  onChange={(boundaryId, districtName) => {
    form.setValue("boundary_id", boundaryId ?? undefined)
    form.setValue("district", districtName)
  }}
/>
```

### Source badge
```tsx
function SourceBadge({ source }: { source?: string | null }) {
  if (source === "sos_feed") return <Badge className="bg-blue-100 text-blue-700 border-blue-200">SOS Feed</Badge>
  if (source === "manual") return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Manual</Badge>
  return null
}
```

---

## Testing Notes

- Unit tests use `@testing-library/react` + `vitest` + `msw` (if used in project) or mock the API functions directly
- Coverage target: 95% on new files
- E2E tests: see `e2e/` directory; add tests for delete flow and boundary selector after implementation
- Visual verification: run `npm run dev`, navigate to `/admin/elections`, take screenshot to `screenshots/010-*.png`
