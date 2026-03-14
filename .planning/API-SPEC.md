# Election Filter API Specification

**Version:** 1.0 (Draft)
**Date:** 2026-03-14
**Audience:** Backend team (voter-api / FastAPI)
**Relationship:** Extends the existing `GET /api/v1/elections` endpoint and adds two new endpoints

## Overview

The elections list page currently supports filtering by `status`, `election_type`, `date_from`, `date_to`, `registration_open`, and `early_voting_active`. This specification covers:

1. A **capabilities endpoint** that advertises which new filter parameters the API supports
2. Five **new filter parameters** on the existing `GET /elections` endpoint
3. A **filter-options endpoint** that returns valid values for dynamic filter dropdowns

The frontend uses the capabilities endpoint to conditionally render filter UI. If the capabilities endpoint returns 404 or errors, only existing (Phase 1) filters are shown. Each new parameter can be implemented and shipped independently.

---

## 1. Capabilities Endpoint

### `GET /api/v1/elections/capabilities`

Advertises which filter parameters and endpoints are currently deployed. The frontend fetches this once per session (cached 5 minutes) to decide which filter controls to render.

**Authentication:** None required (public endpoint). Use the same access pattern as `GET /elections`.

**Response:** `200 OK`

```json
{
  "supported_filters": ["q", "race_category", "county", "district", "election_date"],
  "endpoints": {
    "filter_options": true
  }
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `supported_filters` | `string[]` | List of query parameter names the `GET /elections` endpoint accepts. Only include params that are fully implemented and tested. |
| `endpoints.filter_options` | `boolean` | Whether `GET /elections/filter-options` is available. |

**Implementation guidance:**

- Return only the parameter names that are actually implemented. As each parameter is added, append its name to the `supported_filters` array.
- The frontend maps these names to feature flags: `q` -> search, `race_category` -> race category filter, `county`/`district` -> geographic filters, `election_date` -> date picker.
- This endpoint should be cheap (no DB queries) -- it can return a static/hardcoded response that is updated at deploy time.

**Example: partial support (only search implemented so far)**

```json
{
  "supported_filters": ["q"],
  "endpoints": {
    "filter_options": false
  }
}
```

**Example: nothing implemented yet**

```json
{
  "supported_filters": [],
  "endpoints": {
    "filter_options": false
  }
}
```

**Error behavior:**

- If this endpoint does not exist (404), the frontend disables all new filter UI and uses only Phase 1 filters.
- No special error responses needed beyond standard FastAPI error handling.

---

## 2. New Filter Parameters on `GET /api/v1/elections`

All new parameters combine with existing filters using AND logic. For example, `?status=active&q=senate&county=Bibb` returns active elections matching "senate" in Bibb County.

FastAPI ignores unknown query parameters by default, so adding these parameters is backward-compatible -- existing clients sending unknown params will not break.

### 2.1 `q` (Text Search)

**Purpose:** Free-text search across election records. Allows users to find elections by name or district without scrolling through hundreds of results.

| Property | Value |
|----------|-------|
| Parameter name | `q` |
| Type | `string` |
| Required | No |
| Minimum length | 2 characters |
| Maximum length | 200 characters |
| Case sensitivity | Case-insensitive |
| Match type | Partial match (contains) |

**Behavior:** Searches the `name` and `district` fields of Election records. Returns elections where either field contains the search term as a case-insensitive substring.

**Cross-reference:** The existing `q` parameter on `GET /elections/{id}/participation` searches voter names within a specific election. This `q` parameter searches election records themselves -- same naming convention, different domain.

**Example request:**

```
GET /api/v1/elections?q=senate&status=active
```

**Example response:** Standard paginated election list, filtered to elections where `name` or `district` contains "senate" (case-insensitive).

```json
{
  "items": [
    {
      "id": "abc-123",
      "name": "State Senate District 18 Special",
      "election_date": "2026-02-17",
      "election_type": "special",
      "district": "State Senate District 18",
      "status": "active",
      "last_refreshed_at": "2026-02-17T20:00:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "page_size": 25,
    "total_pages": 1
  }
}
```

**Edge cases:**

| Scenario | Behavior |
|----------|----------|
| `q` is empty string | Ignore parameter (return unfiltered) |
| `q` has 1 character | Return `422 Unprocessable Entity` with validation error: minimum 2 characters |
| `q` matches nothing | Return empty `items` array with `total: 0` |
| `q` contains special characters | Treat as literal text (no regex interpretation) |
| `q` has leading/trailing whitespace | Trim before searching |

**Suggested implementation:**

```python
# SQLAlchemy (case-insensitive partial match)
if q and len(q) >= 2:
    pattern = f"%{q.strip()}%"
    query = query.filter(
        or_(
            Election.name.ilike(pattern),
            Election.district.ilike(pattern),
        )
    )
```

---

### 2.2 `race_category` (Race Category Filter)

**Purpose:** Filter elections by level of government (federal, state, local). Users often care about a specific level -- e.g., "show me only state senate races."

| Property | Value |
|----------|-------|
| Parameter name | `race_category` |
| Type | `string` (enum) |
| Required | No |
| Case sensitivity | Case-insensitive |

**Behavior:** Filters elections to those matching the specified category of government level.

**Enum values:** The backend team should define the canonical enum values based on the data model. The frontend currently uses a client-side heuristic (`categorizeRace()` in `src/types/elections.ts`) that categorizes by district name patterns:

- District containing "US" or "President" -> federal
- District containing "State Senate" or "Senate District" -> state senate
- District containing "State House" or "House District" -> state house
- Everything else -> local (catch-all for Commissioner, Board of Education, etc.)

**Recommendation:** Add a `race_category` field to the `Election` model (or derive it server-side from the district name). Possible enum values:

- `federal` -- US Congress, President
- `state_senate` -- State Senate races
- `state_house` -- State House races
- `local` -- County commission, school board, municipal, etc.

The backend team has final authority on the taxonomy. The frontend will populate its dropdown from the `GET /elections/filter-options` endpoint (section 3).

**Example request:**

```
GET /api/v1/elections?race_category=state_senate&status=active
```

**Example response:** Standard paginated list, filtered to state senate elections only.

**Edge cases:**

| Scenario | Behavior |
|----------|----------|
| Unknown category value | Return `422` with allowed values listed |
| `race_category` is empty | Ignore parameter (return unfiltered) |
| No elections match category | Return empty `items` with `total: 0` |

---

### 2.3 `county` (County Filter)

**Purpose:** Filter elections to those relevant to a specific county. Users visiting from a county detail page want to see only elections in their county.

| Property | Value |
|----------|-------|
| Parameter name | `county` |
| Type | `string` |
| Required | No |
| Case sensitivity | Case-insensitive |
| Format | County name without "County" suffix (e.g., "Bibb", not "Bibb County") |

**Behavior:** Returns elections whose district is geographically associated with the specified county. The exact association depends on the data model:

- If elections have a `boundary_id` linking to a boundary record, filter by boundaries associated with the county.
- If the association is via district name, filter where the district name contains the county name or where the election's geographic scope includes the county.
- Statewide elections (e.g., Governor, US Senate) should be included when filtering by any county, since they apply to all counties.

**Example request:**

```
GET /api/v1/elections?county=Bibb&status=active
```

**Example response:** Elections relevant to Bibb County, including statewide races.

```json
{
  "items": [
    {
      "id": "abc-123",
      "name": "Bibb County Commission District 3",
      "district": "Bibb County Commission District 3",
      "election_date": "2026-11-03",
      "election_type": "general",
      "status": "active",
      "last_refreshed_at": null
    },
    {
      "id": "def-456",
      "name": "US Senate General",
      "district": "US Senate",
      "election_date": "2026-11-03",
      "election_type": "general",
      "status": "active",
      "last_refreshed_at": null
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "page_size": 25,
    "total_pages": 1
  }
}
```

**Edge cases:**

| Scenario | Behavior |
|----------|----------|
| Unknown county name | Return empty `items` with `total: 0` (not a 422) |
| `county` is empty | Ignore parameter (return unfiltered) |
| County name with "County" suffix | Optionally strip suffix, or return empty (document behavior) |

---

### 2.4 `district` (District Filter)

**Purpose:** Filter elections to a specific district. Useful when navigating from a district detail page.

| Property | Value |
|----------|-------|
| Parameter name | `district` |
| Type | `string` |
| Required | No |
| Case sensitivity | Case-insensitive |
| Match type | Exact match (after case normalization) |

**Behavior:** Returns elections whose `district` field matches the provided value exactly (case-insensitive). Unlike the `q` parameter which does partial matching, `district` requires an exact match to avoid ambiguity (e.g., "Senate District 1" should not match "Senate District 10").

**Example request:**

```
GET /api/v1/elections?district=State%20Senate%20District%2018
```

**Example response:** All elections for State Senate District 18.

**Edge cases:**

| Scenario | Behavior |
|----------|----------|
| No exact match | Return empty `items` with `total: 0` |
| `district` is empty | Ignore parameter (return unfiltered) |
| Partial district name | No match (exact only -- use `q` for partial search) |

---

### 2.5 `election_date` (Exact Date Filter)

**Purpose:** Filter elections to a specific date. Complements the existing `date_from`/`date_to` range filters for when the user wants elections on exactly one date (e.g., "November 3, 2026").

| Property | Value |
|----------|-------|
| Parameter name | `election_date` |
| Type | `string` |
| Required | No |
| Format | `YYYY-MM-DD` (ISO 8601 date) |
| Validation | Must be a valid date |

**Behavior:** Returns elections where `election_date` exactly matches the provided date. This is equivalent to `date_from=2026-11-03&date_to=2026-11-03` but more explicit and ergonomic for single-date selection.

**Interaction with `date_from`/`date_to`:** If `election_date` is provided alongside `date_from` or `date_to`, `election_date` takes precedence (overrides the range). Document this in the API docs. Alternatively, return `422` if both are provided -- backend team's choice.

**Example request:**

```
GET /api/v1/elections?election_date=2026-11-03
```

**Example response:** All elections on November 3, 2026.

**Edge cases:**

| Scenario | Behavior |
|----------|----------|
| Invalid date format | Return `422` with format guidance |
| Valid format, impossible date (e.g., 2026-02-30) | Return `422` |
| `election_date` is empty | Ignore parameter (return unfiltered) |
| No elections on that date | Return empty `items` with `total: 0` |

---

## 3. Filter Options Endpoint

### `GET /api/v1/elections/filter-options`

Returns the valid values for each supported filter parameter. The frontend uses this to populate dropdown menus with only values that yield results.

**Authentication:** None required (public endpoint).

**Response:** `200 OK`

```json
{
  "race_categories": [
    "federal",
    "state_senate",
    "state_house",
    "local"
  ],
  "counties": [
    "Bibb",
    "Houston",
    "Peach",
    "Twiggs"
  ],
  "election_dates": [
    "2026-11-03",
    "2026-06-09",
    "2026-02-17"
  ]
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `race_categories` | `string[]` | Valid values for the `race_category` parameter. Only categories with at least one election. |
| `counties` | `string[]` | County names that have associated elections. Sorted alphabetically. |
| `election_dates` | `string[]` | Dates that have at least one election. Sorted descending (most recent first). Format: `YYYY-MM-DD`. |

**Optional scoping (context-sensitive options):**

The endpoint optionally accepts the same filter parameters as `GET /elections` to scope the returned options. For example:

```
GET /api/v1/elections/filter-options?status=active
```

Returns only race categories, counties, and dates that have at least one **active** election. This prevents dead-end filter selections (e.g., showing a county in the dropdown that has no active elections).

If scoping is too complex for the initial implementation, returning unscoped options (all valid values regardless of current filters) is acceptable. The frontend can handle zero-result scenarios gracefully.

**Edge cases:**

| Scenario | Behavior |
|----------|----------|
| No elections exist | Return empty arrays for all fields |
| Filter scope yields no results | Return empty arrays |

---

## 4. Implementation Notes

### Backward Compatibility

FastAPI ignores unknown query parameters by default. Existing frontend versions sending only `status`, `election_type`, `date_from`, `date_to`, `registration_open`, or `early_voting_active` will continue to work without changes.

### Independent Deployment

Each parameter can be implemented and shipped independently:

1. Implement the parameter on `GET /elections`
2. Add the parameter name to the capabilities response
3. The frontend will automatically show the corresponding filter control

### Suggested Implementation Order

| Order | Parameter/Endpoint | Complexity | Notes |
|-------|-------------------|------------|-------|
| 1 | Capabilities endpoint | Low | Static response, no DB queries |
| 2 | `q` (text search) | Low | Simple `ILIKE` on two columns |
| 3 | `election_date` | Low | Exact date match on existing column |
| 4 | `district` | Low | Exact match (case-insensitive) on existing column |
| 5 | `race_category` | Medium | Requires defining taxonomy and either a new column or server-side categorization logic |
| 6 | `county` | Medium | Requires geographic association logic (boundary linkage or district-county mapping) |
| 7 | Filter options endpoint | High | Aggregation queries, optional scoping by current filters |

### Parameter Validation Summary

| Parameter | Type | Min | Max | Format | Invalid Value Response |
|-----------|------|-----|-----|--------|----------------------|
| `q` | string | 2 chars | 200 chars | Free text | 422 if < 2 chars |
| `race_category` | string | -- | -- | Enum | 422 with allowed values |
| `county` | string | 1 char | -- | County name | Empty result (not 422) |
| `district` | string | 1 char | -- | District name | Empty result (not 422) |
| `election_date` | string | -- | -- | YYYY-MM-DD | 422 if invalid format |

### Combined Filter Example

```
GET /api/v1/elections?status=active&q=senate&county=Bibb&election_date=2026-11-03&page=1&page_size=25
```

Returns active elections matching "senate" in Bibb County on November 3, 2026. All filters combine with AND logic.

---

## Appendix: Frontend Feature Flag Mapping

For reference, here is how the frontend maps API capabilities to UI controls:

| API `supported_filters` value | Frontend feature flag | UI control shown |
|-------------------------------|----------------------|-----------------|
| `q` | `search` | Text search input |
| `race_category` | `raceCategory` | Race category dropdown |
| `county` | `geographic` | County filter dropdown |
| `district` | `geographic` | District filter input |
| `election_date` | `electionDate` | Date picker (exact date) |

The `geographic` flag is enabled by either `county` or `district` (or both) being present in `supported_filters`.

The `filterOptions` flag is derived from `endpoints.filter_options` and controls whether dropdown values are fetched from `GET /elections/filter-options` or hardcoded/omitted.
