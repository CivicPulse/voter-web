# Requirements: Better Elections Discovery

**Defined:** 2026-03-13
**Core Value:** Users can quickly find the specific contest they care about among 1,000+ election races without manually paging through results.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### URL State

- [ ] **URL-01**: Filter state persists in URL search params via TanStack Router validateSearch with Zod schema
- [ ] **URL-02**: Pagination resets to page 1 when any filter changes
- [ ] **URL-03**: Browser back/forward navigates between previous filter states
- [ ] **URL-04**: Shared URLs restore exact filter combination for the recipient

### Existing API Filters

- [ ] **FILT-01**: User can filter elections by date range (date_from / date_to) using a date range picker
- [ ] **FILT-02**: User can toggle "Registration open" filter to show only elections with open registration
- [ ] **FILT-03**: User can toggle "Early voting active" filter to show only elections with active early voting
- [ ] **FILT-04**: All filters are visible inline without toggles or collapsing — wrapping layout on smaller screens

### UX Feedback

- [ ] **UX-01**: Result count displayed above list ("Showing X of Y elections")
- [ ] **UX-02**: Active filters shown as removable badge chips above results
- [ ] **UX-03**: "Clear all filters" action available when any filter is active
- [ ] **UX-04**: Empty state shows which filters are active and suggests broadening criteria

### New API Filters (Feature-Detected)

- [ ] **API-01**: Server-side text search (q param) replaces client-side search, works across all pages with 300ms debounce
- [ ] **API-02**: Race category filter (federal / state senate / state house / local) backed by API race_category field
- [ ] **API-03**: Election date exact filter narrows results to a specific election day
- [ ] **API-04**: Geographic filter (county/district) narrows results to specific geography
- [ ] **API-05**: Filter options endpoint provides valid values per filter, disabling options that yield zero results

### Infrastructure

- [ ] **INFRA-01**: Feature-detection hook probes API capabilities and conditionally shows/hides new filter controls
- [ ] **INFRA-02**: API feature request spec document for backend team covering: q, race_category, county, district, election_date, filter-options endpoint

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
| URL-01 | — | Pending |
| URL-02 | — | Pending |
| URL-03 | — | Pending |
| URL-04 | — | Pending |
| FILT-01 | — | Pending |
| FILT-02 | — | Pending |
| FILT-03 | — | Pending |
| FILT-04 | — | Pending |
| UX-01 | — | Pending |
| UX-02 | — | Pending |
| UX-03 | — | Pending |
| UX-04 | — | Pending |
| API-01 | — | Pending |
| API-02 | — | Pending |
| API-03 | — | Pending |
| API-04 | — | Pending |
| API-05 | — | Pending |
| INFRA-01 | — | Pending |
| INFRA-02 | — | Pending |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 0
- Unmapped: 19 ⚠️

---
*Requirements defined: 2026-03-13*
*Last updated: 2026-03-13 after initial definition*
