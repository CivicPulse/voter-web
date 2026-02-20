# Research: Multi-State & Multi-County URL Routing

**Date**: 2026-02-20 | **Branch**: `004-multi-county-routes`

## R1: Route Disambiguation Strategy

**Decision**: Use TanStack Router's segment-count-based disambiguation — each route variant has a different number of path segments, so the router selects the correct file without ambiguity.

**Rationale**: TanStack Router matches literal segments first, then parametrized routes by segment count. All new district routes have unique segment counts (1, 2, 3, 4 segments after `/districts/`), and the new `/$state` route at root level cannot collide with existing literal routes because all state abbreviations are 2-letter lowercase strings while existing routes use longer names.

**Route segment mapping:**

| URL Pattern | Segments after prefix | Route File | Purpose |
| ----------- | ----- | ---------- | ------- |
| `/districts/{uuid}` | 1 | `districts/$districtId.tsx` | UUID backward compat (existing) |
| `/districts/{type}/{name}` | 2 | `districts/$type/$name.tsx` | Legacy slug redirect/disambiguate (existing, modify) |
| `/districts/{state}/{type}/{name}` | 3 | `districts/$state/$type/$name.tsx` | State-level district (new) |
| `/districts/{state}/{county}/{type}/{name}` | 4 | `districts/$state/$county/$type/$name.tsx` | County-level district (new) |
| `/counties/{uuid}` | 1 | `counties/$countyId.tsx` | UUID backward compat (existing, modify to redirect) |
| `/counties/{state}/{county}` | 2 | `counties/$state/$county.tsx` | Slug county page (existing) |
| `/{state}` | 1 | `$state.tsx` | State detail page (new) |

**Alternatives considered:**
- Splat routes (`$.tsx`) with manual parsing: Rejected — loses type safety and route-level code splitting.
- Single parameterized route with runtime parsing: Rejected — TanStack Router doesn't support optional segments well.
- Nested layout routes (`districts/$state.tsx` as layout): Rejected — adds unnecessary layout wrapping with no shared UI.

## R2: Available States Discovery

**Decision**: Derive available states client-side from the existing county boundary GeoJSON, extracting unique state FIPS codes from `boundary_identifier` fields.

**Rationale**: The county GeoJSON (`GET /boundaries/geojson?boundary_type=county`) already returns all counties. Each county feature's `boundary_identifier` starts with the 2-digit state FIPS code (e.g., `"13021"` → state `"13"` → `"ga"`). The existing `FIPS_TO_ABBREV` mapping in `src/lib/states.ts` covers all 50 states + DC. No new backend endpoint is needed.

**Implementation**: A new `useAvailableStates()` hook that depends on `useCountyBoundaries()` and extracts unique state abbreviations from the loaded county GeoJSON. When only one state exists, the home page auto-redirects to that state's page.

**Alternatives considered:**
- New `GET /states` API endpoint: Rejected — adds backend dependency for data already available client-side.
- Hardcoded state list: Rejected — violates SC-004 (zero frontend code changes for new state data).

## R3: District Scope Classification

**Decision**: Use the `county` field from boundary feature properties to classify districts at URL generation time. If `county` is present (non-null), the district is county-scoped; if absent, it is state-scoped.

**Rationale**: The API already returns `county: string | null` on every boundary feature. This is the most data-driven approach and automatically classifies new boundary types without code changes. Replaces the hardcoded `STATEWIDE_TYPES` set for URL generation (the existing set can remain for overlay filtering but is not used for routing decisions).

**Alternatives considered:**
- Hardcoded `STATEWIDE_TYPES` set: Rejected — requires code changes when new boundary types are added.
- New API field `scope: "state" | "county"`: Rejected — adds backend dependency for information already inferrable from existing data.

## R4: Legacy URL Resolution Strategy

**Decision**: Handle legacy URLs in-route using TanStack Query data fetching, then perform client-side navigation (replace history) to the fully-qualified URL.

**Rationale**: Since this is a client-side SPA with no server-side rendering, true HTTP 301 redirects are not possible. Instead, legacy route components will:
1. Fetch boundary data to resolve the slug to state/county context.
2. If exactly one match: `navigate({ to: newUrl, replace: true })` — replaces the current history entry.
3. If multiple matches: render a disambiguation page with links.
4. If no match: render a "not found" page.

This maintains the user experience of a redirect (URL changes, back button works correctly) while being implementable in a pure SPA.

**Alternatives considered:**
- Cloudflare Pages `_redirects` file: Rejected — cannot perform data-dependent redirects (needs to know which state/county a UUID belongs to).
- Server-side redirect middleware: Rejected — no server component in this SPA architecture.

## R5: Map Component Generalization

**Decision**: Rename `GeorgiaCountyMap` to `StateCountyMap` and parameterize the initial map bounds.

**Rationale**: The component is already generic except for two hardcoded constants (`GA_CENTER` and `GA_ZOOM`). All other map components (`CountyDetailMap`, `DistrictDetailMap`) already auto-fit to data bounds via `geometryToLeafletBounds()`. The state map should do the same — compute the bounding box of all county features using Turf.js `bbox()` and `fitBounds()`.

**Georgia-specific hardcoding inventory (all resolved by this approach):**

| File | Hardcoded Value | Resolution |
| ---- | --------------- | ---------- |
| `GeorgiaCountyMap.tsx` | `GA_CENTER`, `GA_ZOOM`, component name | Rename to `StateCountyMap`; auto-fit bounds from data |
| `CountyDetailMap.tsx` | `GA_CENTER`, `GA_ZOOM` initial values | Replace with neutral default; auto-fit on data load |
| `DistrictDetailMap.tsx` | `GA_CENTER`, `GA_ZOOM` initial values | Same as above |
| `src/routes/index.tsx` | `fipsState="13"`, `stateName="Georgia"`, drawer title | Derive from state data; move to `$state.tsx` |
| `src/routes/index.tsx` | `homeSearchSchema` overlay enum | Remove; derive from `useBoundaryTypes()` |
| `DistrictDetailContent.tsx` | `psc` in `boundaryTypeLabels` | Keep as display label — add fallback for unknown types |
| `LayerBar.tsx` | `"County"` in label text | Accept `jurisdictionUnit` prop with default `"County"` |

**Alternatives considered:**
- Create state-specific map components per state: Rejected — duplicates code, violates SC-004.
- Use a static map configuration file per state: Rejected — over-engineering; auto-fit bounds handles all states.

## R6: Static GeoJSON Build Script

**Decision**: No changes needed to `scripts/fetch-geojson.mjs` for initial multi-state rollout.

**Rationale**: The build script already fetches all boundary types from the API and writes GeoJSON to `public/geojson/`. When multi-state data is added to the backend, the script will automatically include all states' boundaries in the cached files. The 20MB file size limit provides a safety valve. The `fetchStaticGeoJSON()` client function gracefully falls back to the API if a static file is missing or too large.

**Future consideration**: If county GeoJSON grows beyond 20MB with many states, the script could be extended to produce per-state files (e.g., `public/geojson/county-ga.json`). This is not needed for the initial 2-5 state rollout.

## R7: `districtSlugPath` Update

**Decision**: Update `districtSlugPath()` in `src/lib/slugs.ts` to accept `county` (nullable) and `stateAbbrev` parameters, generating the appropriate URL depth based on district scope.

**New signature:**
```
districtSlugPath(name: string, boundaryType: string, stateAbbrev: string, county: string | null): string
```

**Behavior:**
- If `county` is non-null: `/districts/{state}/{countySlug}/{typeSlug}/{nameSlug}` (4 segments)
- If `county` is null: `/districts/{state}/{typeSlug}/{nameSlug}` (3 segments)

**Rationale**: Matches the data-driven district scope classification (R3). All callers of `districtSlugPath` will need to pass the state abbreviation and county association from the boundary feature data.

## R8: State Page Content

**Decision**: The state detail page (`/$state`) reuses the existing map and drawer pattern from the current home page, parameterized by state.

**Content:**
- `StateCountyMap` (renamed from `GeorgiaCountyMap`) displaying county boundaries for the selected state
- Active election banner
- District overlay layer bar (statewide types only)
- Bottom drawer with:
  - US Senate elected officials for the state
  - State census profile (ACS demographics via Census API)
- All data driven by the `$state` param (FIPS lookup → API calls)

**Rationale**: This exactly matches the current home page for Georgia but generalizes to any state. The components (`ElectedOfficialsCard`, `StateCensusProfileCard`) already accept state-specific props — only the route call site is hardcoded today.
