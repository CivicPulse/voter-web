# Roadmap: Better Elections Discovery

## Overview

Transform the elections list page from a basic paginated list with limited filters into a powerful discovery interface for 1,000+ race records. The work proceeds in three phases: first, migrate filter state to URL params and expose all existing API filters with rich UX feedback; second, build the feature-detection infrastructure that gates API-dependent filters; third, add server-side search, race category, geographic, and election date filters that conditionally render based on API capabilities.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: URL State and Existing Filters** - Migrate to URL-persisted filter state, expose all API-supported filters, add UX feedback (chips, counts, empty states)
- [ ] **Phase 2: Feature Detection Infrastructure** - Build API capability probing and write backend API spec document
- [ ] **Phase 3: API-Dependent Filters** - Add server-side search, race category, geographic, election date, and filter options — all gated by feature detection

## Phase Details

### Phase 1: URL State and Existing Filters
**Goal**: Users can filter the elections list using all currently available API parameters with filter state persisted in the URL and clear visual feedback about active filters
**Depends on**: Nothing (first phase)
**Requirements**: URL-01, URL-02, URL-03, URL-04, FILT-01, FILT-02, FILT-03, FILT-04, UX-01, UX-02, UX-03, UX-04
**Success Criteria** (what must be TRUE):
  1. User can apply date range, registration open, and early voting filters alongside existing status and type filters, and all selections persist across page refresh via URL search params
  2. User can share a filtered URL with someone else and the recipient sees the exact same filter combination and results
  3. User can see how many elections match current filters ("Showing X of Y"), see active filters as removable badge chips, and clear all filters with one action
  4. User sees a helpful empty state explaining which filters are active and suggesting broader criteria when no results match
  5. Browser back/forward navigates between previous filter states and pagination resets to page 1 when any filter changes
**Plans**: TBD

Plans:
- [ ] 01-01: TBD
- [ ] 01-02: TBD

### Phase 2: Feature Detection Infrastructure
**Goal**: The application can detect which API filter capabilities are available and conditionally show or hide filter controls, and the backend team has a specification for the new parameters needed
**Depends on**: Phase 1
**Requirements**: INFRA-01, INFRA-02
**Success Criteria** (what must be TRUE):
  1. Filter controls for API-dependent features (search, race category, geographic, election date) appear only when the API supports those parameters and are hidden otherwise
  2. A written API feature request spec document exists covering the q, race_category, county, district, election_date parameters and filter-options endpoint with expected behavior and response formats
**Plans**: TBD

Plans:
- [ ] 02-01: TBD

### Phase 3: API-Dependent Filters
**Goal**: Users can find specific contests using server-side text search, race category, geographic scope, and exact election date — with all filters working across the full dataset, not just the current page
**Depends on**: Phase 2
**Requirements**: API-01, API-02, API-03, API-04, API-05
**Success Criteria** (what must be TRUE):
  1. User can type a search query and see results matching across all elections (not just the current page), with 300ms debounce preventing excessive API calls
  2. User can filter by race category (federal, state senate, state house, local) and by specific election date to narrow results to a particular scope
  3. User can filter by county or district to see only geographically relevant contests
  4. Filter dropdowns show only valid options (values that yield results) when the filter-options endpoint is available, preventing dead-end selections
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. URL State and Existing Filters | 0/0 | Not started | - |
| 2. Feature Detection Infrastructure | 0/0 | Not started | - |
| 3. API-Dependent Filters | 0/0 | Not started | - |
