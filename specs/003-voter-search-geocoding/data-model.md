# Data Model: Voter Search & Geocoding

**Feature Branch**: `003-voter-search-geocoding`
**Date**: 2026-02-18

## Entities

### Voter (search result summary)

Used in the voter search results table. Lightweight representation for list views.

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Unique voter identifier |
| first_name | string | Voter's first name |
| last_name | string | Voter's last name |
| county | string | County of registration |
| voter_id | string | State-assigned voter registration ID |
| registration_date | string (ISO date) | Date of voter registration |
| status | string | Registration status (e.g., "Active", "Inactive") |

### VoterDetail (full detail view)

Extended voter information for the detail page. Includes registration address fields.

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Unique voter identifier |
| first_name | string | Voter's first name |
| middle_name | string \| null | Voter's middle name |
| last_name | string | Voter's last name |
| suffix | string \| null | Name suffix (Jr., Sr., etc.) |
| voter_id | string | State-assigned voter registration ID |
| county | string | County of registration |
| status | string | Registration status |
| registration_date | string (ISO date) | Date of voter registration |
| address_line_1 | string | Street address |
| address_line_2 | string \| null | Apartment/suite/unit |
| city | string | City |
| state | string | State abbreviation |
| zip_code | string | ZIP code |

### VoterGeocodedLocation (existing — `src/types/lookup.ts`)

Already defined in the codebase. Represents a geocoded coordinate for a voter's address.

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Location record identifier |
| voter_id | string (UUID) | Reference to voter |
| latitude | number | Latitude coordinate |
| longitude | number | Longitude coordinate |
| confidence_score | number | Geocoding confidence (0-1) |
| source_type | string | Geocoding provider name |
| is_primary | boolean | Whether this is the official location |
| input_address | string | Address that was geocoded |
| geocoded_at | string (ISO datetime) | When the geocoding was performed |

**State transitions**:
- Created → when geocoding is triggered or manual location added
- Set as primary → `is_primary` flipped to `true`; all other locations for the same voter set to `false`
- Deleted → removed entirely via DELETE endpoint

### LookupDistrict (existing — `src/types/lookup.ts`)

Already defined in the codebase. Represents a district boundary at a geographic point.

| Field | Type | Description |
|-------|------|-------------|
| boundary_type | string | District type (precinct, county, congressional, etc.) |
| name | string | District name |
| boundary_identifier | string | District identifier code |
| boundary_id | string (UUID) | Reference to boundary record |
| metadata | Record<string, string \| number \| null> | Additional district metadata |

### VoterFilterOptions (new)

Dynamic filter options for the search page, reflecting actual data.

| Field | Type | Description |
|-------|------|-------------|
| counties | string[] | Distinct county names |
| statuses | string[] | Distinct voter status values |
| district_types | DistrictTypeOption[] | District types with their available districts |

### DistrictTypeOption (new)

A district type with its available district values for the cascade filter.

| Field | Type | Description |
|-------|------|-------------|
| type | string | District type identifier (e.g., "congressional", "state_senate") |
| label | string | Human-readable label (e.g., "Congressional", "State Senate") |
| districts | DistrictOption[] | Available districts of this type |

### DistrictOption (new)

A single district value within a type.

| Field | Type | Description |
|-------|------|-------------|
| id | string | District identifier |
| name | string | District display name |

## Relationships

```text
Voter (1) ──── (0..*) VoterGeocodedLocation
                          │
                          │ is_primary = true (0..1)
                          ▼
                   Official Location
                          │
                          │ point-lookup (lat/lng)
                          ▼
                   LookupDistrict[] (0..*)
```

- A **Voter** has zero or more **VoterGeocodedLocation** records
- At most one location per voter has `is_primary = true` (the official location)
- District assignments are computed by the backend via point-lookup using the official location's coordinates — they are not stored on the voter entity itself

## Validation Rules

- `voter_id` is required and must be a valid state voter registration ID format
- `latitude` must be between -90 and 90
- `longitude` must be between -180 and 180
- `confidence_score` must be between 0 and 1
- `is_primary` can be `true` for at most one location per voter
- Search query `q` is optional; when provided, must be at least 2 characters
- `page` must be >= 1; `page_size` must be between 1 and 100
- `sort_by` must be one of: "name", "county", "registration_date", "voter_id"
- `sort_order` must be "asc" or "desc"

## Reused Entities

The following entities are already defined in the codebase and are reused without modification:

- **VoterGeocodedLocation** — `src/types/lookup.ts`
- **ManualLocationRequest** — `src/types/lookup.ts`
- **PointLookupResponse** — `src/types/lookup.ts`
- **LookupDistrict** — `src/types/lookup.ts`
- **UserRole** — `src/types/auth.ts` (admin, analyst, viewer)
