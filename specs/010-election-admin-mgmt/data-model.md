# Data Model: Admin Election Management — Delete & Local Election Creation

**Feature Branch**: `010-election-admin-mgmt`
**Generated**: 2026-02-26

---

## Modified Types

### `Election` (src/types/elections.ts — modified)

Add two optional fields to the existing `Election` interface:

```typescript
export interface Election {
  // ... existing fields unchanged ...

  /** Source of this election record — set server-side at creation time */
  source?: "sos_feed" | "manual" | null

  /** UUID of the geographic boundary linked to this election (manual elections only) */
  boundary_id?: string | null
}
```

**Rules:**
- `source` is read-only (set server-side); `null` / absent → treat as unknown
- `boundary_id` is set at creation time; `null` means no boundary linked
- Both fields are optional to handle older API responses gracefully (FR-016)

---

### `CreateElectionRequest` (src/types/elections.ts — modified)

```typescript
export interface CreateElectionRequest {
  name: string
  election_date: string
  election_type: ElectionType
  district: string          // always sent; auto-populated from boundary name if selected
  data_source_url?: string  // optional for manual elections (no SOS feed URL)
  refresh_interval_seconds: number
  boundary_id?: string      // optional UUID; links election to geographic boundary (FR-012)
}
```

**Changes from current**: `data_source_url` becomes optional; `boundary_id` is new optional field.

---

## New Types

### `BoundaryListItem` (src/types/boundary.ts — new interface)

Lightweight boundary record for list/search results (no geometry):

```typescript
export interface BoundaryListItem {
  id: string
  name: string
  boundary_type: string
  boundary_identifier: string
  county: string | null
  source: string
}

export interface BoundaryListResponse {
  items: BoundaryListItem[]
  pagination: {
    total: number
    page: number
    page_size: number
    total_pages: number
  }
}

export interface BoundaryTypesResponse {
  types: string[]
}
```

---

## Modified Schema

### `createElectionSchema` (src/lib/schemas/election-form.ts — modified)

```typescript
export const createElectionSchema = z.object({
  name: z.string().min(3).max(200),
  election_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  election_type: z.enum(["general", "primary", "special", "runoff"]),
  district: z.string().min(1).max(200),
  // Changed: URL, empty string, or undefined (manual elections have no SOS feed URL)
  data_source_url: z.union([z.string().url(), z.literal("")]).optional(),
  refresh_interval_seconds: z.number().int().min(60),
  // New: optional boundary UUID
  boundary_id: z.string().uuid().optional(),
})

export type ElectionFormValues = z.infer<typeof createElectionSchema>
```

---

## New API Module

### `src/lib/api/boundaries.ts` (new file)

```typescript
// Functions:

getBoundaries(params?: {
  type?: string
  search?: string
  county?: string
  page?: number
  page_size?: number
}): Promise<BoundaryListResponse>

getBoundaryTypes(): Promise<BoundaryTypesResponse>
```

Uses `api` (authenticated) client. Endpoint: `GET /boundaries` and `GET /boundaries/types`.

---

## New Hooks

### `src/lib/hooks/use-boundaries.ts` (new file)

```typescript
// useBoundaries — server-side search with debounce
useBoundaries(params?: {
  type?: string
  search?: string
  page_size?: number
}): TanStack Query result with BoundaryListItem[]
// - Enabled only when type is selected OR search has ≥ 2 chars
// - staleTime: 60s (boundaries change infrequently)
// - Error handling: toast on auth/permission errors

// useBoundaryTypes — fetch available boundary types for filter dropdown
useBoundaryTypes(): TanStack Query result with string[]
// - staleTime: 5min (types rarely change)
```

### `src/lib/hooks/use-admin-elections.ts` (modified — new hook added)

```typescript
// New hook:
useDeleteElection(): TanStack Query mutation
// mutationFn: (electionId: string) => deleteElection(electionId)
// onSuccess: invalidate ["admin", "elections"] + ["elections"] + toast success
// onError: call onError callback with message (for inline dialog display) +
//          toast on auth/permission errors
```

---

## New Components

### `src/routes/admin/elections/_components/boundary-selector.tsx` (new file)

Controlled combobox component for selecting a geographic boundary:

```typescript
interface BoundarySelectorProps {
  value: string | null        // selected boundary_id
  district: string            // current district text (for display)
  onChange: (boundaryId: string | null, districtName: string) => void
}
```

Internal state: `search: string`, `typeFilter: string`, `open: boolean`

Renders:
1. `Select` for boundary type filter (populated from `useBoundaryTypes()`)
2. `Popover` + `Command` for search + list (populated from `useBoundaries({ type, search })`)
3. When boundary selected: shows selected name with clear button
4. When no boundary selected: shows plain text `Input` for manual district entry

### `src/routes/admin/elections/_components/delete-election-dialog.tsx` (new file)

Confirmation dialog for election deletion:

```typescript
interface DeleteElectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  electionName: string
  electionId: string
  onSuccess?: () => void  // called after successful deletion (e.g., navigate away)
}
```

Internal state: `errorMessage: string | null`

Renders:
- Warning message (generic, per FR-004)
- Error alert if `errorMessage` is set (inline, dialog stays open per FR-007)
- Cancel + Delete buttons
- Delete button triggers `useDeleteElection` mutation

---

## Modified Components

### `election-table.tsx` (modified)

New props:
```typescript
interface ElectionTableProps {
  elections: Election[]
  isAdmin: boolean            // show delete button only when true
  onDeleteSuccess?: () => void // called after delete to trigger query invalidation
}
```

New column: "Source" → `SourceBadge` component (renders colored badge from `election.source`).

New column (admin only): Actions → `Trash2` icon button that opens `DeleteElectionDialog`.

### `election-form.tsx` (modified)

District field replaced with:
1. `BoundarySelector` component (when `enableAutoFill` is false, or always)
2. Hidden district text field (auto-populated from boundary selection)

New prop `onBoundaryChange?: (id: string | null, name: string) => void` passed through from parent, or managed internally via RHF `setValue`.

### `$electionId.tsx` (modified)

- Add delete button (admin only, checks `useUserRole().data?.role === "admin"`)
- Add `DeleteElectionDialog` with `onSuccess` → `navigate({ to: "/admin/elections" })`
- Add source badge in header section (next to status badge)

### `index.tsx` (modified)

- Fetch `useUserRole()` and derive `isAdmin`
- Pass `isAdmin` to `ElectionTable`

---

## State Transitions

```
Election deletion:
  INITIAL → [click Delete] → dialog open
  dialog open → [click Cancel] → dialog closed (no change)
  dialog open → [click Delete] → mutation pending → loading state
  mutation pending → success → dialog closed, query invalidated, toast shown
  mutation pending → error (backend) → error shown in dialog (dialog stays open)
  mutation pending → error (auth/perm) → dialog closed, toast error
```

```
Boundary selection in form:
  district = plain text input
  → [open combobox + select type + search + pick boundary]
  → boundary_id set, district auto-populated from boundary name
  → district text field hidden (or read-only, showing boundary name)

  → [clear selection]
  → boundary_id = undefined, district = ""
  → district reverts to plain text input
```
