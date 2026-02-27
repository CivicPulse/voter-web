# Data Model: Interactive Geocoding Map

**Feature**: 011-geocoding-map-interactive
**Date**: 2026-02-26

---

## Key Entities

### 1. `VoterGeocodedLocation` (existing — no change)

```typescript
interface VoterGeocodedLocation {
  id: string
  voter_id: string
  latitude: number
  longitude: number
  confidence_score: number | null
  source_type: string    // e.g., "nominatim", "google", "census", "photon", "usps", "manual"
  is_primary: boolean
  input_address: string | null
  geocoded_at: string
}
```

**Key field**: `source_type` — drives provider color assignment.

---

### 2. `ProviderColor` (new — `src/lib/provider-colors.ts`)

```typescript
interface ProviderColor {
  fill: string    // hex color for marker fill
  border: string  // hex color for marker border
  label: string   // display name for legend
}

// Named provider map (stable assignments):
const PROVIDER_COLORS: Record<string, ProviderColor> = {
  nominatim:  { fill: "#4363d8", border: "#2e45a0", label: "Nominatim" },
  google:     { fill: "#e6194b", border: "#a01235", label: "Google" },
  photon:     { fill: "#3cb44b", border: "#2a7d34", label: "Photon" },
  census:     { fill: "#f58231", border: "#b55f1e", label: "Census" },
  usps:       { fill: "#911eb4", border: "#6b1685", label: "USPS" },
  manual:     { fill: "#42d4f4", border: "#2a9ab0", label: "Manual" },
  // fallback: cycle through remaining DISTRICT_COLORS for unknown providers
}
```

**Function**: `getProviderColor(sourceType: string, fallbackIndex: number): ProviderColor`
- Looks up by `sourceType.toLowerCase()`
- Falls back to `DISTRICT_COLORS[fallbackIndex % DISTRICT_COLORS.length]` with label = titleCase(sourceType)

---

### 3. `DragState` (new — component state in `GeocodedLocationMap`)

```typescript
interface DragState {
  isDragging: boolean
  pendingLat: number | null   // null = no unsaved drag
  pendingLng: number | null
  savedLat: number            // last saved coordinates (for reset)
  savedLng: number
}
```

**Transitions**:
- Initial: `{ isDragging: false, pendingLat: null, pendingLng: null, savedLat, savedLng }`
- On drag start: `{ isDragging: true, ... }`
- On drag move: `{ ..., pendingLat: newLat, pendingLng: newLng }`
- On drag end: `{ isDragging: false, pendingLat: newLat, pendingLng: newLng }` (unsaved)
- On save success: `{ isDragging: false, pendingLat: null, pendingLng: null, savedLat: newLat, savedLng: newLng }`
- On save failure / reset: `{ isDragging: false, pendingLat: null, pendingLng: null }` (marker snaps back to savedLat/Lng)

---

### 4. `ActiveOverlays` (new — page-level state in `$voterId.tsx`)

```typescript
// Set of boundary IDs that are currently toggled on
type ActiveOverlaySet = Set<string>
```

**State management**: `useState<Set<string>>(new Set())` in `VoterDetailPage`.

---

### 5. `DistrictCheckComparison` (modified — `src/types/voter.ts`)

```typescript
interface DistrictCheckComparison {
  boundary_type: string
  registered_value: string | null
  determined_value: string | null
  status: "match" | "mismatch" | "registered-only" | "determined-only"
  boundary_id: string | null   // ← NEW
}
```

---

### 6. `DistrictComparisonResult` (modified — `src/lib/district-comparison.ts`)

```typescript
interface DistrictComparisonResult {
  registeredKey: keyof RegisteredDistricts
  label: string
  registeredValue: string | null
  geographicValue: string | null
  status: DistrictMatchStatus
  boundaryId: string | null   // ← NEW
}
```

---

### 7. `ProviderBoundaryCheckRequest/Response` (new — `src/types/voter.ts`)

See `contracts/provider-boundary-check.md` for full shape.

---

## Component Props Changes

### `GeocodedLocationMap` (modified props)

```typescript
interface GeocodedLocationMapProps {
  locations: VoterGeocodedLocation[]
  className?: string
  // NEW:
  voterId?: string                       // enables drag-and-save (requires admin/analyst role awareness from parent)
  activeOverlays?: Map<string, BoundaryDetailResponse>  // boundaryId → GeoJSON for rendering
  onLocationSaved?: () => void          // callback after successful drag-save (parent can refresh district check)
}
```

### `DistrictAssignmentsCard` (modified props)

```typescript
interface DistrictAssignmentsCardProps {
  districts: RegisteredDistricts
  verification?: DistrictVerificationResult | null
  verificationLoading?: boolean
  matchStatus?: string
  checkedAt?: string
  // NEW:
  activeOverlayIds?: Set<string>                    // which boundary IDs are currently active
  onToggleBoundary?: (boundaryId: string) => void  // called when a row is clicked
  providerResults?: ProviderBoundaryCheckResponse | null  // provider × district matrix data
  providerResultsLoading?: boolean
}
```

---

## State Flow (Voter Detail Page)

```
VoterDetailPage
├── locations (TanStack Query)
├── districtCheck (TanStack Query)  → includes boundary_id per comparison
├── activeOverlays: Set<string>     → boundary IDs with active GeoJSON overlays
├── overlayData: Map<string, BoundaryDetailResponse>  → loaded GeoJSON per active ID
├── providerCheck (TanStack Query)  → provider × district matrix
│
├── GeocodedLocationMap
│   ├── colored divIcon markers (per source_type)
│   ├── draggable primary marker
│   ├── GeoJSON overlay layers (from activeOverlays + overlayData)
│   └── map legend (providers + active overlays)
│
└── DistrictAssignmentsCard
    ├── clickable rows (toggle boundary overlay)
    ├── visual active state (active row highlighted)
    └── provider × district matrix (expandable columns)
```

---

## Validation Rules

| Rule | Constraint |
|------|-----------|
| Drag coordinates | Must be valid lat (-90..90) and lng (-180..180) before save |
| Provider colors | Unknown `source_type` falls back to palette cycling; never throws |
| Overlay limit | UI supports unlimited overlays simultaneously (palette cycles at 16) |
| Jitter threshold | Applied only when `|lat1 - lat2| < 0.0001 && |lng1 - lng2| < 0.0001` |
| Jitter magnitude | ~5–8px at typical zoom (≈0.00003° offset per provider index) |
| Save role | Only admin/analyst can drag-and-save; viewer sees non-draggable primary marker |
