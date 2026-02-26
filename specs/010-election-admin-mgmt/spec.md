# Feature Specification: Admin Election Management — Delete & Local Election Creation

**Feature Branch**: `010-election-admin-mgmt`
**Created**: 2026-02-26
**Status**: Draft
**Input**: Admin election management UI — delete elections and create local elections with district selection

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Delete an Election (Priority: P1)

An administrator needs to remove an election that was created in error or is no longer relevant. From either the election list or the election detail page, they click a Delete button, are shown a confirmation dialog explaining the consequence, and after confirming, the election disappears from the list immediately.

**Why this priority**: Correcting data entry errors is a critical admin capability. Without delete, administrators have no way to remove bad records, and the election list becomes cluttered with stale data.

**Independent Test**: Can be fully tested by creating an election and then deleting it from the list or detail view; delivers immediate data correction capability without requiring the creation form changes.

**Acceptance Scenarios**:

1. **Given** an administrator is on the election list page with at least one election, **When** they click the Delete button for an election, **Then** a confirmation dialog appears explaining the election will be removed from all lists.
2. **Given** the confirmation dialog is open, **When** the administrator clicks "Cancel", **Then** the dialog closes with no changes made.
3. **Given** the confirmation dialog is open, **When** the administrator clicks "Delete", **Then** the election is removed and the list updates immediately without requiring a page refresh.
4. **Given** an administrator is viewing an election detail page, **When** they click the Delete button, **Then** the same confirmation dialog appears and, after confirmation, they are redirected to the election list with the election removed.
5. **Given** a non-administrator user (analyst or viewer) is on any election page, **When** viewing, **Then** no Delete button is visible.

---

### User Story 2 — Create a Local Election with District Boundary (Priority: P2)

An administrator creates an election for a known upcoming local or early election and needs to associate it with a specific geographic district from the system (e.g., a city council district, county commission district). The creation form presents a searchable dropdown of actual district boundaries from the system, filterable by boundary type. The field is optional so the form continues to work for SOS-feed-sourced elections.

**Why this priority**: Local elections are not captured by the SOS feed and require manual creation. Linking elections to actual district boundary records enables accurate voter eligibility filtering and geographic scoping — this is the primary value of the local election creation workflow.

**Independent Test**: Can be tested by navigating to Create Election and verifying the boundary selector appears, allows searching and filtering, and successfully submits with or without a boundary selected.

**Acceptance Scenarios**:

1. **Given** an administrator is on the Create Election form, **When** they view the form, **Then** the district field is a searchable dropdown showing available district boundaries from the system, not a plain text input.
2. **Given** the boundary selector is open, **When** the administrator types a partial name or identifier, **Then** the list filters to show only matching boundaries.
3. **Given** the boundary selector is open, **When** the administrator selects a boundary type filter (e.g., "county-commission", "state-senate"), **Then** only boundaries of that type are shown.
4. **Given** an administrator submits the form with a boundary selected, **When** the form is confirmed and submitted, **Then** the new election is associated with the chosen district boundary.
5. **Given** an administrator submits the form without selecting a boundary, **When** the form is confirmed and submitted, **Then** the election is created successfully with no district boundary (district field remains optional).

---

### User Story 3 — Election Source Indicator (Priority: P3)

Administrators viewing the **admin** election list or the **admin** election detail page can immediately tell whether each election originated from the SOS data feed or was manually created by an administrator. A visually distinct badge or tag communicates the source. This indicator is not shown on public-facing election pages.

**Why this priority**: Distinguishing manually-created elections from SOS-feed elections helps administrators audit data provenance and understand which records require manual maintenance vs. automatic updates.

**Independent Test**: Can be tested by verifying that elections have a visible source badge on both the list and detail views; requires backend to return a source field but no other features need to be complete.

**Acceptance Scenarios**:

1. **Given** the election list contains both SOS-feed-sourced and manually-created elections, **When** the administrator views the list, **Then** each row shows a distinct visual indicator (badge or tag) identifying the source.
2. **Given** an administrator is on an election detail page, **When** viewing the election information, **Then** the source indicator is clearly displayed.
3. **Given** an election sourced from the SOS feed, **When** rendered, **Then** the badge reads "SOS Feed" (or equivalent) and uses a visually distinct style from manual elections.
4. **Given** a manually-created election, **When** rendered, **Then** the badge reads "Manual" (or equivalent) and is visually distinct from SOS-feed elections.

---

### Edge Cases

- What happens when an administrator tries to delete an election that has associated results or participants? The confirmation dialog should warn about potential data loss, and the system should handle rejection gracefully with a user-facing error if the backend refuses deletion.
- What if the boundary list is empty or the API is unavailable? The boundary selector should show an appropriate empty/error state and the form should remain usable (boundary field is optional).
- What if the boundary list is very large (hundreds of entries)? The selector must remain performant — server-side search or pagination should be considered rather than loading all boundaries at once.
- What if a deletion is in progress and the user navigates away? In-flight deletions should not cause inconsistent UI state; if the deletion succeeds after navigation, the list should reflect it on next load.
- What if the `source` field is absent from older election records returned by the API? The UI should gracefully degrade (e.g., show no badge or a neutral "Unknown" badge).

## Requirements *(mandatory)*

### Functional Requirements

**Delete Elections**

- **FR-001**: Administrators MUST be able to initiate election deletion from both the `/admin/elections` list page and the `/admin/elections/$id` detail page.
- **FR-002**: The Delete button MUST only be visible to users with the administrator role; analyst and viewer roles MUST NOT see the button.
- **FR-003**: Clicking the Delete button MUST present a confirmation dialog before any deletion occurs.
- **FR-004**: The confirmation dialog MUST include a generic warning that the election will be removed from all lists; it MUST NOT proactively fetch or display counts of associated records.
- **FR-005**: After the administrator confirms deletion, the election MUST be removed from the list immediately without requiring a page refresh.
- **FR-006**: After deletion from the detail page, the system MUST redirect the administrator to the election list.
- **FR-007**: If the deletion fails (e.g., backend rejects due to associated data), the system MUST display a clear error message within the dialog without closing it, allowing the administrator to dismiss manually.

**Local Election Creation with District Boundary**

- **FR-008**: The election creation form MUST present the district field as a single switching field: it shows a searchable boundary selector by default; if the selection is cleared or no boundary is chosen, the field switches to an editable plain text input for manual district name entry. The two modes are mutually exclusive — no separate district text field is shown alongside the selector.
- **FR-009**: The boundary selector MUST be filterable by boundary type (e.g., county-commission, state-senate, city-council). The type filter control (Select or segmented control) MUST appear inside the selector popover, above the search input, filtering the list in-place. No separate type filter field is shown outside the popover.
- **FR-010**: The boundary selector MUST support text search to filter boundaries by name or identifier.
- **FR-011**: The boundary field MUST be optional — submitting the form without selecting a boundary MUST succeed.
- **FR-012**: When a boundary is selected, its human-readable name MUST auto-populate the `district` text field, and the election creation request MUST include both the `district` string and the `boundary_id` so the election is associated with the geographic district record while remaining backward-compatible with the existing API contract.

**Election Source Indicator**

- **FR-013**: The `/admin/elections` list page MUST display a visual badge or tag on each row indicating whether the election originated from the SOS feed or was manually created; this badge MUST NOT appear on public-facing election pages.
- **FR-014**: The `/admin/elections/$electionId` detail page MUST display the same source indicator in the election's information section; it MUST NOT appear on public-facing election detail views.
- **FR-017**: The existing `/admin/elections` (election management list) and `/admin/elections/$electionId` (election management detail) routes MUST be extended with role-based access following the same admin-panel pattern. The delete button and source badge live exclusively on these admin routes and MUST NOT appear on public-facing election pages.
- **FR-015**: The source indicator MUST be visually distinct between SOS-feed and manually-created elections (different colors, labels, or icons).
- **FR-016**: If the source field is absent or unknown on an election record, the UI MUST handle it gracefully without crashing.

### Key Entities

- **Election**: A race or contest record. The existing required `district` string field is retained. Gains an optional `boundary_id` field linking it to a geographic boundary record (when set, `district` is auto-populated from the boundary's name), and a `source` field (`"sos_feed"` | `"manual"`) indicating its origin.
- **Boundary**: A geographic district record in the system with a `boundary_type`, `boundary_identifier`, and human-readable name. Used as the selection options in the boundary dropdown.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An administrator can delete any election in 3 or fewer clicks from the election list (click Delete → confirm → election removed).
- **SC-002**: An administrator can create a local election with a district boundary selected in under 2 minutes, including searching and selecting the correct boundary.
- **SC-003**: The election list page correctly displays a source badge on 100% of election rows when the backend provides a source field.
- **SC-004**: The boundary selector returns filtered results within 1 second of the administrator entering a search term or selecting a boundary type filter.
- **SC-005**: Zero accidental deletions occur due to the confirmation step — the confirmation dialog is always shown before deletion is executed.

## Clarifications

### Session 2026-02-26

- Q: When an administrator selects a boundary from the dropdown, what relationship exists between the boundary selection and the `district` field? → A: Selecting a boundary auto-populates `district` with the boundary's name; both `district` (string) and `boundary_id` are sent to the API, maintaining backward compatibility.
- Q: Should the source badge appear only inside the admin panel, or also on public-facing election pages? → A: Admin panel only — source badge is shown only within admin-panel views (admin election list and admin election detail).
- Q: Should the deletion confirmation dialog proactively show associated data counts, or just a generic warning? → A: Generic warning only; if the backend rejects the deletion, display a clear error message within the dialog.
- Q: Does the existing `/boundaries` API support text search by name/identifier? → A: No — `GET /api/v1/boundaries` supports `boundary_type`, `county`, `source` filters and pagination, but has no text search parameter. A `search` query param needs to be added to the backend (tracked in CivicPulse/voter-api#92). The `/api/v1/boundaries/types` endpoint already exists for populating the type filter.
- Q: Should admin-only features (delete button, source badge) be on new dedicated admin routes or augment existing public election pages conditionally? → A: New dedicated admin routes — create `/admin/elections` (list) and `/admin/elections/$electionId` (detail); delete button and source badge live only on these admin routes.
- Q: How should the district/boundary fields be presented on the Create Election form? → A: Single switching field — shows boundary selector by default; if cleared/deselected it becomes an editable plain text input for manual district name entry.
- Q: Where should the boundary type filter control live relative to the boundary selector? → A: Inside the selector popover — a Select or segmented control above the search input that filters the list in-place; no external field alongside the trigger button.

## Assumptions

- The backend `voter-api` will be updated to support:
  - A `DELETE /elections/{id}` endpoint
  - A `source` field on election list and detail responses (`"sos_feed"` | `"manual"`)
  - An optional `boundary_id` field on election creation requests and responses
  - A `search` query parameter on `GET /api/v1/boundaries` for case-insensitive partial matching on name/identifier (tracked in CivicPulse/voter-api#92); the `boundary_type` filter and `/api/v1/boundaries/types` endpoint already exist
- The `source` field is set server-side at creation time and is not editable
- Boundary records already exist in the system (imported via boundary import jobs) before administrators create local elections
- Only users with the `admin` role can delete elections; `analyst` and `viewer` roles cannot
- The boundary selector uses server-side search (debounced) rather than loading all boundaries into the browser at once; type filtering uses the existing `boundary_type` query param
- The existing two-step confirmation pattern (used for user creation and file uploads) is extended to cover election deletion
