# API Contract: Create Election (Updated)

**Endpoint**: `POST /api/v1/elections`
**Auth**: Bearer token required; admin role required
**Change**: Add optional `boundary_id` field; make `data_source_url` optional

---

## Request Body Changes

```json
{
  "name": "string (required)",
  "election_date": "YYYY-MM-DD (required)",
  "election_type": "general | primary | special | runoff (required)",
  "district": "string (required — auto-populated from boundary name if boundary_id set)",
  "data_source_url": "URL string (optional — null/empty for manual elections)",
  "refresh_interval_seconds": "integer ≥ 60 (required)",
  "boundary_id": "UUID string (optional — links election to geographic boundary)"
}
```

**New field**: `boundary_id` — optional UUID. When provided, the election is associated with the geographic boundary record.

**Changed field**: `data_source_url` — relaxed from required to optional. Manual elections (local races not in SOS feed) have no data source URL.

---

## Response Changes

The election response now includes `source` and optionally `boundary_id`:

```json
{
  "id": "uuid",
  "name": "string",
  "election_date": "YYYY-MM-DD",
  "election_type": "general | primary | special | runoff",
  "district": "string",
  "status": "active | finalized",
  "source": "sos_feed | manual",
  "boundary_id": "uuid | null",
  "data_source_url": "URL | null",
  "refresh_interval_seconds": 120,
  "last_refreshed_at": "ISO datetime | null",
  "created_at": "ISO datetime",
  "updated_at": "ISO datetime"
}
```

**New response field**: `source` — set server-side based on how the election was created. Manual (via form without SOS feed) → `"manual"`. Via SOS feed → `"sos_feed"`.

---

## List/Detail Response Changes

Both `GET /elections` (list) and `GET /elections/{id}` (detail) now include `source` in their responses.

List item schema gains:
```json
{
  "source": "sos_feed | manual"
}
```

The frontend `Election` interface gains `source?: "sos_feed" | "manual" | null`.
