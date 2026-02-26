# Research: Admin Election Management — Delete & Local Election Creation

**Feature Branch**: `010-election-admin-mgmt`
**Generated**: 2026-02-26

---

## Decision Log

### D-001: Dialog Pattern for Delete Confirmation

**Decision**: Use shadcn `Dialog` (not `AlertDialog`) for the delete confirmation.

**Rationale**: The existing codebase uses `Dialog` (from `@/components/ui/dialog`) consistently for all admin confirmations — finalize election, reactivate election, trigger geocode. `AlertDialog` exists in `src/components/ui/alert-dialog.tsx` but is not used in any current admin flow. Reusing `Dialog` is consistent with the project's established pattern.

**Alternatives considered**: `AlertDialog` (shadcn semantic confirmation) — rejected for consistency with existing code. The `Dialog` pattern is functionally equivalent and already tested.

---

### D-002: Delete Error Handling Strategy

**Decision**: Show error inline inside the Dialog (not as a toast) when the backend rejects deletion. Dialog stays open; user dismisses manually.

**Rationale**: FR-007 explicitly requires this: "If the deletion fails...the system MUST display a clear error message within the dialog without closing it, allowing the administrator to dismiss manually." This differs from the update/create error pattern (which uses toast only) because deletion is irreversible — keeping the dialog open with context is safer.

**Implementation**: The delete dialog component maintains a local `errorMessage: string | null` state. The `useMutation`'s `onError` callback passes the error up via a prop callback (rather than global toast for backend rejections), so the dialog can display it inline.

**Alternatives considered**: Close dialog + toast error — rejected (violates FR-007 and is worse UX for an irreversible action).

---

### D-003: Boundary Selector UX Pattern

**Decision**: Replace the district text field with a two-part `BoundarySelector` component: (1) a boundary type `Select` filter, and (2) a `Popover` + `Command` combobox for search/select. When a boundary is selected, its name auto-fills the hidden `district` RHF field and `boundary_id` is set in form state. When no boundary is selected, a plain text `Input` is shown for manual district entry.

**Rationale**:
- `shadcn/ui Command` (within a `Popover`) is the standard combobox pattern in this project's stack.
- Keeping `district` as the underlying RHF field (string) maintains backward compatibility with `createElectionSchema` and the backend API.
- The type filter + text search combination matches FR-009 and FR-010.
- Server-side search (debounced GET with `?search=` param) avoids loading hundreds of boundaries at once (per spec assumption).

**Implementation details**:
- `BoundarySelector` is a controlled component receiving `value: string | null` (boundary ID) and `onSelect: (id: string | null, name: string) => void`.
- When combobox item is selected → `onSelect(boundary.id, boundary.name)` → parent sets `boundary_id` + `district` in RHF.
- When combobox is cleared → `onSelect(null, "")` → district reverts to plain text input.
- Debounce: 300ms on the search input before triggering refetch.
- Type filter: the boundary type Select triggers a new query (no debounce needed for type changes).

**Alternatives considered**:
- shadcn `Select` with all boundaries loaded client-side — rejected (hundreds of boundaries, poor performance per spec edge case).
- A separate "boundary" field alongside the existing district field — rejected (two fields for the same concept is confusing).

---

### D-004: `data_source_url` Schema — Make Optional for Manual Elections

**Decision**: Change `data_source_url` in `createElectionSchema` from required URL to optional (accept empty string or omit).

**Rationale**: Manual elections (the primary use case for boundary-linked elections) have no SOS feed URL. The current schema's `z.string().url()` requires a non-empty valid URL, blocking form submission for manual elections. Since the backend presumably accepts an empty or null `data_source_url` for manually-created elections, the schema must be relaxed.

**Implementation**: `data_source_url: z.string().url().or(z.literal(""))` or `z.union([z.string().url(), z.literal("")])` — accepts either a valid URL or an empty string.

**Alternatives considered**: Create a separate schema for manual election creation — rejected (over-engineering; a single relaxed schema is sufficient since the auto-fill feature gracefully handles empty URLs already).

---

### D-005: Boundaries API Module

**Decision**: Create `src/lib/api/boundaries.ts` as a new API module (no existing boundaries API module exists).

**Rationale**: `src/types/boundary.ts` already defines `BoundaryDetailResponse` and `BoundaryTypesResponse` types. The GET `/boundaries` endpoint is called from geocoding features (via hooks) but there's no reusable API function module. Creating a dedicated module follows the pattern of `src/lib/api/elections.ts`, `src/lib/api/admin.ts`, etc.

**Functions needed**:
- `getBoundaries(params?)` — GET `/boundaries` with `type`, `search`, `county`, `page`, `page_size` params
- `getBoundaryTypes()` — GET `/boundaries/types`

**New type needed**: `BoundaryListItem` (lightweight boundary record for list/search results — lighter than `BoundaryDetailResponse` which includes geometry).

**Alternatives considered**: Inline API calls in hooks — rejected (inconsistent with project pattern of separating API functions from hooks).

---

### D-006: Source Badge Styling

**Decision**: Use shadcn `Badge` component with custom color classes:
- `"sos_feed"` → blue badge (`bg-blue-100 text-blue-700 border-blue-200`)
- `"manual"` → amber badge (`bg-amber-100 text-amber-700 border-amber-200`)
- `null` / unknown → neutral/outline badge (no color)

**Rationale**: Matches the spec requirement for visually distinct badges. Using inline Tailwind classes instead of `variant` props allows the exact color control needed without adding new Badge variants to the design system.

**Alternatives considered**: New shadcn Badge variants — rejected (changes the global UI component for a localized feature; inline classes are sufficient).

---

### D-007: useUserRole in ElectionTable vs. Index Page

**Decision**: Check user role at the **index.tsx** page level (not inside `ElectionTable`). Pass `isAdmin: boolean` as a prop to `ElectionTable` and the future delete dialog.

**Rationale**: `useUserRole()` is a cached TanStack Query hook — calling it multiple times is fine, but it creates implicit coupling if components make their own role checks. The page-level pattern is cleaner and makes the table component more testable (props over hooks).

**Alternatives considered**: Call `useUserRole()` inside `ElectionTable` — possible but makes the component harder to unit test and hides the conditional rendering logic.

---

### D-008: Delete from Detail Page — Redirect Target

**Decision**: After successful deletion from the detail page (`$electionId.tsx`), redirect to `/admin/elections` (the elections list).

**Rationale**: FR-006 explicitly requires this. TanStack Router's `useNavigate` (already imported in the file) handles this via `navigate({ to: "/admin/elections" })`, consistent with the "Save Changes" flow.

---

### D-009: Election Source Type in `Election` Interface

**Decision**: Add `source?: "sos_feed" | "manual" | null` to the `Election` interface in `src/types/elections.ts`.

**Rationale**: The source field is returned by the backend on both list and detail responses. Making it optional (`?`) handles older records that may not have the field. Explicit union type enables exhaustive handling in the UI.

---

### D-010: `CreateElectionRequest` — Add `boundary_id`

**Decision**: Add `boundary_id?: string` to `CreateElectionRequest` in `src/types/elections.ts`.

**Rationale**: FR-012 requires both `district` (string) and `boundary_id` (UUID) to be sent when a boundary is selected. Making it optional maintains backward compatibility for SOS-feed elections that don't use boundary selection.

---

## Resolved Clarifications from Spec

- **`/api/v1/boundaries` search param**: The backend `GET /api/v1/boundaries` does NOT currently have a `?search=` parameter. It's being added in voter-api#92. The frontend implementation will include the `search` param in the API call; if the backend doesn't support it yet, the combobox will show all results of the selected type (which is acceptable).
- **`/api/v1/boundaries/types`**: Already exists — returns `{ types: string[] }`.
- **Delete endpoint**: New — `DELETE /api/v1/elections/{id}` → 204 on success, 409 if deletion blocked.
- **Role guard for delete**: Only `admin` role; `analyst` and `viewer` cannot delete.
