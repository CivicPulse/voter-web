# API Contracts: Election Results

**Feature**: `002-election-results` | **Date**: 2026-02-15
**Base URL**: `{VITE_API_BASE_URL}` (default: `http://localhost:8000/api/v1`)

## Public Endpoints (No Authentication Required)

### List Elections

```
GET /elections
```

**Query Parameters**:

| Param | Type | Required | Default | Description |
| ----- | ---- | -------- | ------- | ----------- |
| `status` | string | No | - | Filter by status: `active`, `finalized` |
| `election_type` | string | No | - | Filter by type: `general`, `primary`, `special`, `runoff` |
| `date_from` | string | No | - | ISO date, inclusive lower bound |
| `date_to` | string | No | - | ISO date, inclusive upper bound |
| `page` | integer | No | 1 | Page number |
| `page_size` | integer | No | 20 | Items per page |

**Response** `200 OK`:

```json
{
  "elections": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "State Senate District 18 Special",
      "election_date": "2026-02-17",
      "election_type": "special",
      "district": "State Senate - District 18",
      "data_source_url": "https://results.sos.ga.gov/api/...",
      "status": "active",
      "last_refreshed_at": "2026-02-17T19:40:48Z",
      "refresh_interval_seconds": 120,
      "created_at": "2026-02-10T14:00:00Z",
      "updated_at": "2026-02-17T19:40:48Z"
    }
  ],
  "total": 42,
  "page": 1,
  "page_size": 20,
  "total_pages": 3
}
```

**Frontend Usage**: Elections list page. Group response by `election_date` to form election events. Use `date_from`/`date_to` with the same date to fetch all races for a specific election event.

---

### Get Election Detail

```
GET /elections/{election_id}
```

**Path Parameters**:

| Param | Type | Description |
| ----- | ---- | ----------- |
| `election_id` | UUID | Election record ID |

**Response** `200 OK`: Single `Election` object (same shape as list item).

**Error Responses**:

- `404 Not Found`: Election ID does not exist

**Frontend Usage**: Race detail metadata (name, district, status, last refresh).

---

### Get Election Results (JSON)

```
GET /elections/{election_id}/results
```

**Response** `200 OK`:

```json
{
  "election_id": "550e8400-e29b-41d4-a716-446655440000",
  "candidates": [
    {
      "id": "cand-001",
      "name": "LeMario Nicholas Brown",
      "political_party": "Dem",
      "ballot_order": 1,
      "vote_count": 12500,
      "group_results": [
        { "group_name": "Election Day", "vote_count": 8000 },
        { "group_name": "Advance Voting", "vote_count": 3500 },
        { "group_name": "Absentee by Mail", "vote_count": 900 },
        { "group_name": "Provisional", "vote_count": 100 }
      ]
    },
    {
      "id": "cand-002",
      "name": "Steven McNeel",
      "political_party": "Rep",
      "ballot_order": 2,
      "vote_count": 9800,
      "group_results": [
        { "group_name": "Election Day", "vote_count": 7200 },
        { "group_name": "Advance Voting", "vote_count": 2000 },
        { "group_name": "Absentee by Mail", "vote_count": 500 },
        { "group_name": "Provisional", "vote_count": 100 }
      ]
    }
  ],
  "county_results": [
    {
      "county_name": "Bibb County",
      "county_name_normalized": "bibb",
      "precincts_participating": 45,
      "precincts_reporting": 38,
      "candidates": [
        {
          "id": "cand-001",
          "name": "LeMario Nicholas Brown",
          "political_party": "Dem",
          "ballot_order": 1,
          "vote_count": 6200,
          "group_results": []
        }
      ]
    }
  ],
  "total_precincts_participating": 120,
  "total_precincts_reporting": 95
}
```

**Cache-Control**: `max-age=60` for active elections, `max-age=86400` for finalized.

**Frontend Usage**: Results drawer data (race-wide and county-level results). Polled via TanStack Query `refetchInterval` for active elections.

---

### Get County-Level GeoJSON

```
GET /elections/{election_id}/results/geojson
```

**Response** `200 OK` (`Content-Type: application/geo+json`):

GeoJSON `FeatureCollection` where each feature is a county polygon with result properties embedded.

**Frontend Usage**: Choropleth map coloring. Each feature contains enough data to color by leading candidate, reporting %, or total votes without a separate API call.

---

### Get Precinct-Level GeoJSON

```
GET /elections/{election_id}/results/geojson/precincts
```

**Query Parameters**:

| Param | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `county` | string | No | Filter precincts by county name |

**Response** `200 OK` (`Content-Type: application/geo+json`):

GeoJSON `FeatureCollection` with precinct polygons and result properties.

**Frontend Usage**: Precinct map view. Always use county filter to avoid loading all precincts statewide.

---

## Admin Endpoints (Requires `admin` Role)

### Create Election

```
POST /elections
```

**Request Body**:

```json
{
  "name": "State Senate District 18 Special",
  "election_date": "2026-02-17",
  "election_type": "special",
  "district": "State Senate - District 18",
  "data_source_url": "https://results.sos.ga.gov/api/...",
  "refresh_interval_seconds": 120
}
```

| Field | Type | Required | Constraints |
| ----- | ---- | -------- | ----------- |
| `name` | string | Yes | Max 500 chars |
| `election_date` | string | Yes | ISO date |
| `election_type` | string | Yes | `general`, `primary`, `special`, `runoff` |
| `district` | string | Yes | Max 200 chars |
| `data_source_url` | string | Yes | Valid URL |
| `refresh_interval_seconds` | integer | No | Default 120, min 60 |

**Response** `201 Created`: Full `Election` object.

**Error Responses**:

- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not admin role
- `409 Conflict`: Election with same name + date already exists
- `422 Unprocessable Entity`: Validation errors

**Frontend Usage**: Admin create election form with two-step confirmation.

---

### Update Election

```
PATCH /elections/{election_id}
```

**Request Body** (all fields optional):

```json
{
  "name": "Updated Name",
  "data_source_url": "https://new-url.example.com",
  "status": "finalized",
  "refresh_interval_seconds": 180
}
```

**Response** `200 OK`: Updated `Election` object.

**Error Responses**:

- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not admin role
- `404 Not Found`: Election not found

**Frontend Usage**: Admin election detail/edit page.

---

### Refresh Election Data

```
POST /elections/{election_id}/refresh
```

**Request Body**: None.

**Response** `200 OK`:

```json
{
  "election_id": "550e8400-e29b-41d4-a716-446655440000",
  "refreshed_at": "2026-02-17T19:45:00Z",
  "counties_updated": 5,
  "precincts_reporting": 95,
  "precincts_participating": 120
}
```

**Error Responses**:

- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not admin role or election is finalized
- `404 Not Found`: Election not found
- `502 Bad Gateway`: Data source URL unreachable

**Frontend Usage**: Admin "Refresh Now" button with loading indicator and success toast.

---

## Frontend API Client Functions

These functions will be implemented in `src/lib/api/elections.ts`:

```typescript
// Public endpoints
export async function getElections(params?: ElectionFilters & PaginationParams): Promise<PaginatedElectionListResponse>
export async function getElectionDetail(electionId: string): Promise<ElectionDetailResponse>
export async function getElectionResults(electionId: string): Promise<ElectionResultsResponse>
export async function getElectionGeoJSON(electionId: string): Promise<CountyResultFeatureCollection>
export async function getPrecinctGeoJSON(electionId: string, county?: string): Promise<PrecinctResultFeatureCollection>

// Admin endpoints
export async function createElection(data: CreateElectionRequest): Promise<ElectionDetailResponse>
export async function updateElection(electionId: string, data: UpdateElectionRequest): Promise<ElectionDetailResponse>
export async function refreshElection(electionId: string): Promise<RefreshResponse>
```

## Query Key Conventions

Following existing patterns:

```typescript
["elections", "list", filters]                      // Elections list (paginated, filtered)
["elections", "date", electionDate]                  // All races for a specific date
["elections", "detail", electionId]                  // Single election detail
["elections", "results", electionId]                 // Election results (JSON)
["elections", "geojson", "county", electionId]       // County-level GeoJSON
["elections", "geojson", "precinct", electionId, county]  // Precinct GeoJSON (with county)
["admin", "elections", "list"]                       // Admin elections list
```
