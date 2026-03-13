# Feature Research

**Domain:** Election discovery & large-list filtering UX for a civic tech SPA
**Researched:** 2026-03-13
**Confidence:** HIGH (existing codebase well-understood; UX patterns well-documented in industry)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist when filtering 1K+ items. Missing these = users abandon the page.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Server-side text search | Client-side search on 25-item page is useless for 1K+ records. Users type to find and expect results across the full dataset. 61% of users leave if they can't find what they need in ~5 seconds. | MEDIUM | Requires API `q` param. Debounce input 300ms before sending; use TanStack Pacer `useDebouncedCallback` or `useDeferredValue` on the query key (not the callback). Feature-detect: send `q`, check if results change vs. unfiltered. |
| Date range filter (date_from / date_to) | The most natural dimension for elections. Users think "what's happening in November?" not "show me page 37." Already supported by the API but not exposed in UI. | LOW | API already accepts `date_from` and `date_to`. Use shadcn/ui `DatePickerWithRange` (Popover + Calendar). Add preset shortcuts: "Next 30 days", "This year", "Last election cycle". |
| Election date filter (exact date) | With 1K+ races across 2 election dates, users need to narrow to "November 5, 2024" specifically. Groups the mental model: election day = event, races = items within it. | MEDIUM | Requires new API `election_date` param. Could derive a dropdown from known election dates in the current result set, or let the API return distinct dates. Feature-detect. |
| Race category filter | Users think in terms of "federal", "state senate", "local" not raw district strings. The existing `categorizeRace()` function already proves this need. | MEDIUM | Requires API `race_category` field (PROJECT.md explicitly calls for this). Client-side `categorizeRace()` is fragile heuristic; API can use authoritative data. Feature-detect. |
| Active filter summary with removal | When multiple filters are active, users lose track of what's applied. Enterprise filtering best practice: show applied filters prominently above results as removable chips/badges. | LOW | Use shadcn Badge components with X buttons. Show "N filters applied" or individual chips. Include "Clear all filters" action. Already partially implemented (hasActiveFilters check exists). |
| Result count display | Users need feedback: "Showing 47 of 1,234 elections" tells them filtering worked. Without it, they can't judge whether to refine further or browse. | LOW | API already returns `total` in pagination response. Display above the list, update reactively. |
| Empty state with filter guidance | When filters produce zero results, users need help: which filter is too restrictive? Suggest relaxing criteria. Silent "no results" with no guidance causes abandonment. | LOW | Already partially built (shows "No elections found" with "Clear filters" button). Enhance with: which filters are active, suggestion to broaden search, count of total unfiltered results. |
| URL-persisted filter state | Filters must survive page reload, browser back/forward, and link sharing. "Search params are state" (TanStack Router philosophy). Current implementation uses Zustand store which loses state on refresh. | MEDIUM | Migrate from Zustand store to TanStack Router `validateSearch` with Zod schema. Already proven pattern in this codebase (see `ParticipantUrlParams` on the participation tab). |
| Pagination reset on filter change | Changing a filter while on page 5 must snap back to page 1. Users expect this; showing "page 5 of 2" is confusing. | LOW | Already implemented in current code (`updateFilters` calls `setPage(1)`). Preserve when migrating to URL state. |

### Differentiators (Competitive Advantage)

Features that make this tool notably better than Ballotpedia's browse-by-category approach or Vote411's address-only lookup. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Geographic context pre-filtering | When a user navigates from a county/district page to elections, auto-apply that geography as a filter (not just highlight). Currently highlights matching rows but doesn't filter server-side. | MEDIUM | Requires API `county` or `district` param. Navigation context store already tracks `stateAbbrev` + `countyName`. Convert from client-side highlighting to server-side filtering when API supports it. Feature-detect. |
| Registration/early voting status filters | Boolean filters for "registration still open" and "early voting active" help voters find actionable elections right now. API already supports these but UI doesn't expose them. | LOW | API already accepts `registration_open` and `early_voting_active` as boolean params. Add two toggle/switch controls. Quick win for voter utility. |
| Feature-detection for API capabilities | UI that gracefully adapts as the backend gains new filter params. Send the param, check if results differ from unfiltered (or check for error). Show filter control only when API supports it. | MEDIUM | Novel pattern for this codebase. Probe on initial load: send test param, compare response. Cache capability flags in a Zustand store or TanStack Query entry. Allows shipping UI before API is ready. |
| Keyboard-navigable filter bar | Power users (researchers, analysts) work with keyboard. Tab between filters, type to search within dropdowns, Enter to apply. | LOW | shadcn/ui Select and Input already support keyboard. Ensure logical tab order, add aria-labels (already done in ParticipantFilters). Low effort, high polish. |
| Sort controls (date, name, relevance) | Beyond filtering, sorting by different criteria helps users orient. Default: date DESC. Options: name A-Z, date ASC. When search is active, relevance sort becomes meaningful. | LOW | Client-side sort already implemented in `useElections` hook. Expose as UI control. If API supports `sort` param later, forward it. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems in this specific context.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Infinite scroll | "Modern" feel, no clicking Next | Breaks URL state (can't share "I'm at item 347"). Bad for accessibility (screen readers). Performance degrades with 1K+ DOM nodes. PROJECT.md explicitly excludes this. | Keep pagination at 25/page. With good filters, users rarely need to page past page 2. |
| Collapsible/sidebar filter panel | Common on e-commerce sites with 20+ filter dimensions | This app has 6-8 filters, not 20+. Collapsing hides them from power users who want direct access. Mobile already wraps inline filters well. PROJECT.md explicitly excludes sidebar and collapse. | All filters visible inline, wrapping naturally on smaller screens. |
| Real-time "live" filter updates (no Apply button) | Immediate feedback feels responsive | With server-side search, every keystroke fires an API call. Debounce solves this for text search, but multi-filter scenarios (setting 3 filters quickly) cause 3 sequential API calls with intermediate states. | Debounce text input (300ms). Dropdown/select changes apply immediately (they're a single action, not continuous input). This hybrid approach gives immediate feedback without excessive API calls. |
| Client-side race category derivation | Avoids API dependency | The existing `categorizeRace()` function parses district name strings with fragile heuristics. Fails for edge cases (Commissioner, Board of Education, Public Service Commission all fall to "local"). PROJECT.md explicitly prefers API field. | Request `race_category` as an API field. Use client-side derivation only as temporary fallback with a warning badge. |
| Faceted search with result counts per filter value | Shows "General (234) / Primary (89)" next to each option | Requires the API to return facet counts, which is a significant backend feature (essentially running the query N times with each filter value). Over-engineering for 6-8 filters. | Show total result count prominently. Individual filter counts are a future API enhancement if needed. |
| Saved/bookmarked filter presets | "Save my favorite filter combination" | Requires user account persistence, storage, and management UI. Over-engineering for the current user base and project scope. | URL-persisted filters already enable bookmarking and sharing via the browser's native bookmark feature. |
| Full-text search across description/metadata | Search not just election name but description, purpose, eligibility text | Requires full-text indexing on the backend. The `q` param should search name and district (the two user-visible identifiers). Searching metadata bloats results with irrelevant matches. | Keep `q` scoped to name + district. If users need description search, that's a separate feature request. |

## Feature Dependencies

```
[URL-persisted filter state]
    |-- requires --> [TanStack Router validateSearch + Zod schema]
    |-- enables  --> [Shareable filter links]
    |-- enables  --> [Browser back/forward with filters]

[Server-side text search (q param)]
    |-- requires --> [API q param support]
    |-- requires --> [Debounced input (300ms)]
    |-- replaces --> [Client-side search on current page]

[Date range filter]
    |-- requires --> (nothing, API already supports date_from/date_to)
    |-- enhances --> [Election date exact filter] (coarser grain)

[Election date exact filter]
    |-- requires --> [API election_date param]
    |-- enhances --> [Date range filter] (finer grain, specific day)

[Race category filter]
    |-- requires --> [API race_category field on Election records]
    |-- replaces --> [Client-side categorizeRace() heuristic]

[Geographic filter (county/district)]
    |-- requires --> [API county and/or district params]
    |-- enhances --> [Geographic context pre-filtering]

[Feature-detection for API capabilities]
    |-- requires --> (nothing, pure client-side logic)
    |-- enables  --> [Server-side text search]
    |-- enables  --> [Election date exact filter]
    |-- enables  --> [Race category filter]
    |-- enables  --> [Geographic filter]

[Active filter chips]
    |-- requires --> [URL-persisted filter state] (reads from URL params)
    |-- enhances --> [Every filter] (makes active state visible)

[Registration/early voting toggles]
    |-- requires --> (nothing, API already supports these)

[Result count display]
    |-- requires --> (nothing, API already returns total)
```

### Dependency Notes

- **Feature-detection enables all Phase 2 filters:** The feature-detection pattern must be built before (or alongside) any filter that requires new API params. It's the key enabler for shipping UI before the backend is ready.
- **URL state is foundational:** Migrating from Zustand to TanStack Router search params should happen first because every filter control needs to read/write URL state. Doing this after building filters means rewriting each control.
- **Date range and election date are complementary, not conflicting:** Date range answers "what's happening this month?" while election date answers "show me just November 5th." Both are useful; implement date range first (already API-supported).
- **Active filter chips require URL state:** Chips read from the URL search params to display what's active. Building chips before URL migration means they'd read from Zustand, then need rewriting.

## MVP Definition

### Launch With (v1 -- Phase 1: Existing API filters)

Minimum viable improvement using only filters the API already supports.

- [ ] URL-persisted filter state via TanStack Router `validateSearch` -- foundational; every other feature depends on this
- [ ] Date range filter (date_from / date_to) -- highest-impact filter the API already supports but UI ignores
- [ ] Registration open toggle -- quick boolean toggle, API-supported
- [ ] Early voting active toggle -- quick boolean toggle, API-supported
- [ ] Result count display ("Showing X of Y elections") -- trivial to implement, large UX improvement
- [ ] Active filter chips with individual removal and "Clear all" -- makes multi-filter state visible and manageable
- [ ] Improved empty state with filter guidance -- low effort, prevents user confusion

### Add After Validation (v1.x -- Phase 2: New API filters via feature-detection)

Features that require backend changes, shipped with graceful degradation.

- [ ] Feature-detection probe infrastructure -- test if API responds to new params; gate filter visibility
- [ ] Server-side text search (q param) -- replaces broken client-side search; the single biggest discovery improvement
- [ ] Race category filter -- with feature-detection, shows when API field is available
- [ ] Election date exact filter -- specific day selection, complementing the date range
- [ ] Geographic filter (county/district) -- narrows to a specific geography, extends navigation context

### Future Consideration (v2+)

Features to defer until core filtering is solid.

- [ ] Sort controls (date, name, relevance) -- useful but not blocking; default sort is already good
- [ ] Faceted counts per filter value -- requires API support, nice-to-have not need-to-have
- [ ] Advanced geographic filtering (map-based selection) -- complex, requires new UI paradigm
- [ ] Keyboard shortcuts for common filter actions -- polish after core is stable

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| URL-persisted filter state | HIGH | MEDIUM | P1 |
| Date range filter (date_from/date_to) | HIGH | LOW | P1 |
| Server-side text search (q param) | HIGH | MEDIUM | P1 |
| Result count display | MEDIUM | LOW | P1 |
| Active filter chips + "Clear all" | HIGH | LOW | P1 |
| Registration open toggle | MEDIUM | LOW | P1 |
| Early voting active toggle | MEDIUM | LOW | P1 |
| Empty state with filter guidance | MEDIUM | LOW | P1 |
| Feature-detection infrastructure | HIGH | MEDIUM | P1 |
| Race category filter | HIGH | MEDIUM | P2 |
| Election date exact filter | MEDIUM | MEDIUM | P2 |
| Geographic filter (county/district) | MEDIUM | MEDIUM | P2 |
| Sort controls | LOW | LOW | P2 |
| Geographic context auto-filtering | MEDIUM | LOW | P3 |
| Faceted result counts | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have -- either already API-supported or foundational infrastructure
- P2: Should have -- requires API changes, shipped via feature-detection
- P3: Nice to have -- future consideration after core filtering works

## Competitor Feature Analysis

| Feature | Ballotpedia | Vote411 | BallotReady | Our Approach |
|---------|-------------|---------|-------------|--------------|
| Entry point | Browse by year/office type, then drill into state | Address-based ballot lookup | Address-based personalized ballot | Filter-driven discovery across all races. No address requirement. |
| Geographic filtering | State dropdown, then browse by district type | State + multi-select checkbox | Single address lookup | Server-side county/district filter param. Auto-populate from navigation context. |
| Date/time filtering | Browse by year, elections calendar | N/A (shows upcoming elections for your address) | N/A (shows your current ballot) | Date range picker + exact election date. Unique advantage for researchers. |
| Race category | Hierarchical navigation: federal > state > local | Not applicable (shows your specific ballot) | Categories on personalized ballot | Flat filter dropdown: federal/state senate/state house/local. |
| Text search | Wiki-style search across all content | State + topic search (not race-level) | N/A | Server-side `q` param across election name + district. |
| Result counts | Page-level counts on wiki pages | Not shown | Not shown | Total count + "X of Y" display. Feedback loop for filter effectiveness. |
| URL shareability | Every page has a unique URL | Address-specific (not shareable) | Address-specific | All filter state in URL params. Shareable, bookmarkable filter views. |

**Key insight:** Ballotpedia, Vote411, and BallotReady are all voter-facing tools optimized for "what's on MY ballot?" Our tool is researcher/analyst-facing, optimized for "what contests exist across this geography?" This is a fundamentally different use case that demands filter-driven discovery rather than address-based lookup.

## Sources

- [Enterprise Filter UX Patterns & Best Practices -- Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-filtering)
- [Filtering UX -- Smart Interface Design Patterns (Smashing Magazine)](https://smart-interface-design-patterns.com/articles/filtering-ux/)
- [Search Params Are State -- TanStack Blog](https://tanstack.com/blog/search-params-are-state)
- [Faceted Search Best Practices -- BrokenRubik](https://www.brokenrubik.com/blog/faceted-search-best-practices)
- [Helpful Filter Categories and Values for Better UX -- NN/g](https://www.nngroup.com/articles/filter-categories-values/)
- [Date Range Picker for shadcn -- John Polacek](https://github.com/johnpolacek/date-range-picker-for-shadcn)
- [TanStack Pacer Debouncing Guide](https://tanstack.com/pacer/latest/docs/guides/debouncing)
- [Search UX Best Practices 2026 -- Design Monks](https://www.designmonks.co/blog/search-ux-best-practices)
- [Filter UI Design Best Practices -- Algolia](https://www.algolia.com/blog/ux/search-filter-ux-best-practices)
- [Filter Chips -- Good Practices Design](https://goodpractices.design/components/filter-chips)
- [Elections -- Ballotpedia](https://ballotpedia.org/Elections)
- [Search by State & Topic -- VOTE411](https://www.vote411.org/search-by-topic)
- [Sample Ballot Lookup Tools -- Ballotpedia](https://ballotpedia.org/Sample_ballot_lookup_tools)
- [Date Filter UI Patterns -- Evolving Web](https://evolvingweb.com/blog/most-popular-date-filter-ui-patterns-and-how-decide-each-one)

---
*Feature research for: Election discovery & large-list filtering UX*
*Researched: 2026-03-13*
