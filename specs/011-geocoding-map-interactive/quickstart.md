# Quickstart: Interactive Geocoding Map

**Feature**: 011-geocoding-map-interactive

---

## Prerequisites

```bash
cd voter-web
nvm use        # Node.js LTS from .nvmrc
cp .env.example .env  # if not already done
npm run dev    # start Vite dev server
```

The voter-api must be running at `http://localhost:8000` (or update `VITE_API_BASE_URL` in `.env`).

---

## Development Workflow

### Story 1 — Provider-Colored Markers

1. Create `src/lib/provider-colors.ts` with `PROVIDER_COLORS` map and `getProviderColor()` helper
2. Modify `GeocodedLocationMap.tsx`:
   - Replace `primaryIcon` / `secondaryIcon` with `createProviderIcon(color, isPrimary)`
   - Call `getProviderColor(loc.source_type, index)` per location
   - Apply jitter to overlapping coordinates
   - Add `MapLegend` sub-component showing provider name → color dot
3. Verify visually: navigate to a voter with multiple geocoded locations → each provider should show a distinct color marker

### Story 2 — Draggable Primary Marker + Save/Reset

1. Add `voterId` prop to `GeocodedLocationMap`
2. Add `dragend` handler to primary `<Marker>` (`draggable={true}`)
3. Track `pendingLat/Lng` in component state
4. Render "Save location" and "Reset" buttons when `pendingLat !== null`
5. Save calls `setOfficialLocation` mutation → on success: clear pending state, invalidate `["voters", voterId]` and `["voters", voterId, "district-check"]`
6. On error: toast + snap back
7. Verify: drag primary marker, confirm Save/Reset buttons appear, confirm coordinates update live

### Story 3 — District Boundary Overlays

1. Add `getBoundaryDetail(id)` to `src/lib/api/boundaries.ts`
2. Add `useBoundaryDetail(id)` hook in `src/hooks/useBoundaries.ts` (create new file)
3. Add `boundary_id` field to `DistrictCheckComparison` type and `adaptDistrictCheck` adapter
4. Add `activeOverlayIds` + `onToggleBoundary` props to `DistrictAssignmentsCard`
5. Wire toggle state in `VoterDetailPage` (`useState<Set<string>>`)
6. Load boundary GeoJSON for each active ID via `useBoundaryDetail`
7. Pass `activeOverlays: Map<string, BoundaryDetailResponse>` to `GeocodedLocationMap`
8. Render `<GeoJSON>` layer per active overlay with semi-transparent fill
9. Add overlay legend entries below provider legend in map
10. Verify: click district row → boundary polygon appears on map; click again → disappears

### Story 4 — Provider × District Matrix

1. Add `checkProviderBoundaries` API function to `src/api/voters.ts`
2. Add `useProviderBoundaryCheck(voterId)` hook — runs after geocoded locations load
3. Add matrix columns to `DistrictAssignmentsCard`:
   - Add `providerResults` prop
   - Render table: rows = district types, columns = Registered | Official | [per provider]
   - Match cell: green check; mismatch cell: red X with hover tooltip showing both values
4. Color-code map markers by per-provider match status (ring color overlay on divIcon)
5. Verify: district matrix renders, mismatches highlighted, marker rings reflect match status

---

## Key File Locations

| File | Change |
|------|--------|
| `src/lib/provider-colors.ts` | **NEW** — provider color map |
| `src/routes/voters/_components/GeocodedLocationMap.tsx` | **MODIFY** — all visual + interactive changes |
| `src/routes/voters/_components/DistrictAssignmentsCard.tsx` | **MODIFY** — boundary toggle + matrix |
| `src/routes/voters/$voterId.tsx` | **MODIFY** — overlay state, pass new props |
| `src/lib/api/boundaries.ts` | **MODIFY** — add `getBoundaryDetail` |
| `src/hooks/useBoundaries.ts` | **NEW** — `useBoundaryDetail` hook |
| `src/api/voters.ts` | **MODIFY** — add `checkProviderBoundaries` |
| `src/types/voter.ts` | **MODIFY** — add `boundary_id` + provider check types |
| `src/lib/district-comparison.ts` | **MODIFY** — add `boundaryId` to `DistrictComparisonResult` |
| `src/hooks/useDistrictCheck.ts` | **MODIFY** — pass `boundary_id` through adapter |

---

## Running Tests

```bash
npm test -- --run         # unit tests once
npm run lint              # ESLint
npx tsc -b --noEmit       # type check only
```

---

## Backend Dependency

The following voter-api changes are required before Story 3 and Story 4 can be fully implemented:

1. **`GET /voters/{voter_id}/district-check`**: Add `boundary_id: string | null` to each comparison object.
2. **`POST /voters/{voter_id}/geocode/check-boundaries`**: New batch endpoint.

Until these are available, implement with mock data stubs and `// TODO: real endpoint` comments.
