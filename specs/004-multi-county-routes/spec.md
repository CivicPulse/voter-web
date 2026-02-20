# Feature Specification: Multi-State & Multi-County URL Routing

**Feature Branch**: `004-multi-county-routes`
**Created**: 2026-02-20
**Status**: Draft
**Input**: User description: "While maintaining all current routes/links, the app will need to support multiple states and multiple counties. For example <https://vote.civpulse.org/districts/county-commission/005> doesn't indicate what state or county this district is a part of in the URL and could lead to collisions when accessing data from other counties. Currently we only have data loaded about Bibb County but that is changing soon."

## Clarifications

### Session 2026-02-20

- Q: How should the system classify a district as county-level vs state-level for URL generation? → A: Data-driven — if a boundary record has a county association, it is county-level (URL includes state + county); if the county association is absent, it is state-level (URL includes state only). No hardcoded list of boundary types required.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - State & County Selection (Priority: P1)

A visitor arrives at the application and sees a list or map of available states. They select a state (e.g., Georgia) and then see that state's counties on a map. They click a county to view its detail page. The URL at each level clearly identifies where they are — for example, the state page URL includes the state identifier, and the county page URL includes both state and county identifiers.

**Why this priority**: This is the foundational navigation change. Without a clear state → county hierarchy, users cannot orient themselves when data spans multiple states and counties. Every other feature depends on this navigation structure being in place.

**Independent Test**: Can be fully tested by navigating from the landing page to a state and then to a county, and verifying the URL contains the correct state and county identifiers at each level.

**Acceptance Scenarios**:

1. **Given** data exists for multiple states, **When** a user visits the home page, **Then** they see available states and can select one.
2. **Given** a user has selected a state, **When** the state page loads, **Then** the URL includes the state identifier (e.g., `/ga`) and the page displays that state's counties on a map.
3. **Given** a user is on a state page, **When** they click a county, **Then** they navigate to a county detail page whose URL includes both state and county (e.g., `/counties/ga/bibb`).
4. **Given** only one state has data, **When** a user visits the home page, **Then** they are automatically shown that state's map (no unnecessary selection step).

---

### User Story 2 - Collision-Free District URLs (Priority: P1)

A user navigates to a district detail page using a human-readable URL that includes geographic context appropriate to the district's scope. County-level districts (e.g., county commission, school board) include state and county qualifiers — for example, `/districts/ga/bibb/county-commission/005`. State-level districts that span multiple counties (e.g., state senate, state house, congressional) include only the state qualifier — for example, `/districts/ga/state-senate/018`. This prevents data collisions while keeping URLs as concise as possible.

**Why this priority**: This is the core problem described by the user. District slug URLs currently have no state or county qualifier, meaning district names like "county-commission/005" will collide once data from additional counties is loaded. Tied with P1 because it directly addresses the stated problem.

**Independent Test**: Can be fully tested by loading district data for two different counties that share identically named districts, navigating to each via its fully-qualified URL, and verifying the correct district data displays for each.

**Acceptance Scenarios**:

1. **Given** Bibb County and Houston County both have a "county-commission/005" district, **When** a user visits `/districts/ga/bibb/county-commission/005`, **Then** they see Bibb County's district data.
2. **Given** a user visits `/districts/ga/houston/county-commission/005`, **Then** they see Houston County's distinct district data.
3. **Given** a state senate district spans multiple counties, **When** a user visits `/districts/ga/state-senate/018`, **Then** they see the state-level district data without a county qualifier in the URL.
4. **Given** a user navigates to a county-level district from a county detail page, **Then** the generated link includes the correct state and county qualifiers.
5. **Given** a user navigates to a state-level district from a county detail page, **Then** the generated link includes the state qualifier only (no county qualifier).

---

### User Story 3 - Backward-Compatible Legacy URLs (Priority: P2)

A user who has bookmarked or shared an old-style URL (e.g., `/districts/county-commission/005` or `/counties/some-uuid`) can still access the content. The system recognizes legacy URL formats and resolves them — either by redirecting to the new fully-qualified URL or by displaying the content with a note about the updated URL.

**Why this priority**: Existing links in browser bookmarks, shared links, search engine indexes, and any external references must continue to work. Breaking existing URLs would harm user trust and SEO. However, this depends on the new URL structure being defined first (P1).

**Independent Test**: Can be fully tested by visiting each legacy URL format and verifying the user arrives at the correct content.

**Acceptance Scenarios**:

1. **Given** an old-style district slug URL `/districts/county-commission/005`, **When** only one county has a matching district, **Then** the user is redirected to the fully-qualified URL for that district.
2. **Given** an old-style district slug URL `/districts/county-commission/005`, **When** multiple counties have a matching district, **Then** the user sees a disambiguation page listing the matching districts with links to each.
3. **Given** an old-style county UUID URL `/counties/some-uuid`, **When** a user visits it, **Then** the user is redirected to the new URL format that includes the state (e.g., `/counties/ga/bibb`).
4. **Given** an old-style district UUID URL `/districts/some-uuid`, **When** a user visits it, **Then** the content loads correctly (UUIDs remain globally unique and collision-free).

---

### User Story 4 - State-Aware Home Page (Priority: P2)

A user visiting the home page sees a view appropriate to the number of available states. If only one state has data, they see that state's map (current behavior). If multiple states have data, they see a way to select or browse states. The home page adapts automatically as new state data is added without requiring code changes.

**Why this priority**: The home page is currently hardcoded to display Georgia. As data expands to multiple states, the home page must adapt to serve as a multi-state entry point. This is important for usability but builds on the state navigation structure from P1.

**Independent Test**: Can be fully tested by configuring the application with one state (verify map displays) and then with multiple states (verify selection interface displays), without any code changes between configurations.

**Acceptance Scenarios**:

1. **Given** only Georgia has data loaded, **When** a user visits the home page, **Then** they see Georgia's county map (functionally identical to current behavior).
2. **Given** Georgia and Alabama both have data, **When** a user visits the home page, **Then** they see a way to select either state.
3. **Given** a user selects a state from the home page, **When** the state loads, **Then** they see that state's county map with the same interactive features currently available for Georgia.

---

### User Story 5 - Contextual Voters & Elections (Priority: P3)

A user browsing voters or elections sees data that is relevant to their current state/county context. The URL does not necessarily change for these sections, but the data shown reflects the user's selected geographic scope. If a user was previously viewing Bibb County and navigates to Voters, they see voter data filtered to Bibb County by default.

**Why this priority**: Voters and elections currently work with filter-based scoping (the voters page has county/district search filters, elections are date-based). These existing patterns can continue to work in a multi-state world, but the default context should be informed by the user's navigation path. This is a refinement, not a blocker.

**Independent Test**: Can be fully tested by navigating from a county detail page to the Voters page and verifying that the voter list is pre-filtered to that county.

**Acceptance Scenarios**:

1. **Given** a user was viewing Bibb County, **When** they navigate to the Voters page, **Then** the county filter defaults to Bibb County.
2. **Given** a user navigates directly to `/voters` without prior county context, **When** the page loads, **Then** all voters are shown (no county filter pre-applied).
3. **Given** a user is viewing elections, **When** election data spans multiple counties, **Then** the user can filter elections by state or county.

---

### Edge Cases

- What happens when a user visits a state URL for a state with no data? The system displays a clear "no data available" message with navigation back to the home page.
- What happens when a district slug matches only one county's data but more counties are expected soon? The system redirects to the single match; when a second county's data arrives, it automatically begins showing disambiguation.
- What happens when a county name is the same in two different states (e.g., "Monroe County" exists in Georgia and Alabama)? The state qualifier in the URL prevents collision.
- What happens when a user visits a legacy URL while unauthenticated? The same redirect/disambiguation behavior applies; authentication is orthogonal to URL resolution.
- What happens when the API returns no results for a state/county/district combination? The system shows a "not found" page with helpful navigation back to valid locations.
- What happens when a new boundary type is added (e.g., "parish_commission" for Louisiana)? The data-driven classification rule automatically determines scope — if the boundary records have county associations, they get county-level URLs; otherwise, state-level URLs. No frontend code change required.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST include the state identifier in all county-level URLs so that counties are uniquely addressable across states.
- **FR-002**: The system MUST include both state and county identifiers in county-level district slug URLs to prevent name collisions across counties. State-level districts that span multiple counties MUST include the state identifier only. District scope (county-level vs state-level) is determined by whether the boundary record has a county association — not by a hardcoded list of boundary types.
- **FR-003**: The system MUST continue to resolve existing UUID-based URLs (`/counties/$countyId`, `/districts/$districtId`) without requiring state or county qualifiers, since UUIDs are globally unique.
- **FR-004**: The system MUST redirect or resolve legacy slug URLs (`/districts/$type/$name`, `/counties/$countyId`) to the new fully-qualified format.
- **FR-005**: When a legacy slug URL matches exactly one record, the system MUST redirect the user to the fully-qualified URL.
- **FR-006**: When a legacy slug URL matches multiple records (collision), the system MUST display a disambiguation page showing all matches with links to the correct fully-qualified URLs.
- **FR-007**: The home page MUST dynamically adapt to show available states based on what data exists, without hardcoding to a single state.
- **FR-008**: The system MUST support a state-level detail page that displays a county map for the selected state.
- **FR-009**: All internal navigation links (county-to-district, map clicks, overlay popups) MUST generate fully-qualified URLs that include state and county identifiers.
- **FR-010**: The system MUST use human-readable, URL-safe identifiers for states and counties (e.g., two-letter state abbreviations, slugified county names). URLs nest state and county under their existing path segments: `/counties/ga/bibb` for counties, `/districts/ga/bibb/county-commission/005` for county-level districts, and `/districts/ga/state-senate/018` for state-level districts.
- **FR-011**: The system MUST preserve all existing route paths for admin, login, about, and other non-geographic pages without modification.
- **FR-012**: The system MUST maintain backward compatibility so that no currently working URL returns a 404 error after this change.

### Key Entities

- **State**: A US state that has voter/boundary data loaded. Identified by a two-letter abbreviation (e.g., "ga" for Georgia). Serves as the top-level geographic scope.
- **County**: A county within a state. Identified by a slugified name (e.g., "bibb"). Uniquely identified by the combination of state + county slug.
- **District**: A political district that is either county-scoped or state-scoped, determined by whether the boundary record has a county association. County-scoped districts (e.g., county commission, school board) are uniquely identified by state + county + type + name. State-scoped districts (e.g., state senate, congressional) are uniquely identified by state + type + name. New boundary types added in the future are automatically classified by this data-driven rule.
- **Legacy URL**: Any URL in the current format that lacks state or county qualifiers. Must be recognized and resolved or redirected.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero URL collisions — navigating to any district URL returns the correct district data, even when identically-named districts exist across multiple counties.
- **SC-002**: 100% of existing bookmarked or shared URLs continue to resolve to valid content (either via redirect or direct display).
- **SC-003**: Users can navigate from the home page to any district detail page in 3 clicks or fewer (home → state → county → district).
- **SC-004**: Adding a new state's data to the system requires zero frontend code changes — the home page and navigation automatically reflect the newly available state.
- **SC-005**: All fully-qualified URLs are human-readable and convey geographic context (a user can determine which state and county a URL refers to by reading the URL).
- **SC-006**: Page load time for district and county detail pages remains within 20% of current load times despite the added URL resolution step.

## Assumptions

- **State identifiers** will use lowercase two-letter US postal abbreviations (e.g., "ga", "al"), which are universally recognized and URL-friendly.
- **County slugs** will use lowercase, hyphenated versions of county names (e.g., "bibb", "houston", "de-kalb"), matching the existing pattern in `/counties/$state/$county`.
- **Voters and elections routes** will NOT be restructured with state/county URL prefixes in this feature. They will continue to use their current filter-based scoping, with the enhancement that navigation context can pre-populate filters. Restructuring these routes can be a separate future feature if needed.
- **Admin routes** remain unchanged — they are not geographic and do not have collision concerns.
- **The backend API** already supports or will support querying districts, boundaries, and other entities by state and county identifiers. This spec does not prescribe API changes but assumes the necessary data is accessible.
- **Legacy URL redirects** are client-side only (`history.replaceState`) since this is an SPA with no server-side rendering. Search engines will index the final fully-qualified URL when they crawl the page content. True HTTP 301 redirects are not possible in this architecture.
- When only one state has data, the home page will display that state's map directly (no unnecessary state selection step), maintaining the current single-state experience.
