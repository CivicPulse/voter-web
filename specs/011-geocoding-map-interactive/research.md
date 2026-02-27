# Research: Interactive Geocoding Map

**Feature**: 011-geocoding-map-interactive
**Date**: 2026-02-26

---

## Decision 1: Provider Color Palette Approach

**Decision**: Create a dedicated `PROVIDER_COLORS` mapping (`source_type → hex color`) in `src/lib/provider-colors.ts`, separate from the existing `DISTRICT_COLORS` palette.

**Rationale**: Providers (Nominatim, Google, Census, Photon, USPS, etc.) need stable, named color assignments that differ from boundary overlay colors. Mixing the two palettes causes visual confusion. A named map (`{ nominatim: "#4363d8", google: "#e6194b", ... }`) with a fallback assignment strategy (cycle through remaining colors) is easy to extend.

**Alternatives considered**:
- Reuse `DISTRICT_COLORS` cyclically — rejected because provider colors should be stable by name across sessions, not position-dependent.
- Auto-derive colors at render time — rejected because it makes the legend non-deterministic.

---

## Decision 2: Marker Implementation (DivIcon vs. L.Icon)

**Decision**: Use `L.divIcon` with a small colored circle SVG for non-primary markers, and a larger colored SVG with a ring/outline for the primary marker.

**Rationale**: `L.divIcon` is pure HTML/CSS, avoids external image URLs (CDN dependency for standard marker PNGs), and supports easy color parameterization. The existing `GeocodedLocationMap` already uses `L.Icon` with CDN-hosted PNGs — switching to `divIcon` removes the CDN dependency.

**Alternatives considered**:
- Tinted images via CSS `filter` — rejected because it's imprecise and not supported in all browsers.
- Custom marker PNG per provider — rejected because it requires bundled assets or per-provider CDN URLs.

---

## Decision 3: Jitter Strategy for Overlapping Markers

**Decision**: Apply a deterministic pixel offset per provider index when two or more locations share the same lat/lng within a configurable tolerance (e.g., < 0.0001°). Each provider gets a small circular offset based on its index in the sorted provider list.

**Rationale**: Multiple providers often return the exact census centroid. Without jitter, markers stack invisibly. A deterministic approach (not random) ensures stable rendering on re-render.

**Alternatives considered**:
- Leaflet MarkerCluster — overkill for <10 markers; clusters all nearby markers, hiding individual provider identity.
- Random jitter — non-deterministic; markers shift on each render.

---

## Decision 4: Drag-and-Save API Endpoint

**Decision**: Use the existing `PUT /voters/{voterId}/official-location` endpoint (`setOfficialLocation`) for drag-and-save. This endpoint accepts `{ latitude, longitude }` and updates the voter's official geocoded location.

**Rationale**: The existing endpoint already handles the "set official coordinates" workflow. The spec clarification says "update existing primary record's coordinates in-place", which aligns with what `official-location` does. The `setOfficialLocation` API function and `OfficialLocationRequest` type already exist in the codebase.

**Alternatives considered**:
- New `PATCH /voters/{voterId}/geocoded-locations/{locationId}` — would require a new backend endpoint; using the existing one avoids backend scope creep.
- `addManualLocation` with `set_as_primary: true` — creates a new record, violating FR-008.

**On drag failure**: snap marker back to last saved `[lat, lng]` and show Sonner error toast.

---

## Decision 5: Boundary ID for Overlay Toggle

**Decision**: Enhance `DistrictCheckComparison` (backend response type) to include an optional `boundary_id: string | null` field. This is a **backend contract requirement** (voter-api change needed). The `adaptDistrictCheck` function in `useDistrictCheck.ts` will pass `boundary_id` through to `DistrictComparisonResult`.

**Rationale**: The district check endpoint knows which boundary record matched each comparison. Adding `boundary_id` to comparisons avoids a separate lookup. Without it, the frontend would need to call `GET /boundaries?type=X&search=Y` per row, adding N extra round-trips.

**Alternatives considered**:
- Client-side boundary search (N calls to `GET /boundaries`) — rejected because it's N requests at click time with potential mismatches if multiple boundaries have similar names.
- Include a `boundary_id_map: Record<string, string>` in `DistrictCheckResponse` — slightly cleaner than adding it to each comparison item, but the per-comparison placement is more explicit.

**Frontend changes**: Add `boundary_id: string | null` to `DistrictCheckComparison` in `src/types/voter.ts` and `DistrictComparisonResult` in `src/lib/district-comparison.ts`.

---

## Decision 6: Provider × District Matrix API

**Decision**: Add a new frontend API call to `POST /api/v1/voters/{voter_id}/geocode/check-boundaries` (new voter-api endpoint). Request: `{ locations: [{ provider: string, latitude: number, longitude: number }] }`. Response: `{ results: [{ provider: string, districts: Record<string, string|null> }] }`.

**Rationale**: The spec explicitly calls for a new batch API endpoint. Client-side Turf.js checks were explicitly ruled out in the clarifications. The existing `getDistrictCheck` endpoint only checks the primary location; a multi-coordinate batch endpoint is needed for the matrix.

**Frontend scope**: New type `ProviderBoundaryCheckRequest/Response`, new API function `checkProviderBoundaries`, new hook `useProviderBoundaryCheck`.

---

## Decision 7: State Management for Active Overlays

**Decision**: Maintain `Set<string>` (boundary IDs) as component state in the voter detail page (`$voterId.tsx`), passed down as props to both `DistrictAssignmentsCard` (to know which rows are "active") and `GeocodedLocationMap` (to render GeoJSON layers). TanStack Query caches each `useBoundaryDetail(id)` independently.

**Rationale**: Lifting boundary toggle state to the parent page allows both the card (to show active row highlight) and the map (to render overlays) to stay in sync without a Zustand store (keeps it local to the voter detail page).

**Alternatives considered**:
- Store in `GeocodedLocationMap` only — the card would have no visual feedback of which rows are active.
- Zustand store — overkill for transient page-level UI state.

---

## Decision 8: Overlay GeoJSON Rendering

**Decision**: Reuse the existing `DISTRICT_COLORS` palette (from `src/lib/colors.ts`) for boundary overlays on the geocoding map. Each overlay gets a color by `index % DISTRICT_COLORS.length`. Render as React-Leaflet `<GeoJSON>` with semi-transparent `fillOpacity: 0.25` and a colored border.

**Rationale**: `DISTRICT_COLORS` is already colorblind-friendly and used throughout the app. Consistent use reduces visual inconsistency. The existing `OverlayLayer` component is tied to the `DistrictDetailMap` context and uses elections data — simpler to render GeoJSON directly in `GeocodedLocationMap` using React-Leaflet's `<GeoJSON>` primitive.

---

## Decision 9: Marker Match-Status Color Coding (Story 4)

**Decision**: Add a `matchStatus` prop to each marker: `"all-match" | "any-mismatch" | "mixed" | undefined`. When provider boundary check data is available, color the marker ring/outline: green = all match, red = any mismatch, amber = mixed/partial.

**Rationale**: The ring around the primary marker's provider color provides an additional data dimension without changing the core provider color identity.

**Alternatives considered**:
- Replace provider color with match-status color — loses provider identity.
- Add a separate badge overlay — clutters the map at this zoom level.

---

## Decision 10: Lazy Popup Rendering

**Decision**: React-Leaflet `<Popup>` already renders lazily (only mounts DOM when marker is clicked). No additional work needed for popup lazy rendering; the existing approach is already performant.

---

## Decision 11: Boundary Fetch Debouncing

**Decision**: Use a `useRef`-based debounce (300ms) to delay `queryClient.prefetchQuery` calls on rapid row toggles. TanStack Query already deduplicates in-flight requests for the same `queryKey`, so the debounce guards only the prefetch calls — never the hook invocation itself (React hooks cannot be called from debounced callbacks).

**Rationale**: Given TanStack Query's built-in deduplication, debouncing is a lightweight guard rather than a hard requirement.

---

## Existing Infrastructure Confirmed Available

| Component/Module | Path | Status |
|---|---|---|
| `GeocodedLocationMap` | `src/routes/voters/_components/GeocodedLocationMap.tsx` | Exists, to be enhanced |
| `DistrictAssignmentsCard` | `src/routes/voters/_components/DistrictAssignmentsCard.tsx` | Exists, to be enhanced |
| `DISTRICT_COLORS` palette | `src/lib/colors.ts` | Exists, reuse for overlays |
| `BoundaryDetailResponse` type | `src/types/boundary.ts` | Exists |
| `setOfficialLocation` API | `src/api/voters.ts` | Exists |
| `useSetPrimaryLocation` hook | `src/hooks/useAddressLookup.ts` | Exists |
| `useDistrictCheck` hook | `src/hooks/useDistrictCheck.ts` | Exists, to be enhanced |
| `DistrictCheckComparison` type | `src/types/voter.ts` | Exists, needs `boundary_id` field |
| `getBoundaries` API | `src/lib/api/boundaries.ts` | Exists |
| React-Leaflet `<GeoJSON>` | `react-leaflet` | Available in dep tree |
| Sonner toasts | `sonner` | Already in use |

## Backend Contracts Required (voter-api changes)

1. **`DistrictCheckComparison`**: Add `boundary_id: string | null` field to each comparison item in `GET /voters/{voter_id}/district-check` response.
2. **`POST /voters/{voter_id}/geocode/check-boundaries`**: New endpoint for batch provider × district check. See `contracts/provider-boundary-check.md`.
