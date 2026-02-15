# Feature Specification: Live Election Results Visualization

**Feature Branch**: `002-election-results`
**Created**: 2026-02-15
**Status**: Draft
**Input**: User description: "We need a way to visualize and review live election results in the web interface. This would include both geospatial mapping (like votes per county or precinct, or precincts/counties reported) and text data similar to the demographics drawer that exists now. Admin functions will be needed as well."

## Clarifications

### Session 2026-02-15

- Q: Where should the public elections section appear in the app navigation? → A: New top-level nav item "Elections" linking to a dedicated `/elections` route with its own map and drawer, separate from the existing home map page.
- Q: Can an election contain multiple races/contests, or does each election represent a single race? → A: Multiple races per election. An election (e.g., "Nov 2024 General") contains many races/contests. Requires a race selection step within each election.
- Q: Should the precinct results view include text search for precincts (as shown on the SOS page), or is the county filter sufficient? → A: County filter only. Text-based precinct search is deferred; users filter precincts by county on the map.
- Q: Should the app display a result certification status (Unofficial/Official) separate from election status? → A: Yes, as a display label. Active elections show "Unofficial Results" badge; finalized elections show "Official Results". Mapped from existing status — no new data field needed.
- Q: How should vote method breakdowns be presented in the results drawer? → A: Collapsible per candidate. Each candidate row has an expandable section for vote method breakdown (progressive disclosure).
- Q: What filtering should be available for the race list within an election? → A: Text search + category filter. Search bar to find races by name/district, plus category grouping/filter (e.g., Federal, State Senate, State House, Local).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and Select Elections (Priority: P1)

A user clicks the "Elections" item in the main navigation bar (a new top-level nav item) and is taken to a dedicated elections list page at `/elections`. They see a list of available elections and can filter by type (general, primary, special, runoff), status (active, finalized), and date range. They select an election to view its races. Each election contains multiple races/contests (e.g., US Senate, State House District 5, etc.). The user selects a specific race to view its results on a dedicated race results page with its own map and drawer, separate from the home map. The navigation hierarchy is: Elections list → Election detail (race list) → Race results (map + drawer).

**Why this priority**: Users must first be able to discover and select an election and race before viewing any results. This is the entry point for the entire feature and delivers immediate value by making election data accessible.

**Independent Test**: Can be fully tested by clicking the "Elections" nav item, verifying the list loads at `/elections` with filtering controls, selecting an election to confirm navigation to the race list view, and selecting a race to confirm navigation to the race results page.

**Acceptance Scenarios**:

1. **Given** the user navigates to the elections section, **When** the page loads, **Then** a list of elections is displayed showing each election's name, date, type, status, and overall reporting progress.
2. **Given** elections are listed, **When** the user applies a filter (e.g., type = "general"), **Then** only elections matching the filter criteria are shown.
3. **Given** elections are listed, **When** the user selects an election, **Then** they are navigated to the election detail page showing a list of races/contests within that election, each displaying the race name, district, number of candidates, seat count, and reporting progress.
4. **Given** the race list is displayed, **When** the user types in the search bar, **Then** the race list filters to show only races matching the search text (by name or district).
5. **Given** the race list is displayed, **When** the user selects a category filter (e.g., "State Senate"), **Then** only races in that category are shown.
6. **Given** the race list is displayed, **When** the user selects a race, **Then** they are navigated to the race results view with the map and drawer for that specific race.
7. **Given** no elections match the active filters, **When** the user views the list, **Then** an appropriate empty state message is displayed.

---

### User Story 2 - View Race Results on a County Map (Priority: P1)

A user viewing a specific race's results page sees a choropleth map of the state (or relevant geographic scope) with counties colored to represent election data for that race. The default map visualization shows vote share by leading candidate per county. The user can switch the map's data layer to show alternative metrics such as precincts reporting percentage or total votes cast per county. Hovering over a county shows a tooltip with key figures. The race name, district, and "Vote for N" seat count are displayed prominently.

**Why this priority**: Geospatial visualization is the primary way users will consume election results at a glance. The county-level map provides the most impactful "big picture" view and is core to the feature's value proposition.

**Independent Test**: Can be fully tested by selecting an election and race, verifying the map renders with colored county overlays, hovering to confirm tooltips appear, and toggling map layers to confirm the visualization updates.

**Acceptance Scenarios**:

1. **Given** the user is on a race results page with county results available, **When** the page loads, **Then** a choropleth map displays all relevant counties colored by the leading candidate's party using a distinguishable color scheme, with the race name and district displayed.
2. **Given** the county map is displayed, **When** the user hovers over a county, **Then** a tooltip shows the county name, precincts reporting vs. participating, and each candidate's vote count and percentage for that race.
3. **Given** the county map is displayed, **When** the user selects a different data layer (e.g., "Precincts Reporting %"), **Then** the map recolors counties based on the selected metric using an appropriate color scale.
4. **Given** the county map is displayed, **When** the user clicks on a county, **Then** the results drawer opens showing detailed results for that specific county within the current race.

---

### User Story 3 - Review Detailed Race Results in a Drawer (Priority: P1)

A user views detailed race result data in a bottom drawer panel (following the existing demographics drawer pattern). The drawer shows race-wide summary results by default and can show county-specific results when a county is selected. Data includes candidate names, party affiliations, vote counts, vote percentages, and vote method breakdowns (e.g., Election Day, Absentee, Advance Voting). The race name, district, and seat count ("Vote for N") are displayed at the top of the drawer.

**Why this priority**: The drawer provides the detailed text-based data that complements the map visualization. Users need both the visual overview (map) and the detailed numbers (drawer) to fully understand election results.

**Independent Test**: Can be fully tested by opening a race results page, tapping the drawer trigger, verifying race-wide results appear with all candidate data, then clicking a county on the map and verifying county-specific results appear in the drawer.

**Acceptance Scenarios**:

1. **Given** the user is on a race results page, **When** the page loads, **Then** a bottom drawer trigger button is visible (matching the existing demographics drawer pattern).
2. **Given** the drawer trigger is visible, **When** the user opens the drawer, **Then** race-wide results are displayed showing the race name, district, seat count, and each candidate's name, party, vote count, vote percentage, and a visual bar indicating relative vote share.
3. **Given** the drawer is open showing race-wide results, **When** vote method breakdowns are available, **Then** each candidate row has a collapsible/expandable section showing votes by method (e.g., Election Day, Absentee, Advance Voting). Method breakdowns are collapsed by default for a clean initial view.
4. **Given** a county is selected (via map click), **When** the drawer updates, **Then** it shows that county's specific results for the current race, including county name, precincts reporting/participating, and per-candidate results.
5. **Given** the drawer is open, **When** the user taps the close button, **Then** the drawer collapses back to the trigger bar.

---

### User Story 4 - View Precinct-Level Results Map (Priority: P2)

A user wants more granular detail for a specific race and switches to a precinct-level map view. The map displays precinct boundaries colored by leading candidate or reporting status for the current race. Because precinct data can be large, the user can filter by county to reduce the data load.

**Why this priority**: Precinct-level data provides the most granular view of election results but is secondary to the county-level overview. It adds depth for power users who need precinct-by-precinct analysis.

**Independent Test**: Can be fully tested by selecting an election and race, switching to precinct view, verifying precinct boundaries render, filtering by county, and confirming the filtered view loads correctly.

**Acceptance Scenarios**:

1. **Given** the user is on a race results page, **When** they switch to the precinct map view, **Then** precinct boundaries are rendered on the map colored by leading candidate for that race.
2. **Given** the precinct map is displayed, **When** the user selects a county filter, **Then** only precincts within that county are shown, reducing visual clutter and load time.
3. **Given** the precinct map is displayed, **When** the user hovers over a precinct, **Then** a tooltip shows the precinct identifier, reporting status, and candidate vote counts for the current race.

---

### User Story 5 - Live Auto-Refresh During Active Elections (Priority: P2)

During an active election, results update automatically without requiring the user to manually refresh the page. A status indicator shows the last refresh time and the next expected refresh. The user can see results update in near-real-time as new precincts report.

**Why this priority**: Auto-refresh is essential for the "live" aspect of the feature during election night, but it builds on top of the core results display. It enhances the experience without being required for basic results viewing.

**Independent Test**: Can be fully tested by viewing an active election, verifying the last-refreshed timestamp updates periodically, and confirming that map colors and drawer data reflect updated results without manual page refresh.

**Acceptance Scenarios**:

1. **Given** the user is viewing an active election, **When** the backend refreshes results, **Then** the map and drawer data update automatically to reflect new data.
2. **Given** the user is viewing an active election, **When** they look at the status area, **Then** they see the last refresh timestamp and a visual indicator that results are live.
3. **Given** the user is viewing a finalized election, **When** the page loads, **Then** no auto-refresh occurs and a "Final Results" indicator is displayed instead.
4. **Given** the user is viewing an active election, **When** a network error occurs during refresh, **Then** the last known data remains displayed with a non-intrusive warning that refresh failed.

---

### User Story 6 - Admin: Create a New Election (Priority: P2)

An admin user navigates to the admin elections management page and creates a new election by providing its name, date, type, data source URL, and optionally a refresh interval. The data source URL points to the SOS results endpoint which returns all races for that election in a single payload; the backend parses individual races automatically on refresh. A confirmation step is shown before the election is created, following the established two-step confirmation pattern used in other admin operations.

**Why this priority**: Admins need to set up elections in the system before any results can be ingested or viewed. This is the foundational admin operation that enables all other election functionality.

**Independent Test**: Can be fully tested by logging in as an admin, navigating to the admin elections page, filling out the create election form, confirming the submission, and verifying the new election appears in the list.

**Acceptance Scenarios**:

1. **Given** an admin user navigates to the admin elections management page, **When** the page loads, **Then** a list of all elections is displayed with their name, date, type, status, last refresh time, and reporting progress.
2. **Given** the admin elections list is displayed, **When** the admin clicks the "Create Election" button, **Then** a form is presented with fields for name, election date, election type (dropdown: general, primary, special, runoff), data source URL, and refresh interval (optional, defaults to 120 seconds, minimum 60 seconds). Races are not created manually — they are parsed from the data source on first refresh.
3. **Given** the admin has filled out the create election form with valid data, **When** they submit the form, **Then** a confirmation dialog displays the election details for review before final submission.
4. **Given** the admin confirms the creation, **When** the election is successfully created, **Then** a success notification is shown and the admin is returned to the elections list with the new election visible.
5. **Given** the admin submits the form with invalid data (e.g., missing required fields, refresh interval below 60 seconds), **When** they attempt to submit, **Then** validation errors are displayed inline on the form.

---

### User Story 7 - Admin: Update and Manage an Existing Election (Priority: P2)

An admin user can update an existing election's details, change its status between active and finalized, and manually trigger a data refresh. These actions allow admins to manage the election lifecycle from setup through finalization.

**Why this priority**: After creating an election, admins need to manage its lifecycle — updating the data source, adjusting refresh intervals, finalizing results, and manually refreshing when needed. These are essential operational controls.

**Independent Test**: Can be fully tested by navigating to an existing election's admin detail page, editing fields, changing status, triggering a manual refresh, and verifying each change persists and is reflected in the UI.

**Acceptance Scenarios**:

1. **Given** an admin is on the elections management list, **When** they click on an election, **Then** an election detail/edit view is displayed showing all editable fields (name, data source URL, status, refresh interval).
2. **Given** the admin is viewing an election's detail, **When** they modify a field and save, **Then** the changes are persisted and a success notification is shown.
3. **Given** the admin is viewing an active election, **When** they change the status to "finalized", **Then** a confirmation dialog warns that finalized elections stop auto-refreshing, and upon confirmation the status is updated.
4. **Given** the admin is viewing an active election, **When** they click "Refresh Now", **Then** a manual refresh is triggered, a loading indicator is shown, and upon completion a success notification displays the number of precincts reporting and counties updated.
5. **Given** the admin attempts to refresh a finalized election, **When** they click "Refresh Now", **Then** the button is disabled or hidden with an indication that finalized elections cannot be refreshed.

---

### Edge Cases

- What happens when an election has no results yet (newly created, no data ingested)? Display an empty state indicating results are not yet available with the election date and status.
- What happens when county GeoJSON boundaries are not available for a county referenced in results? Display results in text form in the drawer; the county appears in the results list but is not rendered on the map.
- What happens when precinct GeoJSON data is unavailable? The precinct map view shows a message that precinct boundaries are not available for this election, with the county-level map remaining accessible.
- How does the system handle an election with zero precincts participating? Display the election metadata but show "No reporting data available" in place of results.
- What happens if the user's network is slow or disconnected during auto-refresh? Continue showing the last successfully loaded data with a subtle connectivity warning; resume refreshing when connectivity is restored.
- What happens when a county has partial results (some precincts reporting, others not)? Display available data and clearly indicate reporting progress (e.g., "12 of 45 precincts reporting").
- What happens when an admin tries to create an election with a duplicate name and date? Display a validation error from the backend indicating the election already exists.
- What happens when a manual refresh is triggered but the data source URL is unreachable? Display an error notification indicating the refresh failed with the reason, and leave existing data intact.
- What happens when a non-admin user attempts to access the admin elections management page? The existing admin route protection redirects them with an appropriate permission error, consistent with other admin pages.
- What happens when an election has a large number of races (e.g., general election with 50+ contests)? The race list on the election detail page supports scrolling/pagination and optional search/filtering by race name or district to help users find a specific race quickly.
- What happens when an election has been created but not yet refreshed (no races parsed)? Display an empty state on the election detail page indicating that no races are available yet, prompting the admin to trigger an initial data refresh.

## Requirements *(mandatory)*

### Functional Requirements

**Public Election Viewing:**

- **FR-001**: System MUST provide a top-level "Elections" navigation item visible to all users (authenticated and unauthenticated) that links to a dedicated elections list page at `/elections`.
- **FR-002**: System MUST display a browsable, filterable list of elections showing name, date, type, status, and overall reporting progress.
- **FR-003**: System MUST support filtering elections by status, election type, and date range.
- **FR-003a**: System MUST display a list of races/contests within a selected election, showing race name, district, number of candidates, seat count, and per-race reporting progress. The election detail page is at `/elections/$electionId`.
- **FR-003b**: The race list MUST support text search (filtering by race name or district) and category filtering (e.g., Federal, State Senate, State House, Local) to help users navigate elections with many races.
- **FR-004**: System MUST display a choropleth map of counties colored by race result data when viewing a specific race within an election, on a dedicated race results page with its own map instance (separate from the home map). The race results page is at `/elections/$electionId/races/$raceId`.
- **FR-005**: System MUST allow users to switch the map's data layer between at least: leading candidate (by party color), precincts reporting percentage, and total votes cast.
- **FR-006**: System MUST show a tooltip on county hover displaying county name, reporting progress, and per-candidate vote summary for the current race.
- **FR-007**: System MUST display detailed race results in a bottom drawer panel following the established demographics drawer pattern (trigger button, scrollable content, close button).
- **FR-008**: The results drawer MUST show race-wide summary results including the race name, district, seat count ("Vote for N"), and each candidate's name, party affiliation, vote count, vote percentage, and a visual indicator of relative share.
- **FR-009**: The results drawer MUST show vote method breakdowns (e.g., Election Day, Absentee, Advance) as a collapsible section per candidate row (collapsed by default), using progressive disclosure so users expand only the candidates they want to inspect.
- **FR-010**: System MUST update the drawer to show county-specific results for the current race when a county is selected on the map.
- **FR-011**: System MUST support a precinct-level map view with precincts colored by leading candidate, filterable by county. No text-based precinct search is required in this version; county filtering is the primary discovery mechanism.
- **FR-012**: System MUST auto-refresh election results data at the election's configured refresh interval while the election status is active.
- **FR-013**: System MUST display the last refresh timestamp, a live/final status indicator, and a prominent certification badge: "Unofficial Results" for active elections, "Official Results" for finalized elections.
- **FR-014**: System MUST stop auto-refreshing when the election status is finalized and display the "Official Results" badge instead of the live indicator.
- **FR-015**: System MUST paginate the elections list to handle large numbers of elections.
- **FR-016**: System MUST handle error states gracefully, showing the last known good data when refreshes fail and displaying appropriate empty states when no data is available.

**Admin Election Management:**

- **FR-017**: Admin users MUST be able to view a management list of all elections within the admin section, showing name, date, type, status, last refresh time, and reporting progress.
- **FR-018**: Admin users MUST be able to create a new election by providing name, election date, election type, data source URL, and optional refresh interval. Races are automatically parsed from the data source on first refresh — admins do not create races manually.
- **FR-019**: The election creation form MUST validate all required fields and enforce constraints (refresh interval minimum 60 seconds, valid URL format, election type from allowed values).
- **FR-020**: Election creation MUST use a two-step confirmation dialog showing election details before final submission, consistent with the existing admin confirmation pattern.
- **FR-021**: Admin users MUST be able to update an existing election's name, data source URL, status, and refresh interval.
- **FR-022**: Changing an election's status to "finalized" MUST require confirmation, warning that auto-refresh will stop.
- **FR-023**: Admin users MUST be able to manually trigger a data refresh for an active election, with feedback showing the number of precincts reporting and counties updated.
- **FR-024**: Manual refresh MUST be unavailable for finalized elections.
- **FR-025**: Admin election management pages MUST be protected by the same role-based access control used by other admin pages (admin and analyst roles only).
- **FR-026**: All admin election operations MUST provide toast notifications for success, validation errors, and failure states, consistent with existing admin patterns.

### Key Entities

- **Election**: A specific electoral event with a name, date, type (general/primary/special/runoff), status (active/finalized), data source URL, refresh interval, and overall reporting progress. Contains multiple races/contests parsed from the data source.
- **Race (Contest)**: A single contest within an election (e.g., "State Senate District 18", "US Senate"). Includes race name, district/scope, seat count ("Vote for N"), and its own set of candidates and results. Races are automatically parsed from the SOS data source — not created manually by admins.
- **Candidate Result**: An individual candidate's outcome within a specific race, including name, party affiliation, ballot order, total vote count, and per-method vote breakdowns.
- **County Result**: Race results aggregated at the county level, including county name, local reporting progress (precincts reporting/participating), and per-candidate results within that county for a specific race.
- **Precinct Result**: Race results at the individual precinct level, including geographic boundaries and per-candidate results (available via GeoJSON).
- **Vote Method Result**: A breakdown of votes by method of voting (e.g., Election Day, Absentee, Advance Voting) for a given candidate, identified by group name and vote count.

## Assumptions

- The backend election API uses a single-race-per-election model — each API `Election` record represents one race/contest with its own data source URL. Multiple races on the same date are stored as separate election records. The frontend groups elections by `election_date` to present the multi-race "election event" UX. See `specs/002-election-results/research.md` §1 for the full architectural bridge.
- County boundary GeoJSON data for the map is already available in the application (either cached at build time or fetched from the boundaries API), and county names in election results can be matched to existing county boundaries.
- Precinct boundary GeoJSON is served by the backend's dedicated precinct GeoJSON endpoint and may require on-demand fetching due to data size.
- The existing demographics drawer pattern (vaul-based bottom drawer with trigger button) will be reused for visual and interaction consistency.
- Party colors for candidates follow a standard political color scheme (e.g., red for Republican, blue for Democrat) with a neutral/distinct color for other parties.
- The refresh interval for auto-polling is determined by the election's `refresh_interval_seconds` field (minimum 60 seconds).
- Elections with no results data yet will still appear in the list but show an appropriate empty state on their detail page.
- Admin election management pages follow the same route structure (`/admin/elections/*`), access control, API patterns, error handling, and two-step confirmation patterns already established by the existing admin features (users, imports, exports).
- The election results section is a dedicated area of the application with its own top-level nav item ("Elections"), separate routes (`/elections`, `/elections/$electionDate`, `/elections/$electionDate/$electionId`), and its own map instance — independent from the existing home page map and demographics drawer. The `$electionDate` segment groups races by date; the `$electionId` is the API election UUID for a specific race.
- The election results page is publicly accessible (no authentication required to view results), consistent with the API's public endpoints. The "Elections" nav item is visible to all users regardless of authentication status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can find and select a specific election from the list in under 15 seconds, including applying filters.
- **SC-002**: The county choropleth map renders with all county results visible within 3 seconds of opening a race results page.
- **SC-003**: Users can identify the leading candidate in any county within 2 seconds by visual inspection of the map.
- **SC-004**: The results drawer displays complete race-wide candidate results (names, parties, votes, percentages) in a single scroll view.
- **SC-005**: During an active election, result updates appear on screen within one refresh interval without any manual user action.
- **SC-006**: Users can switch between county and precinct map views and between map data layers without page reload, within 2 seconds per switch.
- **SC-007**: All election data shown in the interface matches the data returned by the backend API with 100% accuracy (no calculation or display errors).
- **SC-008**: The feature is usable on both desktop and mobile screen sizes, with the drawer and map adapting appropriately to the viewport.
- **SC-009**: Admin users can create a new election through the admin interface in under 2 minutes, including the confirmation step.
- **SC-010**: Admin users can update an election's status or trigger a manual refresh in under 30 seconds from the admin elections page.
- **SC-011**: All admin election operations provide clear feedback (success or error) within 3 seconds of user action.
