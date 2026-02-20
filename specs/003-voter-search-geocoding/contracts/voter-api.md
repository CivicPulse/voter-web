# API Contract: Voter Search & Geocoding

**Feature Branch**: `003-voter-search-geocoding`
**Date**: 2026-02-18
**Base URL**: `{VITE_API_BASE_URL}` (default: `http://localhost:8000/api/v1`)

## Endpoints

### 1. Search Voters

**`GET /voters`**

Search and browse voters with optional filters, sorting, and pagination.

**Authentication**: Bearer Token (all authenticated users)

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| q | string | No | — | Name search query (partial match, min 2 chars) |
| county | string | No | — | Filter by county name |
| status | string | No | — | Filter by voter status (e.g., "Active", "Inactive") |
| district_type | string | No | — | Filter by district type (e.g., "congressional") |
| district_id | string | No | — | Filter by specific district (requires district_type) |
| sort_by | string | No | "name" | Sort field: "name", "county", "registration_date", "voter_id" |
| sort_order | string | No | "asc" | Sort direction: "asc", "desc" |
| page | integer | No | 1 | Page number (1-based) |
| page_size | integer | No | 25 | Results per page (1-100) |

**Response** `200 OK`:

```typescript
interface VoterSearchResponse {
  voters: VoterSummary[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

interface VoterSummary {
  id: string           // UUID
  first_name: string
  last_name: string
  county: string
  voter_id: string     // State voter registration ID
  registration_date: string  // ISO date
  status: string       // e.g., "Active", "Inactive"
}
```

**Error Responses**:
- `401 Unauthorized` — Invalid or expired token
- `422 Unprocessable Entity` — Invalid query parameters

---

### 2. Get Voter Detail

**`GET /voters/{voterId}`**

Retrieve full registration details for a single voter.

**Authentication**: Bearer Token (all authenticated users)

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| voterId | string (UUID) | Voter's unique identifier |

**Response** `200 OK`:

```typescript
interface VoterDetail {
  id: string
  first_name: string
  middle_name: string | null
  last_name: string
  suffix: string | null
  voter_id: string
  county: string
  status: string
  registration_date: string
  address_line_1: string
  address_line_2: string | null
  city: string
  state: string
  zip_code: string
}
```

**Error Responses**:
- `401 Unauthorized` — Invalid or expired token
- `404 Not Found` — Voter does not exist

---

### 3. Get Voter Filter Options

**`GET /voters/filters`**

Retrieve dynamic filter options reflecting the current voter data.

**Authentication**: Bearer Token (all authenticated users)

**Response** `200 OK`:

```typescript
interface VoterFilterOptions {
  counties: string[]
  statuses: string[]
  district_types: DistrictTypeOption[]
}

interface DistrictTypeOption {
  type: string          // e.g., "congressional", "state_senate"
  label: string         // e.g., "Congressional", "State Senate"
  districts: DistrictOption[]
}

interface DistrictOption {
  id: string
  name: string          // e.g., "District 5", "District 14"
}
```

**Error Responses**:
- `401 Unauthorized` — Invalid or expired token

---

### 4. Trigger Voter Geocoding

**`POST /voters/{voterId}/geocode`**

Trigger geocoding for a voter's registration address across all available providers. Returns the updated list of geocoded locations.

**Authentication**: Bearer Token (admin or analyst only)

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| voterId | string (UUID) | Voter's unique identifier |

**Response** `200 OK`:

```typescript
// Returns array of VoterGeocodedLocation (existing type)
VoterGeocodedLocation[]
```

**Error Responses**:
- `401 Unauthorized` — Invalid or expired token
- `403 Forbidden` — Viewer role cannot trigger geocoding
- `404 Not Found` — Voter does not exist

---

### 5. Get Voter Geocoded Locations (existing)

**`GET /voters/{voterId}/geocoded-locations`**

Already implemented in `src/api/lookup.ts`. Returns all geocoded locations for a voter.

**Authentication**: Bearer Token

**Response** `200 OK`: `VoterGeocodedLocation[]`

---

### 6. Set Primary Location (existing)

**`PUT /voters/{voterId}/geocoded-locations/{locationId}/set-primary`**

Already implemented in `src/api/lookup.ts`. Sets a location as the official (primary) location.

**Authentication**: Bearer Token (admin or analyst only)

**Response** `200 OK`: `VoterGeocodedLocation`

---

### 7. Delete Geocoded Location

**`DELETE /voters/{voterId}/geocoded-locations/{locationId}`**

Remove a geocoded location from a voter.

**Authentication**: Bearer Token (admin or analyst only)

**Path Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| voterId | string (UUID) | Voter's unique identifier |
| locationId | string (UUID) | Location record identifier |

**Response** `204 No Content`

**Error Responses**:
- `401 Unauthorized` — Invalid or expired token
- `403 Forbidden` — Viewer role cannot delete locations
- `404 Not Found` — Voter or location does not exist

---

### 8. Point Lookup (existing)

**`GET /geocoding/point-lookup`**

Already implemented in `src/api/lookup.ts`. Returns all districts at a geographic point. Used to fetch district assignments for a voter's official location.

**Authentication**: Bearer Token

**Query Parameters**: `lat`, `lng`, `accuracy?`

**Response** `200 OK`: `PointLookupResponse`

---

## New Frontend Types (`src/types/voter.ts`)

```typescript
// Voter search result summary
export interface VoterSummary {
  id: string
  first_name: string
  last_name: string
  county: string
  voter_id: string
  registration_date: string
  status: string
}

// Full voter detail
export interface VoterDetail {
  id: string
  first_name: string
  middle_name: string | null
  last_name: string
  suffix: string | null
  voter_id: string
  county: string
  status: string
  registration_date: string
  address_line_1: string
  address_line_2: string | null
  city: string
  state: string
  zip_code: string
}

// Paginated search response
export interface VoterSearchResponse {
  voters: VoterSummary[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// Dynamic filter options
export interface VoterFilterOptions {
  counties: string[]
  statuses: string[]
  district_types: DistrictTypeOption[]
}

export interface DistrictTypeOption {
  type: string
  label: string
  districts: DistrictOption[]
}

export interface DistrictOption {
  id: string
  name: string
}

// Search params schema (for TanStack Router)
export interface VoterSearchParams {
  q?: string
  county?: string
  status?: string
  district_type?: string
  district_id?: string
  sort_by?: "name" | "county" | "registration_date" | "voter_id"
  sort_order?: "asc" | "desc"
  page?: number
}
```

## New Frontend API Functions (`src/api/voters.ts`)

```typescript
import { api } from "@/api/client"
import type {
  VoterSearchResponse,
  VoterDetail,
  VoterFilterOptions,
  VoterSearchParams,
} from "@/types/voter"
import type { VoterGeocodedLocation } from "@/types/lookup"

export async function searchVoters(
  params: VoterSearchParams
): Promise<VoterSearchResponse> {
  return api.get("voters", { searchParams: params }).json()
}

export async function getVoterDetail(
  voterId: string
): Promise<VoterDetail> {
  return api.get(`voters/${voterId}`).json()
}

export async function getVoterFilters(): Promise<VoterFilterOptions> {
  return api.get("voters/filters").json()
}

export async function triggerVoterGeocode(
  voterId: string
): Promise<VoterGeocodedLocation[]> {
  return api.post(`voters/${voterId}/geocode`).json()
}

export async function deleteGeocodedLocation(
  voterId: string,
  locationId: string
): Promise<void> {
  await api.delete(
    `voters/${voterId}/geocoded-locations/${locationId}`
  )
}
```

## Reused Endpoints

These endpoints already have frontend wrappers and hooks:

| Endpoint | Wrapper | Hook |
|----------|---------|------|
| `GET /voters/{id}/geocoded-locations` | `getVoterGeocodedLocations()` | `useVoterGeocodedLocations()` |
| `POST /voters/{id}/geocoded-locations/manual` | `addManualLocation()` | `useAddManualLocation()` |
| `PUT /voters/{id}/geocoded-locations/{lid}/set-primary` | `setPrimaryLocation()` | `useSetPrimaryLocation()` |
| `GET /geocoding/point-lookup` | `pointLookup()` | `usePointLookup()` |
