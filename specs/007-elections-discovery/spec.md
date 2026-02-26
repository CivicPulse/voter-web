# Feature Specification: Elections Discovery and Details Redesign

**Feature Branch**: `007-elections-discovery`
**Created**: 2026-02-25
**Status**: Draft
**Input**: User description: "Redesign the elections list UI from a date-based drill-down navigation to a traditional searchable list view showing election name, date, and short description. Add a new 'Election Information' tab to the election details page that displays comprehensive election data including candidates, eligibility requirements, geographic area, and other metadata. Make Election Information the default tab until results are available, then switch to Results as the default."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and Search Elections (Priority: P1)

A voter visits the elections page and sees a searchable list of all elections. Each list entry shows the election name, date, and a short description summarizing the race (e.g., "General election — U.S. Senate"). The voter can type into a search box to filter elections by name, district, or description. They can also filter by status and election type. The list is paginated and sorted by date (newest first). Clicking an election navigates directly to that election's detail page.

**Why this priority**: This is the core navigation change. The current date-based drill-down requires voters to know *when* an election occurred before they can find it. A searchable flat list lets voters find elections by what they know — the race name, district, or type — dramatically reducing the steps to discovery.

**Independent Test**: Can be fully tested by navigating to `/elections/`, seeing a list of elections with name/date/description, searching by keyword, filtering by status/type, and clicking through to a detail page. Delivers immediate value by making election discovery faster and more intuitive.

**Acceptance Scenarios**:

1. **Given** a voter navigates to the elections page, **When** the page loads, **Then** they see a list of elections where each entry shows the election name, date, and short description, sorted by date (newest first).
2. **Given** a voter is on the elections page, **When** they type "Senate" into the search box, **Then** the list filters to show only elections whose name, district, or description contains "Senate".
3. **Given** a voter is on the elections page, **When** they select "Active" from the status filter, **Then** only elections currently receiving live results are shown.
4. **Given** a voter is on the elections page, **When** they select "Primary" from the election type filter, **Then** only primary elections are shown.
5. **Given** a voter is on the elections page, **When** they click on an election in the list, **Then** they are navigated directly to that election's detail page (no intermediate date-based race list).

---

### User Story 2 - View Election Information (Priority: P1)

A voter clicks on an election and sees an "Election Information" tab on the detail page. This tab displays comprehensive details: the candidates running (name and party affiliation), eligibility requirements (who can vote in this election), the geographic area the election covers, and election metadata (date, type, status). For elections without results yet, this tab is shown by default, giving voters everything they need to understand the election.

**Why this priority**: This is equally critical to the list redesign. Currently the detail page only shows results and participation — there is no place to learn about candidates, eligibility, or coverage area. This tab fills that gap and becomes the primary landing experience for upcoming elections.

**Independent Test**: Can be fully tested by navigating to an election detail page, viewing the Election Information tab, and verifying it displays candidates, eligibility, geographic area, and metadata.

**Acceptance Scenarios**:

1. **Given** a voter navigates to an election detail page, **When** the page loads, **Then** an "Election Information" tab is visible alongside the existing Results and Participation tabs.
2. **Given** a voter is viewing the Election Information tab, **When** they look at the candidates section, **Then** they see a list of candidates with their names and party affiliations.
3. **Given** a voter is viewing the Election Information tab, **When** they look at the eligibility section, **Then** they see a description of who is eligible to vote (e.g., "Registered voters in State Senate District 42").
4. **Given** a voter is viewing the Election Information tab, **When** they look at the geographic area section, **Then** they see the district name the election covers (e.g., "State Senate District 18").
5. **Given** a voter is viewing the Election Information tab, **When** they look at the metadata section, **Then** they see the election date, election type, status, and data source (if available).

---

### User Story 3 - Intelligent Default Tab Based on Results Availability (Priority: P2)

When a voter arrives at an election detail page, the system automatically selects the most relevant tab. For elections without results, the Election Information tab is shown by default. For elections with active or finalized results, the Results tab is shown by default. Voters can always manually switch to any tab, and URL-based tab selection overrides the automatic default.

**Why this priority**: This builds on the Election Information tab (P1) by adding intelligent default behavior. It ensures voters see the most time-sensitive information first — results when available, election context when not — without requiring them to manually navigate.

**Independent Test**: Can be fully tested by navigating to elections at different lifecycle stages (no results, active results, finalized results) and verifying the correct default tab is selected each time.

**Acceptance Scenarios**:

1. **Given** a voter navigates to an election that has no results, **When** the detail page loads, **Then** the "Election Information" tab is selected by default.
2. **Given** a voter navigates to an election that has active (live) results, **When** the detail page loads, **Then** the "Results" tab is selected by default.
3. **Given** a voter navigates to an election that has finalized results, **When** the detail page loads, **Then** the "Results" tab is selected by default.
4. **Given** a voter is on any tab, **When** they click a different tab, **Then** that tab is displayed regardless of the automatic default.
5. **Given** a voter opens a URL with a specific tab parameter (e.g., `?tab=info`), **When** the page loads, **Then** the specified tab is shown regardless of the automatic default logic.

---

### User Story 4 - Admin Candidate Management (Priority: P2)

An admin navigates to an election's detail page and can create, edit, and delete candidates for that election. The admin can set candidate details (name, party, bio, photo URL, ballot order, filing status, incumbent flag) and manage external links (website, social media, campaign pages).

**Why this priority**: Admin candidate CRUD is needed to populate the Election Information tab with candidate data before results are available. Without it, the Candidates API has no data to serve.

**Independent Test**: Can be tested by logging in as an admin, navigating to an election, creating a candidate with links, editing candidate fields, and deleting a candidate. Verify the voter-facing Election Information tab reflects the changes.

**Acceptance Scenarios**:

1. **Given** an admin is on an election detail page, **When** they click "Add Candidate", **Then** a form is displayed to enter candidate details (name, party, bio, photo URL, ballot order, filing status, incumbent flag) with optional links.
2. **Given** an admin has filled out the candidate form, **When** they submit, **Then** the candidate is created via `POST /elections/{id}/candidates` and appears in the candidates list.
3. **Given** an admin views an existing candidate, **When** they click "Edit", **Then** the candidate's current details are pre-populated in a form for editing via `PATCH /candidates/{id}`.
4. **Given** an admin views an existing candidate, **When** they click "Delete" and confirm, **Then** the candidate is removed via `DELETE /candidates/{id}` (cascades links).
5. **Given** an admin is editing a candidate, **When** they add or remove an external link, **Then** the link is created via `POST /candidates/{id}/links` or removed via `DELETE /candidates/{id}/links/{link_id}`.

---

### Edge Cases

- What happens when an election has no candidates listed? The candidates section shows a message indicating candidates have not yet been announced.
- What happens when eligibility information is unavailable? The eligibility section shows a generic fallback (e.g., "Contact your local election office for eligibility details").
- What happens when a search query matches no elections? The list shows an empty state with a message like "No elections found matching your search" and a suggestion to clear filters.
- What happens when an election's results appear while a voter is on the Election Information tab? The voter remains on the Election Information tab (no forced tab switch). The default tab logic only applies on initial page load.
- What happens when the geographic context (state/county) is set from a previous page? The elections list shows all elections but visually highlights those relevant to the geographic context (e.g., badge or sort boost). A context banner (e.g., "Showing elections for Bibb County, GA") is displayed with a "Show all" affordance to clear the context.
- How are elections sorted when multiple elections share the same date? They are sorted secondarily by election name (alphabetical).
- What happens when the Candidates API request fails? The candidates section shows an inline error ("Unable to load candidates") with a retry button. The rest of the Election Information tab (eligibility, geographic area, key dates, metadata) renders normally.
- What happens when an admin tries to create a candidate with a duplicate name? The API returns 409; the form displays an inline error ("A candidate with this name already exists in this election").
- What happens when an admin deletes a candidate that has links? The API cascades the delete (removes links automatically); no additional client-side handling needed beyond confirmation dialog.
- What happens when a user navigates to `/candidates/{id}` for a deleted or nonexistent candidate? Show a 404 page with a link back to the elections list.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The elections list page MUST display elections as individual races/contests in a flat, searchable list rather than grouped by date with drill-down navigation.
- **FR-002**: Each election list entry MUST show the election name, election date (formatted for readability), and a short description.
- **FR-003**: The short description MUST use the API-provided `purpose` field when non-null. When `purpose` is null, fall back to client-side synthesis combining election type and district (e.g., "General — U.S. Senate", "Primary — State House District 42").
- **FR-004**: The elections list MUST support free-text search that filters the current page of results by election name, district, or description (client-side filtering). Server-side search is deferred to a future API enhancement.
- **FR-005**: The elections list MUST support filtering by election status (all, active, finalized).
- **FR-006**: The elections list MUST support filtering by election type (all, general, primary, special, runoff).
- **FR-007**: The elections list MUST be paginated with a default page size of 25 items, using server-side pagination from the API.
- **FR-022**: The elections list MUST support "Registration Open" and "Early Voting Now" toggle filters that use the API's `registration_open` and `early_voting_active` boolean query parameters respectively.
- **FR-008**: The elections list MUST default to sorting by date with newest elections first.
- **FR-009**: Clicking an election in the list MUST navigate directly to the election detail page.
- **FR-010**: The election detail page MUST include an "Election Information" tab alongside the existing Results and Participation tabs.
- **FR-011**: The Election Information tab MUST display a candidates section using the Candidates API (`GET /elections/{id}/candidates`) as the primary data source, showing each candidate's name, party affiliation, photo (when available, with initials avatar fallback derived from candidate name), and incumbent status. Candidates with non-"qualified" filing status (withdrawn, disqualified) MUST be shown with a status badge and visually dimmed. Write-in candidates MUST display a "Write-In" badge. When the Candidates API returns no items, fall back to candidate data from the results endpoint. When neither source has candidates, display a "Candidates not yet announced" message.
- **FR-012**: The Election Information tab MUST display an eligibility section using the API-provided `eligibility_description` field when non-null. When null, fall back to a district-derived description (e.g., "Registered voters in [district name]"). When neither is available, show a generic fallback message.
- **FR-013**: The Election Information tab MUST display a geographic area section showing the district name the election covers (from the `district` field). When `eligibility_description` contains jurisdiction details (e.g., county names), those are displayed in the Eligibility section (FR-012) rather than duplicated here.
- **FR-014**: The Election Information tab MUST display election metadata including date, election type, status, and data source URL (when available, rendered as an external link).
- **FR-021**: The Election Information tab MUST display a Key Dates section showing registration deadline, early voting start/end, absentee request deadline, and qualifying period start/end when available from the API. The section MUST be hidden entirely when all date fields are null.
- **FR-015**: When no results data exists for an election, the Election Information tab MUST be the default tab on page load.
- **FR-016**: When results data exists for an election (active or finalized), the Results tab MUST be the default tab on page load.
- **FR-017**: Users MUST be able to manually select any tab regardless of the default tab logic.
- **FR-018**: A URL tab parameter (e.g., `?tab=info`) MUST override the automatic default tab selection.
- **FR-019**: When geographic navigation context (state/county) is present, the elections list MUST visually highlight elections relevant to that context while still showing all elections. An election is considered relevant when its district name contains the context county or state name (case-insensitive substring match). Relevant elections MUST receive a subtle visual indicator (e.g., highlighted border or badge). A context banner MUST be displayed indicating the active context with an affordance to clear it.
- **FR-020**: The intermediate date-based race list page (`/elections/$electionDate/`) MUST be replaced by the new flat list. Old date-based URLs (`/elections/$electionDate/` and `/elections/$electionDate/$electionId`) MUST redirect to their new equivalents to preserve existing bookmarks and shared links.
- **FR-023**: Admin users MUST be able to create candidates for an election via a form that submits to `POST /elections/{id}/candidates`, including name (required), party, bio, photo URL, ballot order, filing status, incumbent flag, and optional links.
- **FR-024**: Admin users MUST be able to edit existing candidates via `PATCH /candidates/{id}` and delete candidates via `DELETE /candidates/{id}`.
- **FR-025**: Admin users MUST be able to add external links (`POST /candidates/{id}/links`) and remove links (`DELETE /candidates/{id}/links/{link_id}`) for any candidate. Link types: website, campaign, facebook, twitter, instagram, youtube, linkedin, other.
- **FR-026**: The admin candidate form MUST validate `full_name` uniqueness per election (handle 409 conflict response with user-friendly error message).
- **FR-027**: Admin candidate management UI MUST be rendered inline on the Election Information tab, with "Add Candidate", "Edit", and "Delete" controls visible only to users with `admin` role. Add and edit forms MUST use a shadcn Dialog (modal) overlay. No separate admin route is needed for candidate management.
- **FR-028**: Clicking a candidate name in the Election Information tab MUST navigate to a dedicated candidate detail page at `/candidates/{id}`.
- **FR-029**: The candidate detail page MUST display the candidate's full name, party, photo (when available, with initials avatar fallback), filing status badge, incumbent badge, bio, external links (typed by link_type), and election results data (vote count, political party) when available.
- **FR-030**: The candidate detail page MUST include a back-navigation link to the parent election's detail page.

### Key Entities

- **Election (Race/Contest)**: A specific race or contest. Key attributes: name, date, type (general/primary/special/runoff), district, status (active/finalized), candidates, geographic area, description (nullable), purpose (nullable), eligibility_description (nullable), registration_deadline (nullable), early_voting_start/end (nullable), absentee_request_deadline (nullable), qualifying_start/end (nullable).
- **Candidate**: A person running in an election. Key attributes: name, party affiliation, photo URL (nullable), ballot order (nullable), filing status (qualified/withdrawn/disqualified/write_in), incumbent flag, bio (nullable), external links (typed: website/campaign/social/other), result_vote_count (nullable), result_political_party (nullable), sos_ballot_option_id (nullable). Sourced from the Candidates API with fallback to results data. Has a dedicated detail page at `/candidates/{id}`.
- **Election Information**: A composite view combining election metadata, candidates, eligibility description, and geographic area into a unified informational display.

## Clarifications

### Session 2026-02-25

- Q: Should old date-based URLs (`/elections/$electionDate/` and `/elections/$electionDate/$electionId`) be removed or redirected? → A: Redirect old URLs to new equivalents (e.g., `/elections/2024-11-05/{id}` → `/elections/{id}`).
- Q: Should candidate data for pre-results elections require a backend API change, or gracefully degrade? → A: ~~Show candidates only when results data exists; show "not yet announced" message for elections without results. No backend API change required.~~ **Superseded** — see below.
- Q: Should geographic navigation context pre-filter or highlight elections in the list? → A: Highlight relevant elections visually but show the full list. A visible context banner with a "Show all" affordance keeps behavior transparent.
- Q: Should the Election Information tab use the new Candidates API or keep the results-only approach? → A: Use the Candidates API (`GET /elections/{id}/candidates`) as the primary source, showing full candidate details (name, party, photo, incumbent badge). Fall back to results data if the candidates endpoint returns empty.
- Q: Should the spec prefer API-provided text fields (`purpose`, `description`, `eligibility_description`) or always synthesize client-side? → A: Prefer API fields when non-null; fall back to client-side synthesis (type + district for description, district-derived text for eligibility).
- Q: Should the Election Information tab include a Key Dates section for registration deadline, early voting, absentee deadline, and qualifying period? → A: Yes. Show all available date fields in a Key Dates section; hide the section entirely if all date fields are null.
- Q: Should the elections list expose "Registration Open" and "Early Voting Now" as quick-filter options? → A: Yes. Add both as toggle/chip filters alongside existing status and type filters, using the API's `registration_open` and `early_voting_active` boolean params.
- Q: What should happen when the Candidates API fails while the rest of the election detail loads? → A: Show an inline error in the candidates section only ("Unable to load candidates") with a retry button; the rest of the Election Information tab renders normally.
- Q: Should admin UI for candidate CRUD (create/edit/delete candidates and links) be included in this feature? → A: Yes. Include admin candidate management UI in this feature alongside the voter-facing views.
- Q: How should candidates with non-"qualified" filing status (withdrawn, disqualified, write-in) appear on the voter-facing Election Information tab? → A: Show all candidates with a status badge (e.g., "Withdrawn" chip); visually dim non-qualified candidates.
- Q: Should elections list free-text search (FR-004) be client-side or server-side? → A: Client-side filtering of current page for now. Server-side search via API `q` parameter tracked as a feature request on voter-api (CivicPulse/voter-api#89).
- Q: Should clicking a candidate navigate to a dedicated detail page or show inline detail? → A: Dedicated `/candidates/{id}` detail page with full bio, links, and results data.
- Q: Where should admin candidate management live in the UI? → A: Inline on the Election Information tab — admin-only "Add/Edit/Delete" buttons appear contextually alongside the candidates list.
- Q: What should the default pagination page size be for the elections list? → A: 25 items per page with server-side pagination from the API.
- Q: What UI pattern should the admin candidate add/edit form use? → A: Dialog/modal (shadcn Dialog) overlay on the Election Information tab.
- Q: What should display when a candidate has no photo URL? → A: Initials avatar derived from candidate name (e.g., "JD" for Jane Doe) using shadcn Avatar with fallback.

## Assumptions

- The short description in the list view uses the API-provided `purpose` field when available, falling back to client-side synthesis from election type + district.
- Candidate data for the Election Information tab comes primarily from the Candidates API (`GET /elections/{id}/candidates`). When the candidates endpoint returns no items, fall back to results data. When neither source has data, show a "Candidates not yet announced" message.
- Eligibility information uses the API-provided `eligibility_description` field when available, falling back to district-derived text (e.g., "Registered voters in [district name]").
- Geographic area is derived from the election's district name and any associated boundary data already in the system.
- The existing Results and Participation tabs continue to function exactly as they do today. This feature only adds the Election Information tab and changes default tab selection.
- The election detail page URL structure is simplified to access elections by ID directly, removing the date segment from the URL path.
- Navigation context (state/county) from Zustand continues to be available for contextual display on the elections list.
- Active elections with live results continue to auto-poll for updates on the Results tab.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can locate a specific election in 2 or fewer interactions (search or filter + click) compared to the current 3-step date drill-down (select date → find race → click race).
- **SC-002**: Users can access candidate, eligibility, and geographic information for any election from a single tab without navigating to external pages.
- **SC-003**: 100% of elections display the correct default tab — Election Information when no results exist, Results when results are available.
- **SC-004**: All existing election results, participation data, and map visualizations remain fully functional after the redesign.
- **SC-005**: Bookmarked or shared URLs with tab parameters continue to work correctly, showing the specified tab.
- **SC-006**: The elections list loads and is interactive within 2 seconds on a standard connection, matching or improving upon the current page load time.
