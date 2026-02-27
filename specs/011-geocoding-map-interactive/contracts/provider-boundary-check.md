# API Contract: Provider Boundary Check

**Feature**: 011-geocoding-map-interactive
**Status**: New endpoint required in voter-api

---

## 1. Enhanced District Check Response

### Current Shape (`GET /api/v1/voters/{voter_id}/district-check`)

```typescript
interface DistrictCheckComparison {
  boundary_type: string
  registered_value: string | null
  determined_value: string | null
  status: "match" | "mismatch" | "registered-only" | "determined-only"
}
```

### Required Enhancement

Add `boundary_id` to each comparison item:

```typescript
interface DistrictCheckComparison {
  boundary_type: string
  registered_value: string | null
  determined_value: string | null
  status: "match" | "mismatch" | "registered-only" | "determined-only"
  boundary_id: string | null   // ← NEW: UUID of the matched boundary record, null if no match
}
```

**Reason**: Frontend needs `boundary_id` to call `GET /api/v1/boundaries/{boundary_id}` for GeoJSON overlay without a separate search request.

---

## 2. New Endpoint: Provider Boundary Check

### Endpoint

```
POST /api/v1/voters/{voter_id}/geocode/check-boundaries
```

### Authentication

Requires valid JWT. Accessible to `admin` and `analyst` roles.

### Request Body

```typescript
interface ProviderBoundaryCheckRequest {
  locations: ProviderLocation[]
}

interface ProviderLocation {
  provider: string       // e.g., "nominatim", "google", "census", "photon", "usps", "manual"
  latitude: number
  longitude: number
}
```

**Example Request**:
```json
{
  "locations": [
    { "provider": "nominatim", "latitude": 32.840695, "longitude": -83.632513 },
    { "provider": "google",    "latitude": 32.840710, "longitude": -83.632490 },
    { "provider": "census",    "latitude": 32.840620, "longitude": -83.632600 }
  ]
}
```

### Response Body

```typescript
interface ProviderBoundaryCheckResponse {
  voter_id: string
  results: ProviderBoundaryResult[]
  checked_at: string   // ISO 8601 timestamp
}

interface ProviderBoundaryResult {
  provider: string
  districts: Record<string, string | null>
  // Key: boundary_type (e.g., "congressional", "state_senate", "county_commission")
  // Value: district name/number, or null if not determined
}
```

**Example Response**:
```json
{
  "voter_id": "GA00001234",
  "results": [
    {
      "provider": "nominatim",
      "districts": {
        "congressional": "2",
        "state_senate": "018",
        "state_house": "144",
        "county_commission": "001",
        "school_board": "3",
        "county_precinct": "MACON-01"
      }
    },
    {
      "provider": "google",
      "districts": {
        "congressional": "2",
        "state_senate": "019",
        "state_house": "144",
        "county_commission": "001",
        "school_board": "3",
        "county_precinct": "MACON-01"
      }
    }
  ],
  "checked_at": "2026-02-26T14:30:00Z"
}
```

### Error Cases

| Status | Condition |
|--------|-----------|
| 400 | Invalid coordinates (out of range lat/lng) |
| 401 | Missing or expired JWT |
| 403 | Insufficient role (viewer cannot access) |
| 404 | Voter not found |
| 422 | Malformed request body |
| 503 | Boundary data service unavailable |

### Behavior Notes

- The endpoint performs point-in-polygon checks for each provided location against the boundary dataset.
- This is a pure lookup (read-only); no data is written.
- Locations are checked independently; a failed check for one provider does not affect others.
- If a district type has no boundary data, `null` is returned for that key.
- The response district values use the same normalization as the existing district-check endpoint (trailing number extracted, leading zeros stripped).

---

## 3. Frontend TypeScript Types (New)

**File**: `src/types/voter.ts` — add to existing voter types:

```typescript
export interface ProviderLocation {
  provider: string
  latitude: number
  longitude: number
}

export interface ProviderBoundaryCheckRequest {
  locations: ProviderLocation[]
}

export interface ProviderBoundaryResult {
  provider: string
  districts: Record<string, string | null>
}

export interface ProviderBoundaryCheckResponse {
  voter_id: string
  results: ProviderBoundaryResult[]
  checked_at: string
}
```

**File**: `src/types/voter.ts` — modify existing:

```typescript
export interface DistrictCheckComparison {
  boundary_type: string
  registered_value: string | null
  determined_value: string | null
  status: "match" | "mismatch" | "registered-only" | "determined-only"
  boundary_id: string | null   // ← ADD
}
```

**File**: `src/lib/district-comparison.ts` — modify existing:

```typescript
export interface DistrictComparisonResult {
  registeredKey: keyof RegisteredDistricts
  label: string
  registeredValue: string | null
  geographicValue: string | null
  status: DistrictMatchStatus
  boundaryId: string | null   // ← ADD
}
```

---

## 4. Boundary Detail Endpoint (Already Exists, Missing API Function)

**Endpoint**: `GET /api/v1/boundaries/{boundary_id}`
**Response**: `BoundaryDetailResponse` (already typed in `src/types/boundary.ts`)

The `geometry` field contains GeoJSON geometry (Polygon or MultiPolygon). The `properties` field contains feature properties.

**Needed**: Add `getBoundaryDetail(id: string)` to `src/lib/api/boundaries.ts`:

```typescript
export async function getBoundaryDetail(id: string): Promise<BoundaryDetailResponse> {
  return api.get(`boundaries/${id}`).json<BoundaryDetailResponse>()
}
```
