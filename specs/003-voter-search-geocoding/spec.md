# Feature Specification: Voter Search & Geocoding

**Feature Branch**: `003-voter-search-geocoding`
**Created**: 2026-02-18
**Status**: Draft
**Input**: User description: "Voter Search & Geocoding — search for voters, view registration details, manage geocoded locations, select official coordinates, and view district assignments."

## Clarifications

### Session 2026-02-18

- Q: Should geocoded locations be displayed on a map on the voter detail page? → A: Yes — show a map with all geocoded location pins alongside the tabular list, with the official location visually highlighted on the map.
- Q: How should the district filter work — cascading (type then value), grouped dropdown, or free-text? → A: Two-level cascade — first select district type (Congressional, State Senate, etc.), then select a specific district within that type.
- Q: Where should voter search live in the app navigation? → A: Top-level nav item ("Voters") visible to all authenticated users, alongside Elections, Counties, and Districts.
- Q: Should search query, filters, sort, and page be reflected in the URL? → A: Yes — use URL query parameters so searches are bookmarkable, shareable, and support browser back/forward navigation.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Search & Browse Voters (Priority: P1)

A staff member needs to find a specific voter in the system. They navigate to the voter search page and type a name (or partial name) into the search box. Matching results appear in a sortable table showing key voter information — name, county, voter ID, registration date, and status. The staff member can narrow results using filters for county, voter status, and district type. They can sort results by any column and page through large result sets.

**Why this priority**: Searching for voters is the foundational action that all other workflows depend on. Without the ability to find a voter, no other feature in this specification delivers value.

**Independent Test**: Can be fully tested by searching for voters by name, applying filters, sorting columns, and paging through results. Delivers value as a standalone voter lookup tool even without detail pages.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the voter search page, **When** they type "Smith" into the search box, **Then** the system displays a paginated table of voters whose names match "Smith", showing name, county, voter ID, registration date, and status.
2. **Given** search results are displayed, **When** the user selects a county filter, **Then** results update to show only voters in the selected county.
3. **Given** search results are displayed, **When** the user selects a voter status filter (e.g., "Active"), **Then** results update to show only voters with that status.
4. **Given** search results are displayed, **When** the user selects a district type (e.g., "Congressional") and then a specific district (e.g., "District 5"), **Then** results update to show only voters assigned to that district.
5. **Given** search results are displayed, **When** the user clicks a column header (name, county, registration date, or voter ID), **Then** results re-sort by that column in ascending order; clicking again toggles to descending.
6. **Given** more results than fit on one page, **When** the user navigates to the next page, **Then** the next set of results is displayed while preserving the active search query, filters, and sort order.
7. **Given** filter options, **When** the page loads, **Then** county, status, and district filter options are populated dynamically from the actual data in the system.
8. **Given** a search query that matches no voters, **When** results are returned, **Then** the system displays an empty state message indicating no voters were found and suggesting the user adjust their search or filters.

---

### User Story 2 — View Voter Detail (Priority: P2)

A staff member has found a voter in search results and needs to review their full registration information, geocoded locations, and district assignments. They click on a voter row (or a link within it) to open that voter's detail page. The detail page displays registration information at the top, followed by a map and tabular list of geocoded locations (with provider, confidence score, and formatted address), and the voter's current district assignments based on their official location. The map shows pins for all geocoded locations with the official location visually highlighted, allowing staff to compare provider results spatially.

**Why this priority**: Viewing a voter's full details is the primary reason to search. This page is the central hub that connects registration data, geocoding, and district information.

**Independent Test**: Can be fully tested by navigating to a voter's detail page (directly via URL or from search) and verifying all sections render correctly with the voter's data. Delivers value as a read-only voter profile view.

**Acceptance Scenarios**:

1. **Given** a voter exists in the system, **When** a user navigates to that voter's detail page, **Then** the page displays the voter's name, address, county, voter ID, registration date, and status.
2. **Given** a voter has geocoded locations, **When** the detail page loads, **Then** all geocoded locations are displayed in a tabular list showing the provider name, confidence score, formatted address, and coordinates, and on a map as location pins.
3. **Given** a voter has an official (primary) geocoded location set, **When** the detail page loads, **Then** the official location is visually distinguished from other locations in both the list (e.g., highlighted or labeled) and on the map (e.g., distinct pin color or size).
4. **Given** a voter has an official location with district assignments, **When** the detail page loads, **Then** all overlapping districts are displayed (county, precinct, congressional, state senate, state house, commission, school district).
5. **Given** a voter has no geocoded locations, **When** the detail page loads, **Then** the geocoding section displays a message indicating no locations are available. (Note: the geocode trigger button in this empty state is delivered by User Story 3.)
6. **Given** a voter has no official location set, **When** the detail page loads, **Then** the district assignments section indicates that districts cannot be determined until an official location is selected.

---

### User Story 3 — Trigger Geocoding & View Provider Results (Priority: P3)

An admin or analyst is reviewing a voter's detail page and needs to geocode (or re-geocode) the voter's registration address to obtain geographic coordinates. They click a "Geocode" button, which sends the voter's address to all available geocoding providers. Once complete, the results from each provider appear side by side, showing the provider name, formatted address, coordinates, and a confidence score. The staff member can compare results to determine which is most accurate.

**Why this priority**: Geocoding is the prerequisite for assigning districts. Showing provider results side by side gives staff the transparency needed to verify geocoding quality.

**Independent Test**: Can be fully tested by triggering geocoding for a voter and verifying that results from multiple providers appear with the expected fields. Delivers value by enabling staff to obtain and compare geocoding results.

**Acceptance Scenarios**:

1. **Given** an admin or analyst is on a voter's detail page, **When** they click the "Geocode" button, **Then** the system sends the voter's address for geocoding and displays a loading indicator while processing.
2. **Given** geocoding has completed, **When** results are returned, **Then** each provider's result is displayed showing provider name, formatted address, latitude/longitude, and confidence score.
3. **Given** a viewer-role user is on a voter's detail page, **Then** the "Geocode" button is not displayed (read-only access).
4. **Given** geocoding is already in progress for this voter, **When** the user views the page, **Then** the system shows a progress indicator and disables the geocode button until processing is complete.
5. **Given** a geocoding provider returns an error or no result, **When** results are displayed, **Then** the system indicates which providers failed or returned no match, alongside any successful results.

---

### User Story 4 — Select Official Location (Priority: P4)

An admin or analyst has reviewed the geocoded results for a voter and needs to designate one as the official location — the coordinate used for district assignment. They select one of the available geocoded locations by clicking a "Set as Official" action next to it. The system marks that location as the primary location, triggers a district assignment update, and refreshes the district assignments section on the page.

**Why this priority**: Selecting the official location is the bridge between geocoding and district assignment. It is the key decision point that determines a voter's district picture.

**Independent Test**: Can be fully tested by setting a geocoded location as official and verifying the district assignments update accordingly. Delivers value by giving staff control over which coordinate drives district assignment.

**Acceptance Scenarios**:

1. **Given** a voter has multiple geocoded locations and the user is an admin or analyst, **When** the user clicks "Set as Official" on a location, **Then** that location is marked as the official location and visually distinguished from other locations.
2. **Given** an official location has just been set, **When** the update succeeds, **Then** the district assignments section refreshes automatically to reflect the districts for the new official location.
3. **Given** a voter already has an official location, **When** the user sets a different location as official, **Then** the previous official location loses its designation and the new one takes its place.
4. **Given** a viewer-role user, **Then** the "Set as Official" action is not available.
5. **Given** an error occurs while setting the official location, **When** the operation fails, **Then** the system displays an error notification and the previous official location remains unchanged.

---

### User Story 5 — Remove Geocoded Location (Priority: P5)

An admin or analyst notices a stale or incorrect geocoded location on a voter's detail page and needs to remove it. They click a "Remove" action on the location. The system asks for confirmation, then deletes the location and refreshes the list.

**Why this priority**: Removing incorrect locations is important for data hygiene but is less frequently used than the core search, view, geocode, and select workflows.

**Independent Test**: Can be fully tested by removing a geocoded location from a voter and verifying it disappears from the list. Delivers value by allowing staff to maintain clean geocoding data.

**Acceptance Scenarios**:

1. **Given** a voter has a geocoded location and the user is an admin or analyst, **When** the user clicks "Remove" on a location, **Then** a confirmation prompt appears asking the user to confirm the deletion.
2. **Given** the user confirms the deletion, **When** the removal succeeds, **Then** the location is removed from the list and a success notification is displayed.
3. **Given** the user cancels the confirmation, **Then** the location remains unchanged.
4. **Given** the location being removed is the current official location, **When** it is removed, **Then** the district assignments section updates to indicate that no official location is set and districts cannot be determined.
5. **Given** a viewer-role user, **Then** the "Remove" action is not available.

---

### Edge Cases

- What happens when a voter's registration address is incomplete or malformed? The geocoding step may return no results from any provider. The system should display a clear message that no providers could geocode the address.
- What happens when a voter has only one geocoded location and it is removed? The voter returns to a state with no geocoded locations and no district assignments. The detail page reflects this clearly.
- What happens when the user searches with very common names (e.g., "John Smith") that return thousands of results? Pagination ensures only a manageable number of results are shown per page. The system encourages narrowing results with filters.
- What happens when a voter's official location falls outside all known district boundaries? The district assignments section shows that no matching districts were found for that location.
- What happens when multiple filters are applied simultaneously? Filters combine with AND logic — results must match all active filters.
- What happens when the user navigates directly to a voter detail page via URL for a voter that does not exist? The system displays a "Voter not found" error page.
- What happens if network connectivity is lost during geocoding? The system displays an error notification and allows the user to retry.

## Requirements *(mandatory)*

### Functional Requirements

**Search & Browse**

- **FR-001**: System MUST provide a voter search page accessible to all authenticated users via a top-level "Voters" navigation item.
- **FR-002**: System MUST accept a text query and return voters whose names match (full or partial).
- **FR-003**: System MUST display search results in a paginated, sortable table with columns: name, county, voter ID, registration date, and status.
- **FR-004**: System MUST provide filter controls for county, voter status, and district (two-level cascade: select district type first, then specific district), populated dynamically from the data.
- **FR-005**: System MUST support sorting by name, county, registration date, and voter ID in ascending and descending order.
- **FR-006**: System MUST persist search query, filters, sort order, and page in URL query parameters, enabling bookmarking, sharing, and browser back/forward navigation.
- **FR-007**: System MUST display an empty state message when no results match the current query and filters.

**Voter Detail**

- **FR-008**: System MUST provide a voter detail page showing registration information: name, address, county, voter ID, registration date, and status.
- **FR-009**: System MUST display all geocoded locations for a voter in a tabular list (provider name, confidence score, formatted address, coordinates) and on a map as location pins.
- **FR-010**: System MUST visually distinguish the official (primary) geocoded location from other locations in both the list and on the map (e.g., distinct pin color or size).
- **FR-011**: System MUST display district assignments based on the voter's official location, including all overlapping boundary types (county, precinct, congressional, state senate, state house, commission, school district).
- **FR-012**: System MUST indicate when a voter has no geocoded locations or no official location, explaining that district assignments cannot be determined.

**Geocoding**

- **FR-013**: System MUST allow admin and analyst users to trigger geocoding for a voter's registration address.
- **FR-014**: System MUST display a loading indicator while geocoding is in progress.
- **FR-015**: System MUST display results from all geocoding providers, including those that returned errors or no match.

**Official Location Selection**

- **FR-016**: System MUST allow admin and analyst users to set any geocoded location as the official (primary) location.
- **FR-017**: System MUST automatically refresh district assignments after the official location changes.
- **FR-018**: System MUST display an error notification and preserve the previous state if setting the official location fails.

**Location Removal**

- **FR-019**: System MUST allow admin and analyst users to remove geocoded locations from a voter.
- **FR-020**: System MUST require confirmation before removing a geocoded location.
- **FR-021**: System MUST update district assignments (or clear them) if the removed location was the official location.

**Access Control**

- **FR-022**: All voter search and detail pages MUST require authentication.
- **FR-023**: Only admin and analyst users MUST be able to trigger geocoding, set official locations, and remove locations.
- **FR-024**: Viewer-role users MUST have read-only access — they can search and view but cannot modify geocoding data.

### Key Entities

- **Voter**: A registered voter with a name, registration address, county, voter ID, registration date, and status (e.g., Active, Inactive). A voter can have zero or more geocoded locations and zero or one official location.
- **Geocoded Location**: A geographic coordinate (latitude/longitude) derived from a voter's registration address by a specific geocoding provider. Includes a confidence score, formatted address, and provider name. One location per voter may be designated as the official (primary) location.
- **District Assignment**: A boundary district (county, precinct, congressional, state senate, state house, commission, school district) that overlaps with a voter's official geocoded location. Assignments are determined by spatial analysis and update when the official location changes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Staff can find a specific voter by name within 10 seconds, including typing the query, reviewing results, and clicking through to the detail page.
- **SC-002**: Search results display within 2 seconds of submitting a query, even for common names returning hundreds of matches.
- **SC-003**: Filter and sort interactions update results within 1 second without requiring a full page reload.
- **SC-004**: Staff can complete the full geocoding workflow (trigger geocode, review results, select official location) in under 30 seconds.
- **SC-005**: District assignments refresh within 2 seconds of changing the official location.
- **SC-006**: 95% of staff can complete a voter lookup (search, find, and view details) on their first attempt without assistance.
- **SC-007**: All write operations (geocode, set official, remove location) are restricted to admin and analyst roles; viewer-role users see only read-only interfaces with no disabled or hidden action buttons leaking through.

## Assumptions

- The backend API already provides (or will provide) endpoints for voter search with pagination, filtering, and sorting. The frontend consumes these endpoints.
- Geocoding is performed server-side by the backend — the frontend triggers the operation and displays results. The frontend does not call geocoding services directly.
- District assignment (spatial intersection) is performed server-side when the official location changes. The frontend displays the resulting assignments.
- Filter options (counties, statuses, district types/names) are provided by the backend via dedicated endpoints or as facets in the search response.
- The search box uses a debounced input pattern (search triggers after the user stops typing for a short delay) rather than requiring a manual submit action. This follows common web search conventions.
- Pagination defaults to 25 results per page, consistent with standard data table conventions.
- The existing authentication and role-based access control system is reused without modification.
