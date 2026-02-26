# API Contract: Boundaries List with Search

**Endpoint**: `GET /api/v1/boundaries`
**Auth**: Bearer token required
**Change**: Add optional `search` query parameter (tracked in voter-api#92)

---

## Request

```
GET /api/v1/boundaries?type={type}&search={search}&page={page}&page_size={page_size}
Authorization: Bearer {access_token}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | No | Filter by boundary type (e.g., `county_commission`, `state_senate`) |
| `search` | string | No | **NEW** — Case-insensitive partial match on boundary name or identifier |
| `county` | string | No | Filter by county name |
| `source` | string | No | Filter by source |
| `page` | integer | No | Page number (default: 1) |
| `page_size` | integer | No | Results per page (default: 25, max: 100) |

---

## Response

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "string",
      "boundary_type": "county_commission | state_senate | state_house | congressional | school_board | ...",
      "boundary_identifier": "string (e.g., '005', '018')",
      "county": "string | null",
      "source": "string"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "page_size": 25,
    "total_pages": 2
  }
}
```

---

## Display Format in Combobox

Each boundary is displayed as:
```
{boundary_type} — {boundary_identifier} ({county})
```

Examples:
- `county_commission — 005 (Bibb)`
- `state_senate — 018`
- `congressional — 008 (Multiple counties)`

When `county` is null: omit the parenthetical.

---

## Existing: Boundary Types Endpoint

**No changes** — already exists and returns:

```
GET /api/v1/boundaries/types
```

```json
{
  "types": ["county_commission", "state_senate", "state_house", "congressional", "school_board", ...]
}
```

Used to populate the type filter dropdown in the `BoundarySelector`.

---

## Frontend Behavior

- The `useBoundaries()` hook is enabled when:
  - A boundary type is selected (fetches all of that type, up to page_size=50), OR
  - Search text has ≥ 2 characters (triggers server-side search)
- Search is debounced 300ms before triggering a refetch
- When `search` param is not yet supported by backend, results show all boundaries of the selected type (graceful degradation)
