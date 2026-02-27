# Feature Specification: Interactive Geocoding Map

**Feature Branch**: `011-geocoding-map-interactive`
**Created**: 2026-02-26
**Status**: Draft
**Input**: User description: "Interactive geocoding map with provider-colored markers, draggable primary, and district boundary verification"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Provider-Colored Map Markers (Priority: P1)

An admin or analyst viewing a voter's geocoding results wants to quickly identify which geocoding provider produced each location. Currently all non-primary markers look identical (grey), making it impossible to visually distinguish Census Bureau results from USPS or Google results. With per-provider color-coded markers, the user can instantly see at a glance which providers agree, which diverge, and how far apart their results are.

**Why this priority**: Pure display enhancement with no data changes. Delivers immediate value and is the foundational visual upgrade that makes all other map interactions meaningful.

**Independent Test**: Can be fully tested by viewing the voter detail page geocoding map and verifying each provider's marker has a distinct color with a matching legend entry.

**Acceptance Scenarios**:

1. **Given** a voter with geocoded locations from multiple providers, **When** the geocoding map renders, **Then** each provider's marker displays in a visually distinct color or style with a corresponding legend entry identifying the provider.
2. **Given** a voter with only one provider's results, **When** the map renders, **Then** that provider's marker appears in its assigned color (not default grey).
3. **Given** the same provider appears as both primary and non-primary, **When** the map renders, **Then** the primary marker is visually highlighted and all markers for that provider share the provider's color family.
4. **Given** more providers exist than there are distinct palette colors, **When** the map renders, **Then** colors cycle or shape differentiation is used so all markers remain distinguishable.

---

### User Story 2 - Draggable Official Location Marker (Priority: P2)

A data quality analyst needs to fine-tune a voter's official geocoded location by dragging the primary marker to the precise rooftop or parcel centroid. After dragging, the map should immediately re-check which districts that point falls in so the analyst can verify the location is correct before saving.

**Why this priority**: Enables precision correction workflows that would otherwise require manual coordinate entry. Depends on P1 visual distinction to clearly identify which marker is the official one.

**Independent Test**: Can be fully tested by dragging the primary location marker, verifying coordinate display updates in real time, saving, and confirming the district comparison refreshes after save.

**Acceptance Scenarios**:

1. **Given** a voter with a primary geocoded location, **When** the user views the map, **Then** the primary marker is visually distinct (e.g., larger, highlighted, different icon) and shows a drag affordance.
2. **Given** the user drags the primary marker, **When** the drag is in progress, **Then** the marker moves fluidly and the coordinate readout updates in real time.
3. **Given** the user drops the marker at a new position, **When** the drop completes, **Then** the coordinate readout reflects the new position; the district comparison matrix does not update until the user saves the new position.
4. **Given** the user has dragged the marker to an unsaved position, **When** viewing the UI, **Then** a visual indicator is shown and save/reset actions are available.
5. **Given** the user saves the dragged position, **When** the save succeeds, **Then** the new coordinates are persisted as the primary geocoded location.
6. **Given** the user resets after dragging, **When** reset is confirmed, **Then** the marker returns to the original saved position and the district comparison reflects the original location.

---

### User Story 3 - District Boundary Overlays (Priority: P3)

An analyst reviewing a voter's district assignments wants to visually verify that the voter's location actually falls inside the registered district boundary. By clicking a district assignment in the list, the corresponding boundary polygon should appear as a toggleable overlay on the map.

**Why this priority**: Leverages existing boundary overlay infrastructure that just needs to be wired to the voter detail page. Provides strong visual verification that complements the text-based comparison data.

**Independent Test**: Can be fully tested by clicking a district assignment entry and verifying the correct boundary polygon appears on the map, then toggling it off by clicking again.

**Acceptance Scenarios**:

1. **Given** a voter with district assignments displayed, **When** the user clicks a district entry, **Then** that district's boundary polygon appears as a colored overlay on the geocoding map.
2. **Given** a district overlay is active, **When** the user clicks the same district entry again, **Then** the overlay is removed.
3. **Given** multiple overlays are active simultaneously, **When** the map renders, **Then** each boundary uses a distinct color and is labeled with the district name.
4. **Given** a boundary overlay is active, **When** the user drags the primary marker (P2), **Then** the overlay remains visible.
5. **Given** the user clicks a district with no boundary data available, **When** the click occurs, **Then** a non-blocking message informs the user that boundary data is unavailable.

---

### User Story 4 - Provider × District Comparison Matrix (Priority: P4)

A senior analyst performing data quality review needs to see, at a glance, how each geocoding provider's result compares to the registered district assignments across all district types. This enables prioritization of re-geocoding efforts by identifying which providers consistently agree with registered districts.

**Why this priority**: Most complex to implement — requires batch district-check capability (checking multiple arbitrary coordinates against districts). Builds on the existing district-check infrastructure.

**Independent Test**: Can be fully tested by viewing the matrix and verifying each provider's column shows correct match/mismatch status for each district type, and that updating the official location refreshes the matrix.

**Acceptance Scenarios**:

1. **Given** a voter with results from multiple geocoding providers, **When** the user views the district assignments card, **Then** the card displays a matrix with district types as rows and columns for: Registered, Geographic (official), and one column per geocoding provider — each cell showing the district value or a match/mismatch indicator.
2. **Given** a cell in the matrix shows a mismatch, **When** the user views it, **Then** both the registered value and the provider-determined value are visible.
3. **Given** a provider has no geocoded result for the voter, **When** the matrix renders, **Then** that provider's column shows "No data" for all district rows.
4. **Given** the user drags the primary marker to a new position and saves, **When** the save succeeds, **Then** the matrix row for the official location updates automatically without a page reload.
5. **Given** the page loads, **When** the matrix data is fetching, **Then** a loading state is shown and results appear without requiring manual user action.

---

### Edge Cases

- When a voter has no geocoded locations, the geocoding section displays a placeholder message indicating no locations have been geocoded yet, with a prompt to run geocoding. The map and district matrix are not shown.
- When multiple providers return identical coordinates, each marker is offset by a small pixel amount (approximately 6px per provider index at default zoom, implemented as a deterministic ~0.00003° coordinate step) so all remain individually visible and clickable.
- When district boundary data fails to load for a requested overlay, the map continues to function normally for all other interactions (dragging, other overlay toggles). The failed overlay is silently skipped and a non-blocking info toast informs the user ("Could not load boundary for [district name]"). No error state is applied to the map container.
- When a dragged position falls outside all known boundary data, no district check is triggered for that position until the user saves. After saving, the district matrix and any active overlays remain visible; provider columns in the matrix will show "No data" for any district type where the saved point lies outside known boundaries. No error is shown for this condition.
- When the district-check service is unavailable or returns an error, the matrix structure remains visible with an inline error banner and a retry button; no full page reload is required. If the service returns a partial response (some providers succeed, others fail), available provider columns render normally and failed provider columns show `—` in all cells with no per-cell error indicator.
- When more geocoding providers exist than palette colors, the color cycle repeats (each color reused by a different provider). Shape differentiation (e.g., different icon stroke weights or sizes) can be used if more than ~8 providers are present, but this is unlikely in practice given the current provider count.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each geocoding provider MUST be assigned a visually distinct color or icon style, consistent across all map markers and legend entries.
- **FR-002**: The map MUST display a legend identifying each provider by name and its associated color or icon.
- **FR-003**: The primary (official) location marker MUST be visually differentiated from non-primary markers in addition to its provider color (e.g., larger, highlighted, different icon shape).
- **FR-004**: The primary location marker MUST be draggable; users MUST be able to reposition it on the map by dragging.
- **FR-005**: While dragging, the marker's current latitude and longitude MUST update in real time in the UI.
- **FR-006**: While dragging, the coordinate readout MUST update in real time; the district comparison matrix does NOT update until the position is saved.
- **FR-007**: Unsaved drag changes MUST be visually indicated, and users MUST be offered save and reset/discard actions.
- **FR-008**: Saving a dragged position MUST update the existing primary geocoded location record's coordinates in-place; no new record is created and no historical copy of the prior coordinates is retained.
- **FR-009**: Resetting a dragged position MUST return the marker to the last saved coordinates.
- **FR-019**: If saving a dragged position fails (network or API error), the marker MUST snap back to the last saved coordinates and an error toast MUST be shown to the user.
- **FR-010**: Each district assignment entry MUST be clickable to toggle its boundary polygon overlay on the map.
- **FR-011**: Multiple district boundary overlays MUST be independently toggleable and simultaneously visible.
- **FR-012**: Each active boundary overlay MUST be labeled with the district name and rendered in a distinct color from other active overlays.
- **FR-013**: District boundary overlays MUST remain visible while the primary marker is being dragged.
- **FR-014**: When boundary data is unavailable for a selected district, a non-blocking notification MUST inform the user.
- **FR-015**: The existing district assignments display MUST be expanded to include a column per geocoding provider alongside the existing registered and geographic columns, forming a matrix where rows are district types and columns are: Registered, Geographic (official), and one column per provider.
- **FR-016**: Mismatch cells in the matrix MUST display both the registered district value and the provider-determined district value.
- **FR-017**: When the official location changes (drag-and-save or other update), the matrix MUST refresh automatically without a full page reload.
- **FR-018**: All map interactions — drag, overlay toggle, matrix refresh — MUST take effect immediately without a full page reload.

### Key Entities

- **Geocoding Provider Result**: A geocoded point attributed to a named provider, carrying coordinates, confidence score, and primary/non-primary designation.
- **Primary Location**: The official geocoded point used for district assignment; user-modifiable via drag-and-drop.
- **District Boundary Overlay**: A toggleable polygon on the map representing a registered district boundary, identified by district type and name.
- **Provider × District Comparison Cell**: One intersection in the matrix representing whether a specific provider's point falls within the registered district for a specific district type.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify the provider of any map marker within 3 seconds of viewing the map, using the color coding and legend.
- **SC-002**: Users can drag the official location marker and see updated district assignments within 5 seconds of saving the new position.
- **SC-003**: Users can toggle a district boundary overlay on or off within 2 seconds of clicking the district entry.
- **SC-004**: The provider × district comparison matrix displays results for all providers within 10 seconds of the page loading.
- **SC-005**: No map interaction (drag, overlay toggle, or matrix refresh) requires a full page reload.
- **SC-006**: At least 5 district boundary overlays can be active simultaneously with distinct colors and readable labels.
- **SC-007**: The comparison matrix automatically reflects changes to the official location without requiring any manual refresh action.

## Clarifications

### Session 2026-02-26

- Q: When a user drags the primary marker and saves, what happens to the existing primary geocoded location record? → A: Update the existing primary record's coordinates in-place (old coordinates are replaced; no new record is created).
- Q: Should saving a dragged position be restricted to admin only, or available to both admin and analyst roles? → A: Both admin and analyst can drag and save.
- Q: Should the provider × district comparison matrix update live during drag (before saving) or only after the position is saved? → A: Only after the save action is confirmed.
- Q: Should the provider × district comparison matrix replace, expand, or appear separately from the existing DistrictAssignmentsCard? → A: Expand the existing card — add provider columns alongside the existing registered/geographic columns.
- Q: When a voter has no geocoded locations, what should the geocoding section show? → A: Show a placeholder message with a prompt to run geocoding.
- Q: SC-002 said "within 5 seconds of releasing the marker" but FR-006 requires save before matrix updates — which is correct? → A: SC-002 was a wording error; the matrix updates within 5 seconds of saving the new position (FR-006 is correct).
- Q: How does the map handle multiple providers with identical coordinates (stacked markers)? → A: Apply a small pixel offset (jitter) so all markers remain individually visible and clickable.
- Q: If saving a dragged marker position fails, what should happen to the marker? → A: Snap back to last saved position and show an error toast; do not leave marker at unsaved position.
- Q: Should the provider × district comparison matrix be computed client-side (Turf.js) or via a new API call? → A: New batch API endpoint — accepts multiple coordinates, returns district assignments for each in a single request.
- Q: How does the matrix display when the district-check service is unavailable or returns an error? → A: Show the matrix structure with an inline error banner and retry button; no full page reload required.

## Assumptions

- Geocoding providers are identified by the `source_type` field on geocoded location records; color assignments are stable per named provider.
- The existing district-check endpoint checks the current primary location. A new API endpoint accepting a batch of coordinates will be used to check arbitrary coordinates (for drag-and-drop post-save) and per-provider coordinates (for the matrix) in a single request. Client-side Turf.js is not used for district membership checks.
- District boundary GeoJSON is retrievable via existing boundary data endpoints already used by boundary overlay components on other pages.
- Saving a dragged position updates the existing primary location record's coordinates in-place via the existing update API. No new record is created.
- The comparison matrix column for the "official" position reflects the last saved primary coordinates. An unsaved drag position does not affect the matrix until saved.
- This feature is scoped to the voter detail page geocoding section only; no other pages are affected.
- Both `admin` and `analyst` roles can drag and save the primary marker position. No role distinction is applied to this operation beyond the existing page-level access control.
