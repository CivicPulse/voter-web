# Implementation Plan: Interactive Geocoding Map

**Branch**: `011-geocoding-map-interactive` | **Date**: 2026-02-26 | **Spec**: `specs/011-geocoding-map-interactive/spec.md`
**Input**: Feature specification from `/specs/011-geocoding-map-interactive/spec.md`

## Summary

Enhance the voter detail page geocoding map (Stories 1–4):

1. **Provider-colored markers**: Per-provider `L.divIcon` markers with a stable color palette and map legend.
2. **Draggable primary marker**: Drag-and-save to update official location (`setOfficialLocation` API), with unsaved-change indicator and error-toast snap-back.
3. **District boundary overlays**: Clickable `DistrictAssignmentsCard` rows toggle boundary GeoJSON overlays on the map; multiple overlays supported simultaneously.
4. **Provider × District matrix**: Expand `DistrictAssignmentsCard` with columns per provider showing match/mismatch cells via a new batch boundary-check API endpoint.

## Technical Context

**Language/Version**: TypeScript 5.9+ (strict mode)
**Primary Dependencies**: React 19.2+, React-Leaflet 5.0.0, Leaflet 1.9.4, TanStack Query v5, TanStack Router (file-based), Zustand, ky, shadcn/ui (new-york, neutral), Sonner, Turf.js (@turf/bbox, @turf/boolean-intersects, @turf/helpers), Lucide React
**Storage**: N/A (SPA — all data from voter-api REST at `/api/v1`)
**Testing**: Vitest (unit, jsdom), React Testing Library, Playwright (E2E)
**Target Platform**: Modern browsers (Chrome, Firefox, Safari), SPA deployed to Cloudflare Pages
**Project Type**: Web frontend (single project, `src/` root)
**Performance Goals**: Overlay toggle ≤ 2s (SC-003), matrix load ≤ 10s (SC-004), drag fluid 60fps
**Constraints**: No full page reloads for any interaction (FR-018), 95% unit test coverage required, TypeScript strict mode throughout
**Scale/Scope**: Single voter detail page; max ~10 geocoded locations, ~6 district types, ~6 providers per voter

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Branch-Based Development | ✅ Pass | Branch `011-geocoding-map-interactive` exists, created before code changes |
| II. Pull Request Review | ✅ Pass | Feature will be merged via PR to `main` |
| III. Test Coverage 95% | ✅ Pass | New modules (provider-colors, drag state, overlay toggle logic) require unit tests |
| IV. Code Quality | ✅ Pass | Uses `@/` alias, strict TS, shadcn/ui components, TanStack Query, Leaflet — all established patterns |

**Post-Design Re-check**:
- Complexity in Story 4 (matrix + new API) is justified by spec requirement — noted in Complexity Tracking.
- Story 3 needs backend contract change (`boundary_id` in district-check response) — documented in contracts.
- No constitution violations.

## Project Structure

### Documentation (this feature)

```text
specs/011-geocoding-map-interactive/
├── plan.md              # This file
├── research.md          # Research decisions (Phase 0)
├── data-model.md        # Entity shapes and component props (Phase 1)
├── quickstart.md        # Developer onboarding (Phase 1)
├── contracts/
│   └── provider-boundary-check.md   # API contracts (Phase 1)
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (affected files)

```text
src/
├── lib/
│   ├── provider-colors.ts          # NEW — PROVIDER_COLORS map + getProviderColor()
│   └── colors.ts                   # unchanged (DISTRICT_COLORS reused for overlays)
│
├── types/
│   ├── voter.ts                    # MODIFY: add boundary_id to DistrictCheckComparison;
│   │                               #         add ProviderBoundaryCheck* types
│   └── boundary.ts                 # unchanged (BoundaryDetailResponse already typed)
│
├── lib/
│   └── district-comparison.ts      # MODIFY: add boundaryId to DistrictComparisonResult
│
├── api/
│   ├── voters.ts                   # MODIFY: add checkProviderBoundaries()
│   └── (lookup.ts unchanged — setPrimaryLocation already exists there, no modifications needed)
│       (setOfficialLocation already exists in voters.ts at line 252, no modifications needed)
│
├── lib/api/
│   └── boundaries.ts               # MODIFY: add getBoundaryDetail(id)
│
├── hooks/
│   ├── useAddressLookup.ts         # MODIFY: add useUpdateOfficialLocation() mutation
│   ├── useDistrictCheck.ts         # MODIFY: pass boundary_id through adaptDistrictCheck
│   └── useBoundaries.ts            # NEW — useBoundaryDetail(id) hook
│
└── routes/voters/
    ├── $voterId.tsx                 # MODIFY: overlay state, pass new props to card + map
    └── _components/
        ├── GeocodedLocationMap.tsx  # MODIFY: divIcon colors, drag, GeoJSON overlays, legend
        └── DistrictAssignmentsCard.tsx  # MODIFY: clickable rows, matrix columns

tests/
├── lib/
│   └── provider-colors.test.ts     # NEW unit tests
├── hooks/
│   └── useBoundaries.test.ts       # NEW unit tests
└── routes/voters/_components/
    ├── GeocodedLocationMap.test.tsx      # MODIFY: add tests for new behavior
    └── DistrictAssignmentsCard.test.tsx  # MODIFY: add tests for overlay toggle + matrix

e2e/
├── fixtures/
│   └── mock-data.ts                # MODIFY: add boundary + provider check mock data
└── geocoding-map.spec.ts           # NEW E2E tests (drag, overlay toggle)
```

**Structure Decision**: Single project, `src/` root. All changes are in the existing voter-web React SPA. No new packages needed (React-Leaflet `<GeoJSON>` is already available via react-leaflet dep).

---

## Implementation Phases

### Phase A: Provider-Colored Markers (Story 1)

**Deliverables:**
1. `src/lib/provider-colors.ts` — `PROVIDER_COLORS` map (6 named providers + fallback cycle) + `getProviderColor(sourceType, fallbackIndex)` + `createProviderDivIcon(color, isPrimary)` returning `L.DivIcon`
2. `GeocodedLocationMap.tsx` — replace static icons with per-provider `divIcon`; jitter logic; `MapLegend` sub-component
3. Unit tests: `tests/lib/provider-colors.test.ts`

**Key decisions:**
- Primary marker: larger circle (24px) with white outer ring + provider color fill
- Secondary markers: smaller circle (16px) with provider color fill, 80% opacity
- Jitter: deterministic `offsetByIndex` function — each provider gets a 6px circular offset at a fixed angle
- Legend: small colored dot + provider name, positioned bottom-left of map using `leaflet-bottom leaflet-left` custom control

---

### Phase B: Draggable Primary Marker + Save/Reset (Story 2)

**Deliverables:**
1. `GeocodedLocationMap.tsx` — `draggable={true}` on primary `<Marker>`, `dragend` handler, `DragState` tracking, Save/Reset button strip below map
2. `src/hooks/useAddressLookup.ts` — `useUpdateOfficialLocation(voterId)` mutation wrapping `setOfficialLocation` API
3. On successful save: invalidate `["voters", voterId]` and `["voters", voterId, "district-check"]`
4. On save error: snap marker back via `setLatLng` on marker ref + Sonner error toast
5. Role awareness: `voterId` prop only enables drag when user has admin/analyst role (read role from Zustand `useUserRole`)
6. Unit tests for drag state transitions

**Key decisions:**
- Unsaved indicator: yellow dashed border on map container + `"Unsaved position"` badge + Save/Reset buttons
- Coordinate readout: small overlay inside map showing live lat/lng during drag
- Save/Reset strip: rendered as `<div>` outside `<MapContainer>` (React-Leaflet portals are complex; plain div works)

---

### Phase C: District Boundary Overlays (Story 3)

**Deliverables:**
1. `src/lib/api/boundaries.ts` — add `getBoundaryDetail(id: string): Promise<BoundaryDetailResponse>`
2. `src/hooks/useBoundaries.ts` — `useBoundaryDetail(id: string | null)` TanStack Query hook (staleTime: 10min, gcTime: 60min — boundaries rarely change)
3. `src/types/voter.ts` — add `boundary_id: string | null` to `DistrictCheckComparison`
4. `src/lib/district-comparison.ts` — add `boundaryId: string | null` to `DistrictComparisonResult`
5. `src/hooks/useDistrictCheck.ts` — pass `boundary_id` through `adaptDistrictCheck`
6. `src/routes/voters/$voterId.tsx` — add `activeOverlayIds: Set<string>`, toggle handler, `overlayData: Map<string, BoundaryDetailResponse>`; load overlay data via `useBoundaryDetail` for each active ID
7. `DistrictAssignmentsCard.tsx` — add `activeOverlayIds` + `onToggleBoundary` props; row click handler; visual active state (highlighted row background); boundary-unavailable toast
8. `GeocodedLocationMap.tsx` — accept `activeOverlays: Map<string, BoundaryDetailResponse>`; render `<GeoJSON>` per overlay with DISTRICT_COLORS cycle; overlay labels; overlay legend entries

**Key decisions:**
- Overlay color: `DISTRICT_COLORS[index % 16]` where index = position in `activeOverlayIds` iteration order
- GeoJSON style: `{ fillColor, color, weight: 2, opacity: 0.9, fillOpacity: 0.2 }`
- Toast on missing boundary: use Sonner `toast.info("Boundary data not available for this district")`
- Multiple overlays: each independent; no limit in code (palette cycles)

---

### Phase D: Provider × District Matrix (Story 4)

**Deliverables:**
1. `src/types/voter.ts` — `ProviderBoundaryCheckRequest`, `ProviderBoundaryResult`, `ProviderBoundaryCheckResponse`
2. `src/api/voters.ts` — `checkProviderBoundaries(voterId, request)` POST call
3. `src/hooks/useProviderBoundaryCheck.ts` — `useProviderBoundaryCheck(voterId, locations)` TanStack Query hook; enabled only when locations have ≥ 1 entry; staleTime: 5min; invalidated after drag-and-save
4. `DistrictAssignmentsCard.tsx` — expand to matrix layout: `Table` from shadcn/ui; rows = 10 district types; columns = Registered + Official (geographic) + [per provider]; cells: green `CheckCircle2` (match), red `X` (mismatch), `—` (no data); mismatch tooltip shows both values; loading skeleton
5. `GeocodedLocationMap.tsx` — derive `matchStatus` per provider from matrix results; add colored ring on secondary markers (green/red/amber)
6. Unit tests for matrix cell rendering

**Key decisions:**
- Matrix replaces (wraps) the existing `DistrictAssignmentsCard` district list — expands it, doesn't replace separate component
- "Official" column = server-side `determined_boundaries` from `DistrictCheckResponse` (already fetched)
- Provider columns come from `ProviderBoundaryCheckResponse.results`
- On service unavailable: inline `Alert` banner inside card with "Retry" button; card structure stays visible
- Backend dependency: stub `checkProviderBoundaries` returns empty results if endpoint not yet deployed (graceful fallback)

---

## Backend Contracts Summary

| Contract | Impact | Status |
|---|---|---|
| Add `boundary_id` to `DistrictCheckComparison` | Story 3 overlay toggle | **Required backend change** |
| New `POST /voters/{id}/geocode/check-boundaries` | Story 4 matrix | **Required new endpoint** |

Until backend changes land: Story 3 overlays can be stubbed with a `null` boundary_id fallback (overlay toggle disabled with info message). Story 4 matrix can be stubbed with empty `providerResults` (matrix shows "No provider data yet").

---

## Complexity Tracking

| Complexity | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| New batch API endpoint (Story 4) | Matrix requires checking N provider coordinates against boundaries in one call | N separate point-lookup calls would be slow (N=6 providers × latency) and race-condition-prone |
| `Map<string, BoundaryDetailResponse>` overlay state | GeoJSON data must be cached per active boundary ID | Simple `boundary_id[]` without data would require re-fetching on every render cycle |
| `DragState` local state object | Tracks isDragging + pending + saved coords atomically to prevent partial renders | Two separate `useState` calls would cause flickering between intermediate states |

---

## Constitution Check (Post-Design)

| Principle | Status | Notes |
|---|---|---|
| I. Branch-Based Development | ✅ Pass | Branch exists |
| II. Pull Request Review | ✅ Pass | PR to `main` planned |
| III. Test Coverage 95% | ✅ Pass | Each phase includes unit test deliverables; E2E for key user flows |
| IV. Code Quality | ✅ Pass | Uses `@/` alias, strict TS, established patterns; complexity justified above |
