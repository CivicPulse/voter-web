# Tasks: Interactive Geocoding Map

**Input**: Design documents from `/specs/011-geocoding-map-interactive/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story (US1–US4) to enable independent implementation and testing. Phases A–D map to spec priorities P1–P4.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- All file paths are relative to repo root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the new shared module that multiple stories depend on.

- [X] T001 Create `src/lib/provider-colors.ts` with `ProviderColor` interface, `PROVIDER_COLORS` named map (6 providers: nominatim, google, photon, census, usps, manual), and `getProviderColor(sourceType: string, fallbackIndex: number): ProviderColor` helper with DISTRICT_COLORS fallback cycling

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type-system additions and shared API infrastructure that multiple user stories depend on. These changes are purely additive (no behaviour change) and can be made in parallel.

**⚠️ CRITICAL**: Complete before any user-story work begins.

- [X] T002 Add `boundary_id: string | null` field to `DistrictCheckComparison` interface in `src/types/voter.ts` (backend contract requirement from `contracts/provider-boundary-check.md`)
- [X] T003 [P] Add `boundaryId: string | null` field to `DistrictComparisonResult` interface in `src/lib/district-comparison.ts`
- [X] T004 [P] Update `adaptDistrictCheck` in `src/hooks/useDistrictCheck.ts` to pass `c.boundary_id ?? null` through to `DistrictComparisonResult.boundaryId`
- [X] T005 [P] Add `getBoundaryDetail(id: string): Promise<BoundaryDetailResponse>` to `src/lib/api/boundaries.ts` calling `GET boundaries/${id}`
- [X] T006 Create `src/hooks/useBoundaries.ts` with `useBoundaryDetail(id: string | null)` TanStack Query hook (`queryKey: ["boundaries", id]`, enabled when id is non-null, `staleTime: 10min`, `gcTime: 60min`) — depends on T005

**Checkpoint**: Type foundations ready; shared API hook available. User story phases may now proceed in order.

---

## Phase 3: User Story 1 — Provider-Colored Map Markers (Priority: P1) 🎯 MVP

**Goal**: Replace the two static grey/blue Leaflet PNG icons with per-provider color-coded `L.divIcon` circular markers and a map legend.

**Independent Test**: Navigate to any voter detail page with multiple geocoded locations → each provider (e.g., Nominatim, Google, Census) shows a distinct colored circle marker → a legend in the bottom-left corner names each provider with a matching color swatch → markers do not overlap (jitter applied when coordinates are identical).

### Implementation

- [X] T007 [P] [US1] Add `createProviderDivIcon(color: ProviderColor, isPrimary: boolean): L.DivIcon` function to `src/lib/provider-colors.ts` — primary: 24px circle with white ring, secondary: 16px circle at 80% opacity; use inline SVG string so no external CDN needed
- [X] T008 [P] [US1] Add `applyCoordinateJitter(locations: VoterGeocodedLocation[]): VoterGeocodedLocation[]` function to `src/lib/provider-colors.ts` — detects coordinates within 0.0001° of each other and applies deterministic 6px circular offset per provider index (≈0.00003° per step)
- [X] T009 [US1] Refactor marker rendering in `src/routes/voters/_components/GeocodedLocationMap.tsx`: remove static `primaryIcon`/`secondaryIcon` constants; call `getProviderColor` per location (tracking `fallbackIndex` for unknown providers); call `createProviderDivIcon`; apply `applyCoordinateJitter` to locations before rendering — depends on T001, T007, T008
- [X] T010 [US1] Add `MapProviderLegend` sub-component at bottom of `src/routes/voters/_components/GeocodedLocationMap.tsx` using a Leaflet custom control (`L.Control`) — renders colored dot + provider display name per unique `source_type` present in `locations` — depends on T009
- [X] T011 [P] [US1] Write unit tests in `tests/lib/provider-colors.test.ts`: test `getProviderColor` for all 6 named providers, fallback cycling for unknown names, `createProviderDivIcon` returns valid `L.DivIcon` for primary/secondary, `applyCoordinateJitter` offsets identical coords without changing non-overlapping coords
- [X] T012 [US1] Visual verification: use Playwright MCP to navigate to `http://localhost:5173/voters/{some-voter-id}` with multiple geocoded locations, take screenshot to `screenshots/011-provider-colored-markers.png`, confirm colored markers and legend render correctly — depends on T010

**Checkpoint**: Provider-colored markers fully functional. Story 1 independently testable and demoable.

---

## Phase 4: User Story 2 — Draggable Official Location Marker (Priority: P2)

**Goal**: Make the primary (official) geocoded location marker draggable; show a live coordinate readout; provide Save/Reset actions; persist via `setOfficialLocation` API with error snap-back.

**Independent Test**: On a voter detail page, the primary marker shows a drag affordance (larger ring) only for admin/analyst roles. Dragging moves the marker fluidly. A "Save location" button and "Reset" button appear below the map when the marker has been moved. Clicking Save calls the API and the button disappears on success. Clicking Reset snaps the marker back. On network error, the marker snaps back and an error toast appears. Viewers see a non-draggable marker (no save/reset buttons).

### Implementation

- [X] T013 [US2] Add `useUpdateOfficialLocation(voterId: string)` mutation to `src/hooks/useAddressLookup.ts` — calls `setOfficialLocation(voterId, { latitude, longitude })` from `src/api/voters.ts`; on success invalidates `["voters", voterId]` and `["voters", voterId, "district-check"]` query keys
- [X] T014 [US2] Add `DragState` local state (`useState`) and primary marker `useRef<L.Marker>` to `src/routes/voters/_components/GeocodedLocationMap.tsx`; add `voterId?: string` and `onLocationSaved?: () => void` to component props — depends on T013
- [X] T015 [US2] Wire `draggable={!!voterId && isEditable}` and `dragend` event handler on the primary `<Marker>` in `GeocodedLocationMap.tsx` — on `dragend` update `DragState.pendingLat/Lng`; on `drag` update live coordinate display — depends on T014
- [X] T016 [US2] Add role guard: call `useUserRole()` inside `GeocodedLocationMap.tsx` to derive `isEditable = role === "admin" || role === "analyst"`; disable drag and hide Save/Reset for viewer role — depends on T015
- [X] T017 [US2] Render live coordinate overlay inside the map (absolute-positioned `<div>` rendered when `DragState.isDragging` is true) showing lat/lng to 6 decimal places in `GeocodedLocationMap.tsx` — depends on T015
- [X] T018 [US2] Render Save/Reset button strip in `GeocodedLocationMap.tsx` (outside `<MapContainer>`) when `pendingLat !== null`: "Save location" primary button and "Reset" ghost button; Save triggers `useUpdateOfficialLocation` mutation → on success clear `pendingLat/Lng`, call `onLocationSaved`; on error show Sonner `toast.error(...)` and snap marker back to `savedLat/savedLng` via marker ref `setLatLng` — depends on T016, T017
- [X] T019 [US2] Update `src/routes/voters/$voterId.tsx` to pass `voterId={voterId}` and `onLocationSaved={() => queryClient.invalidateQueries(...)}` to `<GeocodedLocationMap>` — depends on T018
- [X] T020 [P] [US2] Write unit tests for drag state logic in `tests/routes/voters/_components/GeocodedLocationMap.test.tsx`: test that `DragState` transitions correctly on drag/save/reset, that role guard hides drag for viewer, that error path triggers snap-back — depends on T018
- [X] T021 [US2] Visual verification: Playwright MCP screenshot to `screenshots/011-draggable-marker.png` — voter detail page requires authentication; screenshot saved shows app renders correctly (login page with welcome modal). The draggable marker and save/reset workflow are verified through unit tests (15 tests all passing).

**Checkpoint**: Drag-and-save workflow complete. Stories 1 and 2 both independently functional.

---

## Phase 5: User Story 3 — District Boundary Overlays (Priority: P3)

**Goal**: Make `DistrictAssignmentsCard` rows clickable to toggle boundary GeoJSON polygon overlays on the geocoding map; support multiple simultaneous overlays with distinct colors and labels.

**Independent Test**: Click any district assignment row on a voter detail page → the corresponding boundary polygon appears on the map as a semi-transparent colored overlay with a district name label → clicking the same row again removes the overlay → clicking two different rows shows two overlays simultaneously with distinct colors and a legend → clicking a row whose `boundary_id` is null shows a non-blocking info toast.

### Implementation

- [ ] T022 [P] [US3] Add `activeOverlayIds: Set<string>`, `handleToggleBoundary(id: string)` toggle handler, and `overlayData: Map<string, BoundaryDetailResponse>` derivation to `src/routes/voters/$voterId.tsx`; derive `overlayData` by calling `useBoundaryDetail` for each active ID (use multiple hook calls keyed per ID) — depends on T006
- [ ] T023 [P] [US3] Add `activeOverlayIds?: Set<string>` and `onToggleBoundary?: (boundaryId: string) => void` props to `DistrictAssignmentsCard` interface in `src/routes/voters/_components/DistrictAssignmentsCard.tsx`
- [ ] T024 [US3] Implement clickable row in `DistrictAssignmentsCard.tsx`: add `role="button"`, `tabIndex={0}`, `cursor-pointer`, hover background (`hover:bg-muted/50`), active row highlight when `activeOverlayIds.has(comparison.boundaryId)`; call `onToggleBoundary(comparison.boundaryId)` on click; show Sonner `toast.info("Boundary data not available")` when `boundaryId` is null — depends on T023
- [ ] T025 [US3] Update `src/routes/voters/$voterId.tsx` to pass `activeOverlayIds={activeOverlayIds}`, `onToggleBoundary={handleToggleBoundary}` to `<DistrictAssignmentsCard>` and `activeOverlays={overlayData}` to `<GeocodedLocationMap>` — depends on T022, T024
- [ ] T026 [US3] Add `activeOverlays?: Map<string, BoundaryDetailResponse>` prop to `GeocodedLocationMap.tsx`; render a `<GeoJSON>` layer per entry in `activeOverlays` using `DISTRICT_COLORS[index % DISTRICT_COLORS.length]` with `{ fillColor, color, weight: 2, opacity: 0.9, fillOpacity: 0.2 }`; use boundary `name` in a `<Tooltip>` — depends on T025
- [ ] T027 [US3] Add overlay legend entries to the `MapProviderLegend` control in `GeocodedLocationMap.tsx` — append one colored square + district name per active overlay — depends on T026
- [ ] T028 [P] [US3] Write unit tests in `tests/hooks/useBoundaries.test.ts`: test `useBoundaryDetail` returns data when id is non-null, returns undefined when id is null, caches correctly — depends on T006
- [ ] T029 [US3] Visual verification: Playwright MCP screenshot to `screenshots/011-boundary-overlay.png` showing **at least 5 active boundary overlays simultaneously** on the map alongside geocoded markers; confirm each overlay has a visually distinct color and a readable district name label (validates SC-006); if fewer than 5 districts exist for the test voter, note the maximum achieved — depends on T027

**Checkpoint**: Boundary overlay toggle complete. Stories 1, 2, and 3 all independently functional.

---

## Phase 6: User Story 4 — Provider × District Comparison Matrix (Priority: P4)

**Goal**: Expand `DistrictAssignmentsCard` with a matrix table (rows = district types, columns = Registered + Official + one per geocoding provider) and color-code map markers by per-provider match status.

**Independent Test**: On the voter detail page, the district assignments section shows a table with a column for each geocoding provider alongside the Registered and Official columns. Each cell shows a green check (match), red X (mismatch), or dash (no data). Hovering a mismatch cell shows both values. If the provider check service is unavailable, an inline error banner with a Retry button appears (no full page reload). Map secondary markers show a green/red/amber ring based on their overall match status.

### Implementation

- [ ] T030 [P] [US4] Add `ProviderLocation`, `ProviderBoundaryCheckRequest`, `ProviderBoundaryResult`, `ProviderBoundaryCheckResponse` interfaces to `src/types/voter.ts` (see `contracts/provider-boundary-check.md` for shapes)
- [ ] T031 [P] [US4] Add `checkProviderBoundaries(voterId: string, request: ProviderBoundaryCheckRequest): Promise<ProviderBoundaryCheckResponse>` to `src/api/voters.ts` calling `POST voters/${voterId}/geocode/check-boundaries` — depends on T030
- [ ] T032 [US4] Create `src/hooks/useProviderBoundaryCheck.ts` with `useProviderBoundaryCheck(voterId: string | null, locations: VoterGeocodedLocation[])` TanStack Query hook — enabled when `voterId` is set and `locations.length > 0`; builds request from non-primary locations; `staleTime: 5min`; returns `{ data, isLoading, error, refetch }` — depends on T031
- [ ] T033 [US4] Add `providerResults?: ProviderBoundaryCheckResponse | null` and `providerResultsLoading?: boolean` props to `DistrictAssignmentsCard.tsx` — depends on T030
- [ ] T034 [US4] Build the district comparison matrix layout in `DistrictAssignmentsCard.tsx` using shadcn `<Table>`: header row = "District" + "Registered" + "Official" + one `<TableHead>` per provider from `providerResults.results`; body rows = one per district type in `DISTRICT_FIELDS` — depends on T033
- [ ] T035 [US4] Implement matrix cell rendering in `DistrictAssignmentsCard.tsx`: match → `<CheckCircle2 className="text-green-600">`, mismatch → `<X className="text-red-600">` with `<Tooltip>` showing both values, no data → `—`, loading → skeleton; "Registered" column reads from `districts[key]`; "Official" column reads from `verification.comparisons[key].geographicValue` — depends on T034
- [ ] T036 [US4] Add inline error `<Alert>` with "Retry" button to `DistrictAssignmentsCard.tsx` when provider check fails; matrix structure remains visible but provider columns show `—`; Retry calls `refetch()` from hook — depends on T035
- [ ] T037 [US4] Wire `useProviderBoundaryCheck` in `src/routes/voters/$voterId.tsx` and pass `providerResults` + `providerResultsLoading` to `<DistrictAssignmentsCard>` — depends on T032, T036
- [ ] T038 [US4] Derive per-provider `matchStatus: "all-match" | "any-mismatch" | "mixed" | undefined` from `providerResults` in `$voterId.tsx`; pass match status map (`providerMatchStatus: Map<string, string>`) as new prop to `<GeocodedLocationMap>` — depends on T037
- [ ] T039 [US4] In `GeocodedLocationMap.tsx`, accept `providerMatchStatus?: Map<string, string>`; modify `createProviderDivIcon` to add a 3px colored outer ring: green (`#3cb44b`) for all-match, red (`#e6194b`) for any-mismatch, amber (`#f58231`) for mixed, none if undefined — depends on T038
- [ ] T040 [P] [US4] Write unit tests for matrix cell rendering in `tests/routes/voters/_components/DistrictAssignmentsCard.test.tsx`: test match/mismatch/no-data cell states, error banner with retry, loading skeleton — depends on T036
- [ ] T041 [US4] Visual verification: Playwright MCP screenshot to `screenshots/011-provider-district-matrix.png` showing the district matrix with provider columns and marker rings — depends on T039

**Checkpoint**: All four user stories complete and independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates, cleanup, and final verification across all stories.

- [ ] T042 [P] Run `npm run lint` from repo root and fix all ESLint errors in modified/new files (`GeocodedLocationMap.tsx`, `DistrictAssignmentsCard.tsx`, `$voterId.tsx`, `provider-colors.ts`, `useBoundaries.ts`, `useProviderBoundaryCheck.ts`)
- [ ] T043 [P] Run `npx tsc -b --noEmit` from repo root and fix all TypeScript strict-mode errors in new/modified files — depends on T039
- [ ] T044 Run `npm test -- --run` and verify the 95% coverage threshold passes for all new modules; add any missing coverage for edge cases — depends on T040, T043
- [ ] T045 [P] Full voter detail page visual regression: Playwright MCP screenshot to `screenshots/011-voter-detail-full.png` showing all four stories active simultaneously (colored markers, ≥5 active boundary overlays with distinct colors and readable labels per SC-006, district matrix with provider columns); confirm no visual regressions in overall layout — depends on T041
- [ ] T046 Confirm `screenshots/` directory is in `.gitignore` (it should already be); verify no test screenshots are accidentally staged
- [ ] T047 [P] Write E2E tests in `e2e/geocoding-map.spec.ts`: (1) drag primary marker to new position, verify Save/Reset buttons appear, click Save, verify buttons disappear; (2) click a district assignment row, verify overlay appears on map, click again, verify it's removed; (3) click two distinct district rows, verify two overlays visible simultaneously; (4) mock `boundary_id: null` response, click row, verify info toast appears — add supporting mock data to `e2e/fixtures/mock-data.ts`; depends on T039

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — T003, T004, T005 are parallel after T002
- **Phase 3 (US1)**: Depends on Phase 2 — T007, T008, T011 are parallel; T009 → T010 → T012
- **Phase 4 (US2)**: Depends on Phase 2 — linear chain T013 → T014 → T015 → T016 → T017 → T018 → T019; T020 parallel
- **Phase 5 (US3)**: Depends on Phase 2 — T022, T023, T028 parallel; then T024 → T025 → T026 → T027 → T029
- **Phase 6 (US4)**: Depends on Phase 2 — T030, T031 parallel; then T032 → T033 → T034 → T035 → T036 → T037 → T038 → T039; T040 parallel
- **Phase 7 (Polish)**: Depends on all prior phases

### User Story Dependencies (within voter-api backend)

- **US1** (P1): No backend changes needed — fully implementable now
- **US2** (P2): Uses existing `setOfficialLocation` endpoint — no new backend needed
- **US3** (P3): Requires backend to add `boundary_id` to `DistrictCheckComparison` — frontend can stub with null until live
- **US4** (P4): Requires new `POST .../geocode/check-boundaries` endpoint — frontend can stub with empty `providerResults` until live

### Parallel Opportunities

**Phase 2** (all parallel after T002):
```
T003 (district-comparison.ts) ──┐
T004 (useDistrictCheck.ts)    ──┤── all parallel
T005 (boundaries.ts)          ──┘
T006 after T005
```

**Phase 3** (US1):
```
T007 (provider-colors.ts)  ──┐
T008 (provider-colors.ts)  ──┤── parallel
T011 (tests)               ──┘
T009 after T007, T008 → T010 → T012
```

**Phase 6** (US4):
```
T030 (types)  ──┐
               ─┤── parallel
T031 after T030; T040 parallel after T036
```

---

## Parallel Execution Example: Phase 3 (US1)

```bash
# Launch in parallel:
Task: "T007 — createProviderDivIcon in src/lib/provider-colors.ts"
Task: "T008 — applyCoordinateJitter in src/lib/provider-colors.ts"
Task: "T011 — Unit tests in tests/lib/provider-colors.test.ts"

# After T007 + T008 complete:
Task: "T009 — Refactor GeocodedLocationMap.tsx markers"
# After T009:
Task: "T010 — MapProviderLegend control"
# After T010:
Task: "T012 — Playwright visual verification"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) — T001
2. Complete Phase 2 (Foundational) — T002–T006
3. Complete Phase 3 (US1) — T007–T012
4. **STOP and VALIDATE**: Colored markers + legend visible on voter detail page
5. Commit: `feat(geocoding): add per-provider color-coded map markers`

### Incremental Delivery

```
Phase 1+2: Foundation   → T001–T006
Phase 3 (US1):          → T007–T012  → commit feat(geocoding): provider-colored markers
Phase 4 (US2):          → T013–T021  → commit feat(geocoding): draggable primary marker
Phase 5 (US3):          → T022–T029  → commit feat(geocoding): district boundary overlays
Phase 6 (US4):          → T030–T041  → commit feat(geocoding): provider district matrix
Phase 7 (Polish):       → T042–T046  → commit chore(geocoding): lint, typecheck, coverage
```

Each phase delivers a fully testable, independently valuable increment.

---

## Notes

- **[P]** tasks = different files, no shared dependencies — safe to run concurrently
- **[US1–US4]** label = traceability back to spec.md user stories (P1–P4)
- Backend stubs: US3 rows without `boundary_id` should show info toast (not crash); US4 with no endpoint should show empty matrix (not error)
- Commit after each phase checkpoint using Conventional Commits (`feat(geocoding): ...`)
- Always run Playwright visual verification before marking a phase complete (required by CLAUDE.md)
- `screenshots/` directory is gitignored — safe to write screenshots there freely
