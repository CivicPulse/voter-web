# Requirements: Better Elections Discovery

**Defined:** 2026-03-13
**Core Value:** Users can quickly find the specific contest they care about among 1,000+ election races without manually paging through results.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### URL State

- [x] **URL-01**: Filter state persists in URL search params via TanStack Router validateSearch with Zod schema
- [x] **URL-02**: Pagination resets to page 1 when any filter changes
- [x] **URL-03**: Browser back/forward navigates between previous filter states
- [x] **URL-04**: Shared URLs restore exact filter combination for the recipient

### Existing API Filters

- [x] **FILT-01**: User can filter elections by date range (date_from / date_to) using a date range picker
- [x] **FILT-02**: User can toggle "Registration open" filter to show only elections with open registration
- [x] **FILT-03**: User can toggle "Early voting active" filter to show only elections with active early voting
- [x] **FILT-04**: All filters are visible inline without toggles or collapsing — wrapping layout on smaller screens

### UX Feedback

- [x] **UX-01**: Result count displayed above list ("Showing X of Y elections")
- [x] **UX-02**: Active filters shown as removable badge chips above results
- [x] **UX-03**: "Clear all filters" action available when any filter is active
- [x] **UX-04**: Empty state shows which filters are active and suggests broadening criteria

### New API Filters (Feature-Detected)

- [ ] **API-01**: Server-side text search (q param) replaces client-side search, works across all pages with 300ms debounce
- [ ] **API-02**: Race category filter (federal / state senate / state house / local) backed by API race_category field
- [ ] **API-03**: Election date exact filter narrows results to a specific election day
- [ ] **API-04**: Geographic filter (county/district) narrows results to specific geography
- [ ] **API-05**: Filter options endpoint provides valid values per filter, disabling options that yield zero results

### Infrastructure

- [x] **INFRA-01**: Feature-detection hook probes API capabilities and conditionally shows/hides new filter controls
- [x] **INFRA-02**: API feature request spec document for backend team covering: q, race_category, county, district, election_date, filter-options endpoint

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Sort & Polish

- **SORT-01**: User can sort elections by date, name, or relevance (when search active)
- **SORT-02**: Keyboard shortcuts for common filter actions (clear, focus search)

### Advanced Geographic

- **GEO-01**: Map-based geographic selection for filtering
- **GEO-02**: Geographic context auto-applies as a server-side filter (not just highlighting)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Infinite scroll | Breaks URL state, bad for accessibility, PROJECT.md explicitly excludes |
| Collapsible/sidebar filter panel | Only 6-8 filters, not enough to warrant hiding; power users want direct access |
| Faceted counts on all filter values | Requires significant backend work (N queries per filter); filter-options endpoint covers the critical case |
| Saved/bookmarked filter presets | URL bookmarking via browser is sufficient; no user account storage needed |
| Full-text search across description/metadata | Scope q param to name + district; description search bloats results |
| Client-side race category derivation | Fragile heuristic; API field is authoritative per PROJECT.md decision |
| Changes to election detail page | This project focuses on discovery/listing, not individual election UX |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| URL-01 | Phase 1 | Complete |
| URL-02 | Phase 1 | Complete |
| URL-03 | Phase 1 | Complete |
| URL-04 | Phase 1 | Complete |
| FILT-01 | Phase 1 | Complete |
| FILT-02 | Phase 1 | Complete |
| FILT-03 | Phase 1 | Complete |
| FILT-04 | Phase 1 | Complete |
| UX-01 | Phase 1 | Complete |
| UX-02 | Phase 1 | Complete |
| UX-03 | Phase 1 | Complete |
| UX-04 | Phase 1 | Complete |
| API-01 | Phase 3 | Pending |
| API-02 | Phase 3 | Pending |
| API-03 | Phase 3 | Pending |
| API-04 | Phase 3 | Pending |
| API-05 | Phase 3 | Pending |
| INFRA-01 | Phase 2 | Complete |
| INFRA-02 | Phase 2 | Complete |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0

---
*Requirements defined: 2026-03-13*
*Last updated: 2026-03-13 after roadmap creation*
