# API Contract: Candidates

**Base URL**: `/api/v1`
**Auth**: Read endpoints are public. Write endpoints require admin JWT.

## GET /elections/{election_id}/candidates

Paginated candidate list for an election.

### Request

| Param | Location | Type | Required | Notes |
|-------|----------|------|----------|-------|
| election_id | path | string (UUID) | Yes | Election to list candidates for |
| status | query | string | No | Filter: `qualified`, `withdrawn`, `disqualified`, `write_in` |
| page | query | int | No | Default 1 |
| page_size | query | int | No | Default 20, max 100 |

### Response (200)

```json
{
  "items": [
    {
      "id": "uuid",
      "election_id": "uuid",
      "full_name": "Andrea C. Cooke",
      "party": "Dem",
      "photo_url": "https://example.com/photo.jpg",
      "ballot_order": 1,
      "filing_status": "qualified",
      "is_incumbent": true,
      "created_at": "2026-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "page_size": 20,
    "total_pages": 1
  }
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| 404 | Election not found |

---

## GET /candidates/{candidate_id}

Full candidate detail including links and optional SOS result data.

### Request

| Param | Location | Type | Required |
|-------|----------|------|----------|
| candidate_id | path | string (UUID) | Yes |

### Response (200)

```json
{
  "id": "uuid",
  "election_id": "uuid",
  "full_name": "Andrea C. Cooke",
  "party": "Dem",
  "photo_url": "https://example.com/photo.jpg",
  "ballot_order": 1,
  "filing_status": "qualified",
  "is_incumbent": true,
  "created_at": "2026-01-15T10:00:00Z",
  "bio": "Community advocate and former city council member...",
  "sos_ballot_option_id": "SOS-123",
  "updated_at": "2026-02-01T14:30:00Z",
  "links": [
    {
      "id": "uuid",
      "link_type": "campaign",
      "url": "https://cookeforsenate.com",
      "label": "Campaign Site"
    },
    {
      "id": "uuid",
      "link_type": "twitter",
      "url": "https://twitter.com/cookeforsenate",
      "label": "@cookeforsenate"
    }
  ],
  "result_vote_count": 15234,
  "result_political_party": "Democratic"
}
```

### Notes

- `result_vote_count` and `result_political_party` are only populated when `sos_ballot_option_id` matches an entry in SOS results data
- `links` is always an array (empty if no links)

### Error Responses

| Status | Condition |
|--------|-----------|
| 404 | Candidate not found |

---

## POST /elections/{election_id}/candidates (Admin)

Create a candidate for an election.

### Request Body

```json
{
  "full_name": "Andrea C. Cooke",
  "party": null,
  "bio": "Community advocate...",
  "photo_url": "https://example.com/photo.jpg",
  "ballot_order": 1,
  "filing_status": "qualified",
  "is_incumbent": false,
  "sos_ballot_option_id": null,
  "links": [
    { "link_type": "campaign", "url": "https://...", "label": "Campaign Site" }
  ]
}
```

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|------------|
| full_name | string | Yes | — | Max 200 chars |
| party | string | No | null | — |
| bio | string | No | null | Plain text |
| photo_url | string | No | null | Valid URL |
| ballot_order | int | No | null | — |
| filing_status | string | No | "qualified" | One of filing status values |
| is_incumbent | bool | No | false | — |
| sos_ballot_option_id | string | No | null | — |
| links | array | No | [] | Array of link objects |

### Response (201)

Returns `CandidateDetail` (same shape as GET detail).

### Error Responses

| Status | Condition |
|--------|-----------|
| 401 | Unauthorized (no valid JWT) |
| 403 | Forbidden (not admin role) |
| 404 | Election not found |
| 409 | Duplicate candidate name for same election |

---

## PATCH /candidates/{candidate_id} (Admin)

Partial update. Send only fields to change (same shape as create body, minus `links`).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| full_name | string | No | Max 200 chars |
| party | string | No | — |
| bio | string | No | Plain text |
| photo_url | string | No | Valid URL |
| ballot_order | int | No | — |
| filing_status | string | No | One of filing status values |
| is_incumbent | bool | No | — |
| sos_ballot_option_id | string | No | — |

### Response (200)

Returns `CandidateDetail`.

### Error Responses

| Status | Condition |
|--------|-----------|
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Candidate not found |
| 409 | Duplicate candidate name for same election |

---

## DELETE /candidates/{candidate_id} (Admin)

### Response (204)

No content. Cascades to links.

### Error Responses

| Status | Condition |
|--------|-----------|
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Candidate not found |

---

## POST /candidates/{candidate_id}/links (Admin)

Add a link to a candidate.

### Request Body

```json
{
  "link_type": "website",
  "url": "https://example.com",
  "label": "Personal Website"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| link_type | string | Yes | One of link type values |
| url | string | Yes | Valid URL |
| label | string | Yes | — |

### Response (201)

Returns the created link object:

```json
{
  "id": "uuid",
  "link_type": "website",
  "url": "https://example.com",
  "label": "Personal Website"
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Candidate not found |

---

## DELETE /candidates/{candidate_id}/links/{link_id} (Admin)

### Response (204)

No content.

### Error Responses

| Status | Condition |
|--------|-----------|
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Link or candidate not found |

---

## Enumerations

### Filing Status

| Value | Description |
|-------|-------------|
| `qualified` | Default. Candidate is qualified to appear on ballot |
| `withdrawn` | Candidate has withdrawn |
| `disqualified` | Candidate has been disqualified |
| `write_in` | Write-in candidate |

### Link Types

`website` | `campaign` | `facebook` | `twitter` | `instagram` | `youtube` | `linkedin` | `other`

## Frontend Usage

### Voter-facing (public, no auth)

1. `GET /elections/{id}/candidates` — Election Information tab, candidates section (all statuses, sorted by ballot_order)
2. `GET /candidates/{id}` — Candidate detail page (`/candidates/$candidateId`)

### Admin-facing (requires admin JWT)

3. `POST /elections/{id}/candidates` — Create candidate via Dialog form on Election Information tab
4. `PATCH /candidates/{id}` — Edit candidate via Dialog form
5. `DELETE /candidates/{id}` — Delete candidate with AlertDialog confirmation
6. `POST /candidates/{id}/links` — Add link within candidate Dialog
7. `DELETE /candidates/{id}/links/{link_id}` — Remove link within candidate Dialog
