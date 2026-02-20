# Data Model: Multi-State & Multi-County URL Routing

**Date**: 2026-02-20 | **Branch**: `004-multi-county-routes`

## Overview

This feature is frontend-only — no new database tables or API schemas are created. The data model describes the TypeScript types, route parameter shapes, and data flow through the routing layer.

## Route Parameter Types

### State Page Route (`/$state`)

```typescript
// Params
interface StateRouteParams {
  state: string  // 2-letter lowercase state abbreviation (e.g., "ga")
}

// Validated via params.parse — reject non-matching values
// Valid: /ga, /al, /ny
// Invalid: /xx, /georgia, /GA (case-sensitive)
```

### State-Level District Route (`/districts/$state/$type/$name`)

```typescript
interface StateDistrictRouteParams {
  state: string  // 2-letter lowercase state abbreviation
  type: string   // boundary type slug (e.g., "state-senate", "congressional")
  name: string   // district name slug (e.g., "018", "district-5")
}
```

### County-Level District Route (`/districts/$state/$county/$type/$name`)

```typescript
interface CountyDistrictRouteParams {
  state: string   // 2-letter lowercase state abbreviation
  county: string  // county name slug (e.g., "bibb", "de-kalb")
  type: string    // boundary type slug (e.g., "county-commission", "school-board")
  name: string    // district name slug (e.g., "005", "district-1")
}
```

## New Hook Types

### `useAvailableStates()`

```typescript
interface StateInfo {
  abbreviation: string   // "ga", "al"
  fipsCode: string       // "13", "01"
  countyCount: number    // number of counties with data loaded
}

// Return type
interface UseAvailableStatesResult {
  states: StateInfo[]
  isLoading: boolean
  isSingleState: boolean      // convenience: states.length === 1
  defaultState: StateInfo | undefined  // first state when single
}
```

**Data source**: Derived from `useCountyBoundaries()` — extracts unique 2-digit FIPS prefixes from `boundary_identifier` fields, maps to abbreviations via `FIPS_TO_ABBREV`, counts counties per state.

### Updated `useDistrictSlugResolver()`

```typescript
// Current signature (will be kept for legacy route)
function useDistrictSlugResolver(typeSlug: string, nameSlug: string): SlugResolution

// New overload for multi-state resolution
function useDistrictSlugResolverScoped(
  stateAbbrev: string,
  countySlug: string | null,  // null for state-level districts
  typeSlug: string,
  nameSlug: string,
): SlugResolution

interface SlugResolution {
  districtId: string | undefined
  isLoading: boolean
  isNotFound: boolean
}
```

**Key change**: The scoped version filters boundary features by state FIPS prefix and (optionally) county name before matching the district slug.

### `useDistrictDisambiguation()`

```typescript
interface DisambiguationMatch {
  districtId: string
  name: string
  boundaryType: string
  county: string | null
  stateAbbrev: string
  fullyQualifiedUrl: string  // the correct new-format URL
}

interface UseDistrictDisambiguationResult {
  matches: DisambiguationMatch[]
  isLoading: boolean
  isSingleMatch: boolean
}
```

**Data source**: Used by the legacy `/districts/$type/$name` route. Fetches all boundaries of the given type and finds all features with matching name slug. Maps each to its fully-qualified URL using state FIPS and county association.

## Updated Utility Types

### `districtSlugPath()` — updated signature

```typescript
// Old (kept for backward compat but deprecated)
function districtSlugPath(name: string, boundaryType: string): string

// New
function districtSlugPath(
  name: string,
  boundaryType: string,
  stateAbbrev: string,
  county: string | null,
): string

// Returns:
// county non-null → /districts/{state}/{countySlug}/{typeSlug}/{nameSlug}
// county null     → /districts/{state}/{typeSlug}/{nameSlug}
```

## Existing Types (No Changes)

These existing types are consumed as-is by the new routing logic:

- **`BoundaryFeatureProperties`** (`src/types/boundary.ts`): Provides `county: string | null` field used for scope classification and `boundary_identifier` for FIPS extraction.
- **`BoundaryDetailResponse`** (`src/types/boundary.ts`): Full boundary detail including geometry. Used by UUID routes.
- **`CountyFeatureCollection`** / **`BoundaryFeatureCollection`** (`src/types/boundary.ts`, `src/types/boundaries.ts`): GeoJSON FeatureCollections for county and district boundaries.
- **`FIPS_TO_ABBREV`** / **`ABBREV_TO_FIPS`** (`src/lib/states.ts`): 50-state + DC FIPS↔abbreviation lookup. Already complete.

## Data Flow Diagrams

### New URL → Content

```
User visits /districts/ga/bibb/county-commission/005
  → TanStack Router matches districts/$state/$county/$type/$name.tsx (4 segments)
  → Route extracts params: { state: "ga", county: "bibb", type: "county-commission", name: "005" }
  → useDistrictSlugResolverScoped("ga", "bibb", "county-commission", "005")
    → useBoundaryTypeGeoJSON("county_commission", null) — all county_commission boundaries
    → Filter: feature.boundary_identifier starts with FIPS for "ga" (= "13")
    → Filter: feature.county === "Bibb" (matched via slugify)
    → Find: slugify(feature.name) === "005"
    → Return: { districtId: feature.id }
  → DistrictDetailContent renders with resolved UUID
```

### Legacy URL → Redirect

```
User visits /districts/county-commission/005 (old format)
  → TanStack Router matches districts/$type/$name.tsx (2 segments)
  → useDistrictDisambiguation("county-commission", "005")
    → Fetch all county_commission boundaries
    → Find all features where slugify(name) === "005"
    → If 1 match: navigate(districtSlugPath(...), { replace: true })
    → If N matches: render DisambiguationPage with N links
    → If 0 matches: render NotFound
```

### Home Page → State Selection

```
User visits / (home page)
  → useAvailableStates()
    → useCountyBoundaries() — fetches all county GeoJSON
    → Extract unique state FIPS prefixes → map to abbreviations
    → Return: [{ abbreviation: "ga", fipsCode: "13", countyCount: 159 }]
  → If 1 state: render StateCountyMap for that state (current Georgia behavior)
  → If N states: render StateSelectionPage with state list/cards
```
