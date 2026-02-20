# Feature Specification: Meeting Archives Browser

**Feature Branch**: `005-meeting-archives`
**Created**: 2026-02-20
**Status**: Clarified
**Input**: User description: "Build the user-facing web interface for browsing, searching, and viewing local government meeting archives on the CivicPulse civic transparency platform."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Governing Bodies Directory (Priority: P1)

A voter visits the CivicPulse platform and wants to see what local government bodies are tracked in their area. They navigate to the governing bodies directory, which shows a filterable list of all tracked bodies (school boards, county commissions, city councils). They can filter by body type and jurisdiction to narrow results. Each entry shows the body's name, type, and how many meetings are archived. Clicking a body takes them to that body's detail page.

**Why this priority**: This is the foundational navigation entry point. Without a way to discover and browse governing bodies, users cannot access any meeting content. It establishes the primary information hierarchy.

**Independent Test**: Can be fully tested by navigating to the bodies directory, applying filters, and clicking through to a body detail page. Delivers immediate value by letting users discover what government bodies are tracked.

**Acceptance Scenarios**:

1. **Given** a user visits the governing bodies page, **When** the page loads, **Then** all tracked governing bodies are displayed in a list showing name, type, and meeting count.
2. **Given** the governing bodies list is displayed, **When** the user selects a body type filter (e.g., "School Board"), **Then** only bodies of that type are shown.
3. **Given** the governing bodies list is displayed, **When** the user selects a jurisdiction filter, **Then** only bodies in that jurisdiction are shown.
4. **Given** a governing body is displayed in the list, **When** the user clicks on it, **Then** they are navigated to that body's detail page.
5. **Given** no governing bodies match the applied filters, **When** the results are empty, **Then** a helpful empty state message is shown with suggestions to broaden filters.

---

### User Story 2 - View Governing Body Detail & Meeting History (Priority: P1)

A voter wants to see all meetings for a specific governing body, such as the Bibb County Board of Education. They navigate to that body's detail page, which shows the body's information (name, type, jurisdiction, official website link), and a chronological list of recent meetings. Each meeting entry shows its date, type, and status. The user can browse through meeting history and click into any individual meeting.

**Why this priority**: This is the second half of the core browse-and-discover flow. Once a user finds a governing body, they need to see its meetings. This also serves as the landing page for direct links shared to a specific body.

**Independent Test**: Can be tested by navigating to a governing body detail page and verifying body information and meeting list display. Delivers value by showing users the meeting history of a body they care about.

**Acceptance Scenarios**:

1. **Given** a user navigates to a governing body detail page, **When** the page loads, **Then** the body's name, type, jurisdiction, and official website link are displayed.
2. **Given** the body detail page is loaded, **When** meetings exist, **Then** a chronological list of meetings is displayed showing date, meeting type, and status.
3. **Given** the meeting list is displayed, **When** the user clicks a meeting, **Then** they are navigated to that meeting's detail page.
4. **Given** a governing body has no meetings archived, **When** the detail page loads, **Then** an empty state explains that no meetings have been archived yet.
5. **Given** the body has an official website URL, **When** the user clicks the website link, **Then** it opens in a new tab.

---

### User Story 3 - View Meeting Detail with Agenda Items (Priority: P1)

A voter wants to review what happened at a specific county commission meeting. They navigate to the meeting detail page, which shows the meeting's full metadata (date, time, type, location, governing body, status). Below the metadata, they see the ordered list of agenda items. Each agenda item can be expanded inline to show its title, description, action taken, disposition, and any item-level attachments. If the meeting has file attachments (minutes, supporting documents), those are listed with download links.

**Why this priority**: The meeting detail page is where the core transparency value is delivered. Users need to see what was discussed, what decisions were made, and access supporting documents. This is the culmination of the browse flow.

**Independent Test**: Can be tested by navigating to a meeting detail page, expanding agenda items, and downloading attachments. Delivers the primary transparency value of the platform.

**Acceptance Scenarios**:

1. **Given** a user navigates to a meeting detail page, **When** the page loads, **Then** meeting metadata is displayed (date, time, type, location, governing body, status).
2. **Given** the meeting has agenda items, **When** the page loads, **Then** agenda items are listed in order with titles visible.
3. **Given** an agenda item is displayed, **When** the user expands it, **Then** the title, description, action taken, and disposition are shown.
4. **Given** an agenda item has attachments, **When** the item is expanded, **Then** attachments are listed with download links.
5. **Given** the meeting has meeting-level file attachments, **When** the page loads, **Then** attachments are displayed in a dedicated section with download links.
6. **Given** an attachment is a PDF, **When** the user clicks to preview, **Then** a PDF preview is shown (inline or in a viewer).
7. **Given** the meeting has no agenda items, **When** the page loads, **Then** an empty state indicates no agenda items are available.

---

### User Story 4 - Watch Meeting Video with Timestamp Navigation (Priority: P2)

A voter wants to watch the video recording of a meeting and jump to specific agenda items. On the meeting detail page, if a video URL is available (YouTube or Vimeo), an embedded video player is displayed. When agenda items have associated video timestamps, the user can click a "Jump to" link on the agenda item to seek the video to that point in the recording.

**Why this priority**: Video is a high-value content type but not all meetings have recordings. The core browse and document access (P1) must work first. Video enhances the experience significantly for meetings that have recordings.

**Independent Test**: Can be tested by navigating to a meeting with a video URL and timestamp data, verifying the video player embeds correctly, and clicking timestamp links to confirm the video seeks to the correct position.

**Acceptance Scenarios**:

1. **Given** a meeting has a video URL (YouTube or Vimeo), **When** the meeting detail page loads, **Then** an embedded video player is displayed.
2. **Given** an agenda item has a video timestamp, **When** the user clicks the timestamp link, **Then** the video player seeks to that timestamp.
3. **Given** a meeting has no video URL, **When** the meeting detail page loads, **Then** no video player section is shown.
4. **Given** the video URL is invalid or the video has been removed, **When** the page loads, **Then** a graceful error message is shown instead of a broken embed.

---

### User Story 5 - Search Meetings and Agenda Items (Priority: P2)

A voter is interested in a specific topic (e.g., "rezoning" or "school budget") and wants to find all meetings and agenda items that mention it. They navigate to the search page, enter their query, and see results from agenda item titles, descriptions, and attachment filenames. Results show snippets with matching text highlighted. The user can refine results using faceted filters for governing body, date range, and meeting type. Clicking a result takes them to the relevant meeting detail page with the matching agenda item expanded.

**Why this priority**: Search is the most efficient way to find specific content, especially for users who know what topic they care about but not which body or meeting discussed it. It complements the browse flow and is critical for power users, journalists, and researchers.

**Independent Test**: Can be tested by entering a search term, verifying results are returned with highlighted snippets, applying filters, and clicking through to a meeting detail page.

**Acceptance Scenarios**:

1. **Given** a user enters a search query, **When** results are returned, **Then** matching agenda items are displayed with title, governing body, meeting date, and text snippets with highlighted matches.
2. **Given** search results are displayed, **When** the user applies a governing body filter, **Then** results are narrowed to that body's meetings only.
3. **Given** search results are displayed, **When** the user applies a date range filter, **Then** only results within that date range are shown.
4. **Given** search results are displayed, **When** the user applies a meeting type filter, **Then** only results from that meeting type are shown.
5. **Given** a search query returns no results, **When** the results page loads, **Then** a helpful empty state is shown with suggestions (e.g., try different keywords, broaden filters).
6. **Given** a search result is displayed, **When** the user clicks it, **Then** they are navigated to the meeting detail page with the matching agenda item visible.

---

### User Story 6 - Browse All Meetings Across Bodies (Priority: P3)

A voter or researcher wants to see all recent meetings across all governing bodies, not just one specific body. They navigate to a meetings list page that shows all meetings with filters for date range, meeting type, and keyword search. Each entry shows the date, type, governing body name, agenda item count, and status. This provides a chronological overview of all government activity.

**Why this priority**: This is a convenience view that aggregates meetings across bodies. While useful for researchers and power users who want a cross-cutting view, most users will access meetings through the body-first browse path or search. It is a lower-priority entry point.

**Independent Test**: Can be tested by navigating to the meetings list, applying various filters, and verifying the displayed meeting entries.

**Acceptance Scenarios**:

1. **Given** a user navigates to the meetings list page, **When** the page loads, **Then** meetings are displayed in reverse chronological order showing date, type, governing body, agenda item count, and status.
2. **Given** the meetings list is displayed, **When** the user filters by date range, **Then** only meetings within that range are shown.
3. **Given** the meetings list is displayed, **When** the user filters by meeting type, **Then** only meetings of that type are shown.
4. **Given** the meetings list is displayed, **When** the user enters a keyword search, **Then** meetings matching the keyword are shown.
5. **Given** the meetings list has many results, **When** the user scrolls or navigates pages, **Then** additional results are loaded.

---

### Edge Cases

- What happens when a governing body is deleted or archived after a user bookmarks its URL? The page should show a "not found" state with a link back to the directory.
- How does the system handle a meeting with 50+ agenda items? The list should remain performant with all items collapsed by default.
- What happens when an attachment download link is expired or broken? The system should show an error message and suggest contacting administrators.
- How does the system handle video embeds when the user has an ad blocker or restricted network? The video section should degrade gracefully with a link to watch directly on YouTube/Vimeo.
- What happens when search returns thousands of results? Results should be paginated and load progressively.
- How does the system handle governing body names with special characters or very long names in URLs? Slugs should be normalized and truncated appropriately.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a directory of all tracked governing bodies, showing name, body type, jurisdiction, and meeting count.
- **FR-002**: System MUST allow filtering the governing body directory by body type (e.g., school board, county commission, city council).
- **FR-003**: System MUST allow filtering the governing body directory by jurisdiction using cascading state and county filters (select state first, then county). The state filter MUST default to Georgia (GA).
- **FR-004**: System MUST display a governing body detail page showing name, type, jurisdiction, official website link, and a chronological list of meetings.
- **FR-005**: System MUST display a meeting detail page showing date, time, type, location, governing body, and status.
- **FR-006**: System MUST display an ordered list of agenda items on the meeting detail page, expandable inline to show title, description, action taken, and disposition.
- **FR-007**: System MUST display meeting-level file attachments with download capability.
- **FR-008**: System MUST display agenda item-level attachments with download capability and PDF preview.
- **FR-009**: System MUST embed a YouTube or Vimeo video player on meeting detail pages when a video URL is available.
- **FR-010**: System MUST support video timestamp navigation, allowing users to jump to specific points in the video from agenda items that have timestamp data.
- **FR-011**: System MUST provide full-text search across agenda item titles, descriptions, and attachment filenames.
- **FR-012**: System MUST display search results with text snippets showing highlighted matching terms.
- **FR-013**: System MUST support faceted search filtering by governing body, date range, and meeting type.
- **FR-014**: System MUST display a meetings list page showing all meetings across bodies with filters for date range, meeting type, and keyword search.
- **FR-015**: System MUST use breadcrumb navigation following the pattern: Home → Governing Bodies → [Body Name] → [Meeting Date].
- **FR-016**: System MUST use clean, human-readable URLs with sequence numbers to handle multiple meetings per date (e.g., `/bodies/bibb-county-boe/meetings/2024-01-15/1`, `/bodies/bibb-county-boe/meetings/2024-01-15/2`).
- **FR-024**: System MUST allow all meeting archive pages to be accessed without authentication (fully public).
- **FR-017**: System MUST be responsive and function correctly on mobile devices (screens 320px and wider).
- **FR-018**: System MUST meet WCAG 2.1 AA accessibility standards, including keyboard navigation, screen reader support, and sufficient color contrast.
- **FR-019**: System MUST display appropriate loading states while data is being fetched.
- **FR-020**: System MUST display user-friendly error messages when API calls fail or resources are not found.
- **FR-021**: System MUST display helpful empty states when no data matches the current view or filters.
- **FR-022**: System MUST support pagination for lists with many items (governing bodies, meetings, search results).
- **FR-023**: System MUST provide a combined entry point with both a prominent search bar and the governing bodies directory given equal visual weight on the main meetings landing page, allowing users to either search directly or browse by body.
- **FR-025**: System MUST add a top-level "Meetings" navigation item in the main app navigation, alongside existing items (Elections, Voters, etc.), linking to the meetings landing page.

### Key Entities

- **Governing Body**: A local government entity that holds meetings (e.g., Bibb County Board of Education, Macon-Bibb County Commission). Key attributes: name, slug, body type, jurisdiction, official website URL, meeting count.
- **Meeting**: A specific session held by a governing body. Key attributes: date, time, type (regular, special, work session, etc.), location, status (scheduled, completed, cancelled), governing body reference, video URL, agenda item count, sequence number (1-based, per body per date, for URL uniqueness).
- **Agenda Item**: An individual topic or action item discussed during a meeting. Key attributes: title, description, order/sequence number, action taken, disposition, video timestamp, meeting reference.
- **Attachment**: A file associated with a meeting or agenda item. Key attributes: filename, file type, file size, download URL, association (meeting-level or item-level).
- **Search Result**: A matched item from a search query. Key attributes: matched entity type, text snippet with highlights, relevance score, parent meeting reference, parent governing body reference.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can navigate from the governing bodies directory to a specific agenda item within a meeting in 4 clicks or fewer.
- **SC-002**: The governing bodies directory page displays and becomes interactive within 3 seconds on a standard mobile connection (3G).
- **SC-003**: Search results are returned and displayed within 2 seconds of submitting a query.
- **SC-004**: 90% of users can successfully find and view a specific meeting's agenda without external assistance.
- **SC-005**: All interactive elements are reachable and operable via keyboard navigation alone.
- **SC-006**: All pages pass automated WCAG 2.1 AA accessibility checks with zero critical violations.
- **SC-007**: The meeting detail page with 20+ agenda items loads and renders without perceptible lag on mobile devices.
- **SC-008**: Video timestamp navigation correctly seeks the embedded player to within 2 seconds of the specified timestamp.

## Clarifications

### Session 2026-02-20

- Q: How should meeting URLs handle multiple meetings by the same body on the same date? → A: Always include a sequence number in the URL: `/meetings/{date}/{sequence}` (e.g., `/meetings/2024-01-15/1`, `/meetings/2024-01-15/2`).
- Q: Should meeting archive pages require authentication or be fully public? → A: Fully public — no login required to view any meeting archive content.
- Q: What does "jurisdiction" mean for the governing body directory filter? → A: Cascading state and county filters (pick state, then county). Defaults to Georgia (GA).
- Q: How should meeting archives integrate into the app's navigation? → A: New top-level "Meetings" nav item alongside Elections, Voters, etc.

## Assumptions

- The Meeting Archive API (voter-api) already provides or will provide endpoints for governing bodies, meetings, agenda items, attachments, and search. The frontend will consume these endpoints.
- Video hosting is external (YouTube or Vimeo) — the platform does not host video files directly.
- Attachment files are served from the API or a CDN with direct download URLs.
- PDF preview will use the browser's native PDF rendering capability (inline iframe or object tag).
- The search endpoint on the API handles full-text indexing and returns results with highlighted snippets. The frontend renders these highlights.
- Mobile usage is expected to be significant (estimated 40-60% of users) based on the civic engagement context.
- Governing body slugs are generated and maintained by the API (or derived client-side from the body name using the existing slugify pattern).
- The primary entry point gives equal weight to search and body-first browsing on the main meetings landing page (user-confirmed).

## Out of Scope

- Admin or data entry interfaces for managing meetings, bodies, or agenda items
- Calendar view of meetings
- Notification or subscription system (e.g., alerts for new meetings)
- Meeting comparison or diff views
- User accounts or authentication for viewing meeting data (public access)
- Comment or discussion features on meetings or agenda items
- Live meeting streaming or real-time updates
