# Quickstart: Multi-State & Multi-County URL Routing

**Date**: 2026-02-20 | **Branch**: `004-multi-county-routes`

## Implementation Sequence

The feature is broken into 5 phases, each independently testable and committable. Earlier phases unlock later ones but each delivers standalone value.

---

### Phase A: Foundation — Utilities & Hooks (No Route Changes)

**Goal**: Build the data layer without changing any visible behavior.

1. **Update `src/lib/slugs.ts`**
   - Add new `districtSlugPath(name, boundaryType, stateAbbrev, county)` overload
   - County-level: `/districts/{state}/{countySlug}/{typeSlug}/{nameSlug}`
   - State-level: `/districts/{state}/{typeSlug}/{nameSlug}`
   - Keep old 2-arg signature working (deprecated)

2. **Create `src/hooks/useAvailableStates.ts`**
   - Depends on `useCountyBoundaries()`
   - Extracts unique state FIPS from `boundary_identifier` fields
   - Maps to `{ abbreviation, fipsCode, countyCount }[]`
   - Exposes `isSingleState` convenience flag

3. **Create `src/hooks/useDistrictSlugResolverScoped.ts`**
   - Accepts `stateAbbrev`, `countySlug | null`, `typeSlug`, `nameSlug`
   - Filters boundary features by state FIPS prefix and county association
   - Returns `{ districtId, isLoading, isNotFound }`

4. **Create `src/hooks/useDistrictDisambiguation.ts`**
   - Accepts `typeSlug`, `nameSlug`
   - Finds ALL matching boundaries (any state, any county)
   - Returns `{ matches: DisambiguationMatch[], isLoading, isSingleMatch }`

5. **Write unit tests for all new utilities and hooks** (95% coverage)

**Commit**: `feat(routing): add multi-state slug utilities and hooks`

---

### Phase B: New Routes — State Page & Scoped Districts

**Goal**: Add the new URL routes. Old routes still work as before.

1. **Rename `GeorgiaCountyMap.tsx` → `StateCountyMap.tsx`**
   - Remove `GA_CENTER` / `GA_ZOOM` hardcoding
   - Auto-fit map bounds to data bbox using `geometryToLeafletBounds()`
   - Accept state-filtered county features as prop

2. **Create `src/routes/$state.tsx`** (state detail page)
   - Validate `$state` param against `ABBREV_TO_FIPS`
   - Filter county boundaries by state FIPS
   - Render `StateCountyMap`, active election banner, layer bar, drawer
   - Drawer: `ElectedOfficialsCard` + `StateCensusProfileCard` using state FIPS

3. **Create `src/routes/districts/$state/$type/$name.tsx`** (state-level)
   - Use `useDistrictSlugResolverScoped(state, null, type, name)`
   - Render `DistrictDetailContent` with resolved UUID

4. **Create `src/routes/districts/$state/$county/$type/$name.tsx`** (county-level)
   - Use `useDistrictSlugResolverScoped(state, county, type, name)`
   - Render `DistrictDetailContent` with resolved UUID

5. **Update `CountyDetailMap.tsx` and `DistrictDetailMap.tsx`**
   - Replace `GA_CENTER`/`GA_ZOOM` with a neutral default (world center)
   - Keep `fitBounds` behavior (already works for any state)

6. **Write unit tests for new route components**

**Commit**: `feat(routing): add state page and scoped district routes`

---

### Phase C: Legacy URL Resolution — Redirects & Disambiguation

**Goal**: Existing URLs redirect to new fully-qualified URLs.

1. **Modify `src/routes/districts/$type/$name.tsx`**
   - Replace direct `DistrictDetailContent` rendering with disambiguation logic
   - Single match → `navigate(fullyQualifiedUrl, { replace: true })`
   - Multiple matches → render `DisambiguationPage`
   - No matches → render not-found

2. **Create `src/components/DisambiguationPage.tsx`**
   - Receives array of `DisambiguationMatch`
   - Renders a list with state/county/district info and links
   - Clean design using shadcn/ui `Card` components

3. **Modify `src/routes/counties/$countyId.tsx`**
   - Fetch boundary detail to resolve state + county name
   - Redirect to `/counties/$state/$county` with `replace: true`
   - Preserve `overlay` search param through redirect

4. **Write unit tests for legacy resolution and disambiguation**
5. **Write E2E tests for legacy URL navigation**

**Commit**: `feat(routing): add legacy URL redirect and disambiguation`

---

### Phase D: Home Page & Navigation Updates

**Goal**: Home page adapts to available states. All navigation links generate correct URLs.

1. **Modify `src/routes/index.tsx`**
   - Use `useAvailableStates()`
   - Single state: render state map inline (current behavior, parameterized)
   - Multiple states: render `StateSelectionPage`
   - Remove hardcoded Georgia values

2. **Create `src/components/StateSelectionPage.tsx`**
   - Displays available states (cards or list)
   - Each state links to `/$state`

3. **Update `src/routes/__root.tsx`**
   - Add `useMatch` for new `/$state` route
   - Add route matching for new district route patterns
   - Update `handleTypeChange` to navigate to `/$state` overlay when on state page
   - Update header title logic for state page

4. **Update `src/components/CountyDetailContent.tsx`**
   - Update district links to use new `districtSlugPath()` with state/county
   - Requires passing state abbreviation from route params or resolving from FIPS

5. **Update `src/components/DistrictDetailContent.tsx`**
   - Update navigation links to use fully-qualified URLs
   - County links use `/counties/$state/$county` format

6. **Update all `OverlayLayer.tsx` popup links**
   - District links from overlay popups must include state/county context
   - Use `districtSlugPath()` with feature's county association

7. **Write unit tests for updated navigation logic**

**Commit**: `feat(routing): update home page and navigation for multi-state`

---

### Phase E: Testing, Polish & Cleanup

**Goal**: Comprehensive test coverage, E2E validation, cleanup.

1. **Write E2E tests**
   - Multi-state home page behavior (single state vs multiple)
   - State page navigation
   - County-level and state-level district URLs
   - Legacy URL redirects (single match and disambiguation)
   - Legacy UUID redirects

2. **Run full test suite**: `npm test -- --run` and `npm run lint`

3. **Visual verification** (Playwright MCP)
   - State page map rendering
   - Disambiguation page layout
   - State selection page (if applicable)

4. **Remove deprecated code paths**
   - Remove old 2-arg `districtSlugPath` signature if all callers updated
   - Remove `STATEWIDE_TYPES` hardcoded set if no longer referenced for routing

5. **Update CLAUDE.md** with new route patterns

**Commit**: `test(routing): add E2E and comprehensive unit tests for multi-state routing`

---

## Key Risks & Mitigations

| Risk | Mitigation |
| ---- | ---------- |
| Large GeoJSON files with many states | Static cache already has 20MB limit with API fallback; monitor file sizes |
| Route parameter collision (e.g., state abbrev matching UUID) | UUIDs contain hyphens and are 36 chars; state abbrevs are exactly 2 lowercase alpha chars — no overlap possible |
| Disambiguation performance (scanning all boundaries) | GeoJSON is cached with 1h staleTime; filtering is O(n) on in-memory array — fast for expected data sizes |
| TanStack Router file-based routing conflicts | All new routes have unique segment counts — verified in research.md |
| Breaking existing URL bookmarks | Legacy routes remain as files; no routes are deleted, only behavior changes from direct render to redirect |
