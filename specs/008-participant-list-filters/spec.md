# Feature Specification: Add Filter Controls to the Election Participation Voter List

**Feature Branch**: `008-participant-list-filters`
**Created**: 2026-02-26
**Status**: Draft
**Input**: User description: "Add filter controls to the election participation voter list"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Filter Participants by County (Priority: P1)

An analyst viewing an election's participation tab wants to narrow the voter list to a single county. They select a county from a dropdown and the list immediately updates to show only voters from that county. The total count and pagination reset to reflect the filtered set. The analyst can combine the county filter with the search box to further narrow results.

**Why this priority**: County is the most common filter analysts apply when working with participation data. Elections span many counties, and a list of thousands of participants across 159 counties is unworkable without the ability to narrow by geography first. This is the highest-value, lowest-friction filter.

**Independent Test**: Can be fully tested by selecting a county from the dropdown on the participation tab, verifying the list updates to show only participants from that county, and verifying the total count changes accordingly. Delivers immediate value by making county-level analysis possible.

**Acceptance Scenarios**:

1. **Given** an analyst is on an election's participation tab, **When** the page loads, **Then** a county filter dropdown is visible alongside the existing search input.
2. **Given** an analyst selects a county from the filter, **When** the selection is made, **Then** the participant list refreshes to show only voters registered in that county.
3. **Given** an analyst has a county selected, **When** they also type in the search box, **Then** the list shows only voters matching both the county and the search term.
4. **Given** an analyst has filtered to a county, **When** they reset the county filter to "All Counties", **Then** the full unfiltered list is restored.
5. **Given** an analyst is on a filtered view, **When** they navigate to a different page number and then back, **Then** the county filter is still applied.

---

### User Story 2 - Bookmark and Share Filtered Views (Priority: P1)

An analyst filters the participation list by county and voter status to identify a specific subset of voters. They want to share this filtered view with a colleague by copying the URL. When the colleague opens the link, they see the same filtered list with the same filters already applied.

**Why this priority**: Without URL-based filter state, every filtered view is ephemeral — analysts cannot share their work, cannot bookmark a recurring analysis, and cannot return to a filtered view after navigating away. URL persistence is foundational to making filters useful in a collaborative or recurring-analysis workflow.

**Independent Test**: Can be fully tested by applying filters, copying the URL, opening it in a new browser tab, and verifying the same filters are applied and the same results appear. Delivers immediate value by enabling shareable and bookmarkable filtered views.

**Acceptance Scenarios**:

1. **Given** an analyst applies a county filter, **When** the filter is applied, **Then** the URL updates to include the county parameter.
2. **Given** an analyst applies multiple filters (county + voter status), **When** the filters are applied, **Then** the URL includes all active filter parameters.
3. **Given** a URL with filter parameters is opened in a fresh browser tab, **When** the page loads, **Then** the filter dropdowns reflect the URL parameters and the list shows the filtered results.
4. **Given** an analyst reloads the page while filters are active, **When** the page reloads, **Then** the filters are restored from the URL and the filtered list is shown.
5. **Given** an analyst navigates away from the participation tab and returns via the browser back button, **When** they return, **Then** the filter state is preserved from the URL.

---

### User Story 3 - Filter by Voter Status (Priority: P2)

An analyst wants to see only "Active" participants (or only "Inactive", etc.) in an election. They select a voter status from a dropdown and the list updates to show only participants with that registration status. This helps analysts distinguish participation by voters whose registration was current at the time versus those with lapsed or cancelled registrations.

**Why this priority**: Voter status filtering complements county filtering and addresses a real analytical use case — comparing active vs inactive voter participation rates. It is P2 because county filtering addresses the most common volume-reduction need, while status filtering addresses a more analytical comparison need.

**Independent Test**: Can be fully tested by selecting a status value from the voter status dropdown and verifying that the participant list updates to show only voters with that status.

**Acceptance Scenarios**:

1. **Given** an analyst is on the participation tab, **When** they view the filter controls, **Then** a voter status dropdown is visible.
2. **Given** an analyst selects "Active" from the voter status filter, **When** the selection is applied, **Then** only participants with an Active registration status appear in the list.
3. **Given** an analyst has a status filter active, **When** they change to a different status value, **Then** the list updates to reflect the new selection.
4. **Given** an analyst selects "All Statuses", **When** the selection is applied, **Then** the status filter is cleared and all participants are shown.

---

### User Story 4 - Filter by Legislative District (Priority: P2)

An analyst wants to see only participants registered in a specific congressional district, state senate district, or state house district. They select a district value from the appropriate dropdown and the list narrows to participants in that district. This supports analysis of turnout within a specific legislative district that may span multiple counties.

**Why this priority**: District-based filtering is essential for analysts studying turnout by legislative district. It is P2 because the analytical value is slightly more specialized than county or status filters, but it is a natural and common breakdown for election participation analysis.

**Independent Test**: Can be fully tested by selecting a congressional district value and verifying the list shows only participants registered in that district.

**Acceptance Scenarios**:

1. **Given** an analyst is on the participation tab, **When** they view the filter controls, **Then** dropdowns for congressional district, state senate district, and state house district are visible.
2. **Given** an analyst selects a congressional district, **When** the filter is applied, **Then** only participants registered in that congressional district appear.
3. **Given** an analyst selects a state senate district, **When** the filter is applied, **Then** only participants in that state senate district appear.
4. **Given** an analyst selects a state house district, **When** the filter is applied, **Then** only participants in that state house district appear.
5. **Given** an analyst has a district filter active and also selects a county filter, **When** both filters are active, **Then** the list shows only participants matching both filters simultaneously.

---

### User Story 5 - Filter by Precinct and Ballot Style (Priority: P3)

An analyst wants to drill down into a specific county precinct to analyze turnout patterns, or filter by ballot style to examine voting behavior for a particular ballot variant. They select a precinct or ballot style from a dropdown and the list narrows accordingly.

**Why this priority**: Precinct and ballot style filters are the most granular and specialized of the available filters. They are useful for deep precinct-level analysis but serve a narrower analyst use case than county, status, or district filters.

**Independent Test**: Can be fully tested by selecting a precinct value and verifying only participants from that precinct appear in the list.

**Acceptance Scenarios**:

1. **Given** an analyst is on the participation tab, **When** they view the filter controls, **Then** a county precinct dropdown and a ballot style dropdown are visible.
2. **Given** an analyst selects a precinct, **When** the filter is applied, **Then** only participants from that precinct appear in the list.
3. **Given** an analyst selects a ballot style, **When** the filter is applied, **Then** only participants with that ballot style appear.
4. **Given** an analyst selects both a precinct and a ballot style, **When** both filters are active, **Then** the list shows only participants matching both conditions.

---

### User Story 6 - Filter by District Mismatch Status (Priority: P3)

An analyst reviewing data quality wants to see only participants whose registered district assignments do not match their geocoded address. They toggle the district mismatch filter to "Mismatch Only" and the list narrows to participants with known mismatches. This allows analysts to cross-reference data quality findings with actual participation records.

**Why this priority**: District mismatch filtering is a specialized data-quality workflow. It is P3 because it serves a specific analytical investigation into data integrity rather than a general browsing or reporting need.

**Independent Test**: Can be fully tested by selecting "Mismatch Only" from the district check filter and verifying only participants with a known district mismatch appear.

**Acceptance Scenarios**:

1. **Given** an analyst is on the participation tab, **When** they view the filter controls, **Then** a "District Check" filter is visible with options for All, Mismatch Only, and No Mismatch.
2. **Given** an analyst selects "Mismatch Only", **When** the filter is applied, **Then** only participants with a district mismatch appear in the list.
3. **Given** an analyst selects "No Mismatch", **When** the filter is applied, **Then** only participants without a district mismatch appear.
4. **Given** an analyst resets to "All Districts", **When** the filter is cleared, **Then** the full unfiltered list (subject to other active filters) is restored.

---

### Edge Cases

- What happens when a filter combination returns zero results? The list must show an empty state message that distinguishes "no participants found" from the no-filter empty state of "no participants in this election".
- What happens if a filter value in the URL is no longer valid (e.g., a precinct code that doesn't match any participant)? The filter applies and the API returns an empty result set — no error should be shown, just an empty list.
- How does pagination interact with filters? Changing any filter or search value must reset the page number to 1 so the user does not land on a non-existent page.
- What happens when all filters are cleared? The list returns to the full unfiltered state and all filter parameters are removed from the URL.
- What if an election has participants from only one county? The county dropdown still appears but will only show that county alongside "All Counties" — filter controls are always visible regardless of the number of available options.
- What if an election has zero participants, or `/participation/stats` returns no county or ballot style data? All filter dropdowns still render with only their "All ..." sentinel option — filter controls are never hidden or disabled based on the absence of dynamic option data. This is consistent with the always-visible requirement (FR-005) and prevents layout shifts if participants are added later.
- When an analyst changes the county filter while a legislative district filter is active, the district filter is **preserved** — it is not cleared. The list shows participants matching both the new county and the existing district filter simultaneously (per US4 AC5). Only the county precinct (`p_precinct`) is cleared on county change, since precincts are county-scoped and a precinct from the previous county is meaningless in the new county.
- How are filter values populated? A **hybrid strategy** applies: bounded-domain filters (voter status, district mismatch) use static known value lists with no extra API calls. Open-ended filters (county, county precinct, ballot style) use dynamic values derived from the existing `/elections/{id}/participation/stats` endpoint for the specific election's participants — the stats response provides `by_county` and `by_ballot_style` breakdowns; if these fields are absent, the dropdown shows only its "All ..." sentinel. Congressional, state senate, and state house district codes are a bounded numeric sequence and use static lists.

## Clarifications

### Session 2026-02-26

- Q: How should filter dropdown options be populated — static known lists, dynamic API call, or hybrid? → A: Hybrid — static for bounded domains (voter status, mismatch, district codes); dynamic from `/participation/stats` for open-ended domains (county, county precinct, ballot style) using `by_county` and `by_ballot_style` breakdowns; district codes (congressional, senate, house) remain static bounded sequences.
- Q: How should 8 filter controls be laid out — responsive wrapping rows, collapsible panel, or fixed two-row layout? → A: Responsive wrapping rows — all filters always visible, wrapping to additional rows as needed, matching VoterSearchFilters approach.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The participation voter list MUST display filter controls including: county, voter status, district mismatch check, county precinct, ballot style, congressional district, state senate district, and state house district. Filter option values use a hybrid strategy: static known lists for bounded domains (voter status, mismatch, district codes); dynamic values derived from the existing `/elections/{id}/participation/stats` endpoint for open-ended domains (county, county precinct, ballot style) using `by_county` and `by_ballot_style` breakdowns, falling back to omitted (sentinel only) if the endpoint is unavailable or returns no data.
- **FR-002**: All filter controls MUST be combinable with the existing text search input — active filters and search are applied simultaneously as AND conditions.
- **FR-003**: All filter and search state MUST be persisted in URL search parameters so filtered views are bookmarkable and shareable.
- **FR-004**: Changing any filter or search value MUST reset pagination to page 1.
- **FR-005**: The filter controls MUST match the visual style and interaction patterns of the existing main voter list filter controls — Select dropdowns with "All ..." default options, consistent sizing and layout. All 8 filter controls MUST be always visible (no toggle or collapsible panel), arranged in a responsive wrapping row layout so filters wrap gracefully to additional rows on smaller screens.
- **FR-006**: The empty state message MUST distinguish between "no participants in this election" (no filters applied, no data) and "no participants match the current filters" (filters applied, zero results).
- **FR-007**: Filter and search state MUST persist across pagination — navigating between pages of a filtered result must not clear filters.
- **FR-008**: Clearing or resetting a filter to its "all" state MUST remove that parameter from the URL rather than setting it to an empty string.
- **FR-009**: When the page loads with filter parameters already in the URL, the filter controls MUST be pre-populated to reflect those parameters and the list MUST display the filtered results.

### Key Entities

- **Participant Filter State**: The set of active filter values at any given time — county, voter_status, has_district_mismatch, county_precinct, ballot_style, congressional_district, state_senate_district, state_house_district, search query, and page number. All values are optional; an absent value means "no filter applied" for that dimension.
- **Election Participant**: A voter who participated in a specific election — identified by registration number, linked to their voter profile record, and carrying registration attributes used for filtering (county, status, district assignments, ballot style, mismatch flag).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An analyst can narrow a participation list of 10,000+ records to a single county without performing manual searching or any action outside the participation tab.
- **SC-002**: A URL shared between two analysts opens with the same filters applied and shows the same participant results without any additional interaction.
- **SC-003**: All filter combinations — any combination of county, status, mismatch, precinct, ballot style, district filters, and search — return consistent results where the list always reflects all active filters simultaneously.
- **SC-004**: Navigating between pages of a filtered result set preserves all active filters — no filter state is lost on pagination.
- **SC-005**: The filter controls visually and behaviorally match the main voter list filter controls closely enough that an analyst familiar with the voter list can use the participation filters without any learning curve or instruction.
- **SC-006**: Applying any filter takes effect within one server round-trip — no separate "Apply" button is needed; selecting a filter value immediately triggers the filtered result.
