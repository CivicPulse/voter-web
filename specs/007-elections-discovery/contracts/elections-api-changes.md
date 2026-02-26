# API Contract: Election Endpoint Changes

**Base URL**: `/api/v1`

## Modified: GET /elections/{id} (Election Detail)

### New Response Fields

Nine new nullable fields added to the existing election detail response. All are `null` for elections that haven't been enriched.

```json
{
  "id": "uuid",
  "name": "State Senate District 18 Special Election",
  "election_date": "2026-03-15",
  "election_type": "special",
  "district": "State Senate District 18",
  "status": "active",
  "last_refreshed_at": "2026-03-15T20:30:00Z",
  "data_source_url": "https://...",
  "refresh_interval_seconds": 20,
  "created_at": "2026-02-01T10:00:00Z",
  "updated_at": "2026-03-15T20:30:00Z",

  "description": "Special election to fill the vacant State Senate District 18 seat following the resignation of Senator Smith.",
  "purpose": "Special — State Senate District 18",
  "eligibility_description": "Registered voters residing in State Senate District 18 (Bibb, Houston, and Peach counties).",
  "registration_deadline": "2026-02-13",
  "early_voting_start": "2026-03-03",
  "early_voting_end": "2026-03-12",
  "absentee_request_deadline": "2026-03-07",
  "qualifying_start": "2026-01-06T09:00:00-05:00",
  "qualifying_end": "2026-01-10T12:00:00-05:00"
}
```

| Field | Type | Description |
|-------|------|-------------|
| description | string \| null | Detailed election description |
| purpose | string \| null | Short statement of what the election decides |
| eligibility_description | string \| null | Who can vote (human-readable) |
| registration_deadline | string \| null | YYYY-MM-DD |
| early_voting_start | string \| null | YYYY-MM-DD |
| early_voting_end | string \| null | YYYY-MM-DD |
| absentee_request_deadline | string \| null | YYYY-MM-DD |
| qualifying_start | string \| null | ISO 8601 datetime with timezone |
| qualifying_end | string \| null | ISO 8601 datetime with timezone |

### Backward Compatibility

All new fields are nullable and default to `null`. Existing consumers that don't read these fields are unaffected.

---

## Modified: GET /elections (Election List)

### New Query Parameters

| Param | Type | Behavior |
|-------|------|----------|
| registration_open | bool | `true` → only elections with `registration_deadline >= today` |
| early_voting_active | bool | `true` → only elections where `early_voting_start <= today <= early_voting_end` |
| district_type | string | Exact match on district type (e.g., `county_commission`) |
| district_identifier | string | Exact match on district identifier (e.g., `5`) |

When `false` or omitted, no filter is applied. Response shape is unchanged (same pagination wrapper, same fields — now including the 9 new metadata fields above when populated).

### Existing Query Parameters (Unchanged)

| Param | Type | Notes |
|-------|------|-------|
| status | string | `active` or `finalized` |
| election_type | string | `general`, `primary`, `special`, `runoff` |
| date_from | string | YYYY-MM-DD |
| date_to | string | YYYY-MM-DD |
| page | int | Default 1 |
| page_size | int | Default 20, max 100 |

---

## Modified: PATCH /elections/{id} (Admin)

Accepts the 9 new metadata fields in the request body. No new endpoint needed.

```json
{
  "description": "...",
  "purpose": "...",
  "eligibility_description": "...",
  "registration_deadline": "2026-02-13",
  "early_voting_start": "2026-03-03",
  "early_voting_end": "2026-03-12",
  "absentee_request_deadline": "2026-03-07",
  "qualifying_start": "2026-01-06T09:00:00-05:00",
  "qualifying_end": "2026-01-10T12:00:00-05:00"
}
```

---

## Frontend Usage Summary

| Endpoint | Feature Usage |
|----------|---------------|
| `GET /elections` | Elections list page — flat searchable list with filters |
| `GET /elections` + `registration_open=true` | Optional "Registration Open" filter |
| `GET /elections` + `early_voting_active=true` | Optional "Early Voting Now" filter |
| `GET /elections/{id}` | Election detail page — header, metadata, key dates, eligibility |
| `GET /elections/{id}/candidates` | Election Information tab — candidates section |
| `GET /elections/{id}/results` | Results tab (existing, unchanged) |
| `GET /elections/{id}/participation/stats` | Participation tab (existing, unchanged) |
