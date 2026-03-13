# Better Elections Discovery

## What This Is

An overhaul of the elections list page in voter-web to make it practical for users to find specific contests among 1,000+ races across multiple election dates. The current interface has basic filters (status, type) and client-side search that only works on the current page of 25 results. This project adds all API-supported filters the UI currently ignores, then extends the API with new filtering capabilities (server-side search, district/county filtering, race category) with feature-detection so the UI gracefully adapts as API support lands.

## Core Value

Users can quickly find the specific contest they care about among 1,000+ election races without manually paging through results.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Election list with pagination (25 per page) — existing
- ✓ Status filter (active/finalized) — existing
- ✓ Election type filter (general/primary/special/runoff) — existing
- ✓ Client-side text search across name, district, description — existing
- ✓ Geographic context banner highlighting relevant elections — existing
- ✓ Election detail page with info/results/participation tabs — existing
- ✓ Choropleth map with county and precinct drilling — existing
- ✓ Admin election management (create, import feed, edit, delete) — existing

### Active

<!-- Current scope. Building toward these. -->

- [ ] Expose date range filters (date_from/date_to) in elections list UI
- [ ] Expose registration_open boolean filter in elections list UI
- [ ] Expose early_voting_active boolean filter in elections list UI
- [ ] All filters visible without hiding behind toggles — power-user oriented layout
- [ ] Server-side text search (q param) — replaces client-side search, works across all pages
- [ ] District/county filter — narrow results to a specific geography
- [ ] Race category filter (federal/state senate/state house/local) backed by API field
- [ ] Election date filter — show only contests for a specific election date
- [ ] Feature-detection for new API filters — try param, hide filter if API ignores/errors
- [ ] API feature request document for backend team (new params: q, district, county, race_category, election_date)

### Out of Scope

- Infinite scroll — keeping standard pagination at 25 per page
- Filter sidebar layout — all filters inline/wrapped, no sidebar
- Expandable/collapsible filter panel — all filters always visible
- Client-side race category derivation — requesting API field instead of parsing district names
- Changes to election detail page UX — this project focuses on discovery/filtering
- Admin election management changes — separate concern

## Context

- The voter-api backend is a FastAPI REST API at `/api/v1`
- Election records are individual races/contests, not election events — 2 election dates can produce 1K+ race records
- The API currently supports: status, election_type, date_from, date_to, registration_open, early_voting_active, page, page_size
- The API does NOT currently support: q (text search), district, county, race_category, election_date (exact date)
- The `district` field contains human-readable names like "US Senate", "State House District 001", "Bibb County Commission"
- The existing `categorizeRace()` function derives categories client-side but will be replaced by an API field
- The codebase uses TanStack Router with `validateSearch` for URL search params, TanStack Query for data fetching
- Filter state is managed via the `useElectionFilters` hook

## Constraints

- **Frontend-only for Phase 1**: Can only use filters the API already supports (status, election_type, date_from, date_to, registration_open, early_voting_active)
- **API dependency for Phase 2**: New filters (q, district, county, race_category, election_date) require backend changes
- **Feature-detection**: UI must gracefully handle API responses that ignore unknown params — show filter if API responds to it, hide if not
- **Stack**: React 19, TypeScript strict, shadcn/ui, TanStack Router/Query, ky HTTP client
- **Pagination**: Keep 25 items per page, no infinite scroll

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| All filters visible (no collapse/toggle) | Power users want direct access; 1K+ contests means filtering is the primary interaction | — Pending |
| Feature-detect new API filters | Allows shipping UI changes before API is updated; graceful degradation | — Pending |
| Server-side search replaces client-side | Client-side search only works on current page (25 items); useless for 1K+ contests | — Pending |
| Race category as API field (not client-side) | Parsing district names is fragile; API can use authoritative data | — Pending |
| Keep pagination at 25 per page | Sufficient with better filtering; avoids performance concerns with large result sets | — Pending |

---
*Last updated: 2026-03-13 after initialization*
