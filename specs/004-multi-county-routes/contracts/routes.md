# Route Contracts: Multi-State & Multi-County URL Routing

**Date**: 2026-02-20

## New Routes

### `GET /$state` — State Detail Page

**File**: `src/routes/$state.tsx`
**Path params**: `{ state: string }` — 2-letter lowercase state abbreviation
**Search params**: `{ overlay?: string }` — optional boundary type for district overlay
**Validation**: `params.parse` validates `state` against `ABBREV_TO_FIPS` keys; throws on invalid (triggers error boundary)
**Component**: Renders `StateCountyMap` with county boundaries filtered to the given state
**Data dependencies**:
- `useCountyBoundaries()` → filter by state FIPS prefix
- `useBoundaryTypeGeoJSON(overlay, null)` → statewide overlay if selected
- `useActiveElections()`
- `useElectedOfficialsByBoundaryType(overlay)`

**Examples**:
- `/ga` → Georgia state page
- `/al?overlay=congressional` → Alabama with congressional overlay

---

### `GET /districts/$state/$type/$name` — State-Level District

**File**: `src/routes/districts/$state/$type/$name.tsx`
**Path params**: `{ state: string, type: string, name: string }`
**Validation**: `state` validated against `ABBREV_TO_FIPS`; `type` converted from slug to underscore (`state-senate` → `state_senate`)
**Component**: Resolves district UUID via `useDistrictSlugResolverScoped(state, null, type, name)`, then renders `DistrictDetailContent`
**Data dependencies**:
- `useBoundaryTypeGeoJSON(boundaryType, null)` → all features of this type
- Filter by state FIPS + name slug match

**Examples**:
- `/districts/ga/state-senate/018` → Georgia State Senate District 018
- `/districts/ga/congressional/district-5` → Georgia Congressional District 5

---

### `GET /districts/$state/$county/$type/$name` — County-Level District

**File**: `src/routes/districts/$state/$county/$type/$name.tsx`
**Path params**: `{ state: string, county: string, type: string, name: string }`
**Validation**: `state` validated; `county` matched via slug against county features
**Component**: Resolves district UUID via `useDistrictSlugResolverScoped(state, county, type, name)`, then renders `DistrictDetailContent`
**Data dependencies**:
- `useBoundaryTypeGeoJSON(boundaryType, null)` → all features of this type
- Filter by state FIPS + county slug + name slug match

**Examples**:
- `/districts/ga/bibb/county-commission/005` → Bibb County Commission District 005
- `/districts/ga/houston/county-commission/005` → Houston County Commission District 005

---

## Modified Routes

### `GET /` — Home Page (Modified)

**File**: `src/routes/index.tsx`
**Current behavior**: Hardcoded Georgia county map
**New behavior**:
- Calls `useAvailableStates()` to discover available states
- If 1 state: renders that state's county map inline (functionally identical to current)
- If N states: renders `StateSelectionPage` with links to `/$state`
**Search params**: `{ overlay?: string }` — kept but enum validation removed (derived from data)

---

### `GET /districts/$type/$name` — Legacy District Slug (Modified)

**File**: `src/routes/districts/$type/$name.tsx`
**Current behavior**: Resolves slug → UUID → renders `DistrictDetailContent`
**New behavior**:
- Calls `useDistrictDisambiguation(type, name)` to find all matching boundaries
- If 1 match: `navigate(fullyQualifiedUrl, { replace: true })` — client-side redirect
- If N matches: render `DisambiguationPage` listing matches with fully-qualified links
- If 0 matches: render not-found page

---

### `GET /counties/$countyId` — Legacy UUID County (Modified)

**File**: `src/routes/counties/$countyId.tsx`
**Current behavior**: Renders `CountyDetailContent` directly
**New behavior**:
- Fetches boundary detail via `useCountyBoundary(countyId)` to resolve state + county name
- If resolved: `navigate({ to: "/counties/$state/$county", params: { state, county } }, { replace: true })` — client-side redirect
- If not found: render not-found page
- Search params (`overlay`) are preserved through the redirect

---

## Unchanged Routes

| Route | Reason |
| ----- | ------ |
| `GET /counties/$state/$county` | Already correct URL pattern |
| `GET /districts/$districtId` | UUID is globally unique — no collision |
| `GET /elections/*` | Not geographic-scoped in this feature |
| `GET /voters/*` | Uses filter-based scoping (P3) |
| `GET /admin/*` | Not geographic |
| `GET /about` | Static page |
| `GET /login` | Auth page |
| `GET /lookup/*` | Address-based, not route-scoped |

---

## API Endpoints Consumed (No Backend Changes)

All existing endpoints are used as-is. No new backend endpoints required.

| Endpoint | Usage in New Routes |
| -------- | ------------------- |
| `GET /boundaries/types` | Available overlay types for state page |
| `GET /boundaries/geojson?boundary_type=county` | Available states discovery; county map rendering |
| `GET /boundaries/geojson?boundary_type={type}` | District slug resolution (all states) |
| `GET /boundaries/geojson?boundary_type={type}&county={name}` | County-filtered overlays |
| `GET /boundaries/{id}` | UUID-based county redirect (resolve state/county) |
| `GET /elections?status=active` | Active election banners on state page |
| `GET /elected-officials?boundary_type={type}` | State page officials |
