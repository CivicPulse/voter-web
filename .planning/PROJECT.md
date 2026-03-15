# Better Elections Discovery

## What This Is

An overhaul of the elections list page in voter-web that transforms a basic paginated list into a powerful discovery interface for 1,000+ race records. The interface now features URL-persisted filter state with date presets, status/type/boolean filters, removable filter chips, result counts, context-aware empty states, and capability-gated advanced filters (server-side search, race category, county combobox, election date) that gracefully adapt as API support lands.

## Core Value

Users can quickly find the specific contest they care about among 1,000+ election races without manually paging through results.

## Requirements

### Validated

- ✓ Election list with pagination (25 per page) — existing
- ✓ Status filter (active/finalized) — existing
- ✓ Election type filter (general/primary/special/runoff) — existing
- ✓ Geographic context banner highlighting relevant elections — existing
- ✓ Election detail page with info/results/participation tabs — existing
- ✓ Choropleth map with county and precinct drilling — existing
- ✓ Admin election management (create, import feed, edit, delete) — existing
- ✓ URL-persisted filter state via TanStack Router + Zod schema — v1.0
- ✓ Date range filters (date_from/date_to) with date preset dropdown — v1.0
- ✓ Registration open and early voting active boolean filters — v1.0
- ✓ All filters visible inline without toggles or collapsing — v1.0
- ✓ Result count ("Showing X of Y elections") — v1.0
- ✓ Active filters as removable badge chips with "Clear all" action — v1.0
- ✓ Context-aware empty states (filtered vs default) — v1.0
- ✓ Pagination reset on filter change, browser back/forward navigation — v1.0
- ✓ Shareable URLs restore exact filter combination — v1.0
- ✓ Feature-detection hook probes API capabilities, gates filter controls — v1.0
- ✓ API feature request spec for backend team (5 new params + filter-options endpoint) — v1.0
- ✓ Server-side text search with 300ms debounce (replaces client-side search) — v1.0
- ✓ Race category filter (federal/state senate/state house/local) — v1.0
- ✓ Election date exact filter — v1.0
- ✓ Geographic filter (county combobox with auto-populate from nav context) — v1.0
- ✓ Filter options endpoint populates dropdowns with valid values — v1.0

### Active

<!-- Next milestone scope. Nothing planned yet — use /gsd:new-milestone to define. -->

- [ ] Sort elections by date, name, or relevance (when search active)
- [ ] Keyboard shortcuts for common filter actions (clear, focus search)
- [ ] Map-based geographic selection for filtering
- [ ] Geographic context auto-applies as a server-side filter

### Out of Scope

- Infinite scroll — keeping standard pagination at 25 per page
- Filter sidebar layout — all filters inline/wrapped, no sidebar
- Expandable/collapsible filter panel — all filters always visible
- Client-side race category derivation — API field is authoritative
- Changes to election detail page UX — discovery/filtering focus
- Admin election management changes — separate concern
- Faceted counts on all filter values — filter-options endpoint covers the critical case
- Saved/bookmarked filter presets — URL bookmarking via browser is sufficient
- Full-text search across description/metadata — q param scoped to name + district

## Context

Shipped v1.0 with 2,515 lines of TypeScript across 19 files.
Tech stack: React 19, TypeScript 5.9+, TanStack Router/Query, shadcn/ui, Zod, ky.
Feature-detection infrastructure ready — advanced filters appear automatically when backend ships capabilities endpoint.
Race category taxonomy (federal/state_senate/state_house/local) needs backend alignment; API spec defers enum values to backend team.
All 27 E2E tests and 904 unit tests pass with zero regressions.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| All filters visible (no collapse/toggle) | Power users want direct access; 1K+ contests means filtering is the primary interaction | ✓ Good — clean layout with Row 1 (always) + Row 2 (capability-gated) |
| Feature-detect new API filters | Allows shipping UI changes before API is updated; graceful degradation | ✓ Good — capabilities endpoint approach is clean and extensible |
| Server-side search replaces client-side | Client-side search only works on current page (25 items); useless for 1K+ contests | ✓ Good — client-side search fully removed when feature flag active |
| Race category as API field (not client-side) | Parsing district names is fragile; API can use authoritative data | ✓ Good — centralized RACE_CATEGORY_LABELS, API spec delivered to backend |
| Keep pagination at 25 per page | Sufficient with better filtering; avoids performance concerns | ✓ Good — no issues reported |
| Strict fallback (all flags false on error) | Prevents showing broken filter controls when API unavailable | ✓ Good — graceful degradation to Phase 1 filters only |
| election_date clears date range | Exact date and date range are mutually exclusive; prevents API conflicts | ✓ Good — clean UX, no parameter ambiguity |
| Extract non-component exports to lib/ | react-refresh/only-export-components lint rule requires it | ✓ Good — established reusable pattern for all route utilities |

## Constraints

- **Frontend-only for Phase 1**: Can only use filters the API already supports
- **API dependency for Phase 2+**: New filters require backend changes (capabilities endpoint, new params)
- **Feature-detection**: UI must gracefully handle API responses that ignore unknown params
- **Stack**: React 19, TypeScript strict, shadcn/ui, TanStack Router/Query, ky HTTP client
- **Pagination**: Keep 25 items per page, no infinite scroll

---
*Last updated: 2026-03-15 after v1.0 milestone*
