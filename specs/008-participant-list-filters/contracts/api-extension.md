# API Contract: Election Participation Filters

**Feature**: `008-participant-list-filters`

No new API endpoints. This document describes the extended query parameter contract for the existing endpoint.

---

## Extended Endpoint: GET /elections/{id}/participation

### Request

```
GET /elections/{id}/participation
  ?page={number}
  &page_size={number}
  &q={string}                          # existing
  &county={string}                     # NEW — e.g. "BIBB"
  &voter_status={string}               # NEW — e.g. "Active"
  &has_district_mismatch={bool}        # NEW — true | false
  &county_precinct={string}            # NEW — e.g. "001"
  &ballot_style={string}               # NEW — e.g. "GEN2024"
  &congressional_district={string}     # NEW — e.g. "002"
  &state_senate_district={string}      # NEW — e.g. "018"
  &state_house_district={string}       # NEW — e.g. "147"
```

**All filter params are optional and AND-combined with each other and with `q`.**

### Response

Unchanged. Same paginated shape as before:

```json
{
  "items": [
    {
      "id": "uuid",
      "voter_id": "uuid | null",
      "voter_registration_number": "string",
      "first_name": "string | null",
      "last_name": "string | null",
      "county": "string",
      "election_date": "YYYY-MM-DD",
      "election_type": "string",
      "normalized_election_type": "string",
      "party": "string | null",
      "ballot_style": "string | null",
      "early_voting": "boolean",
      "absentee": "boolean",
      "provisional": "boolean",
      "supplemental": "boolean"
    }
  ],
  "pagination": {
    "total": 10000,
    "page": 1,
    "page_size": 25,
    "total_pages": 400
  }
}
```

---

## Existing Endpoints Used for Filter Options

### GET /elections/{id}/participation/stats

Used to populate **county** and **ballot_style** dropdown options.

Relevant fields:
```json
{
  "by_county": [{ "county": "BIBB", "count": 423 }],
  "by_ballot_style": [{ "ballot_style": "GEN2024", "count": 4200 }]
}
```

No params needed for filter population — returns all counties/styles for the election.

---

### GET /voters/filters

Used to populate **voter_status**, **county_precinct**, **congressional_district**, **state_senate_district**, **state_house_district** dropdown options.

```
GET /voters/filters                     # → statuses (no county scope)
GET /voters/filters?county={county}     # → county_precincts, district lists
```

Response shape (existing):
```json
{
  "counties": ["BIBB", "HOUSTON"],
  "statuses": ["Active", "Inactive", "Cancelled"],
  "congressional_districts": ["002", "008"],
  "state_senate_districts": ["018", "026"],
  "state_house_districts": ["141", "147"],
  "county_precincts": ["001", "002A"],
  "county_commission_districts": ["1", "2"],
  "school_board_districts": ["1", "2"]
}
```

---

## Frontend Client Changes

### `src/lib/api/elections.ts` — `getElectionParticipants()`

```typescript
export async function getElectionParticipants(
  electionId: string,
  params?: {
    page?: number
    page_size?: number
    q?: string
    county?: string
    voter_status?: string
    has_district_mismatch?: boolean
    county_precinct?: string
    ballot_style?: string
    congressional_district?: string
    state_senate_district?: string
    state_house_district?: string
  },
): Promise<ElectionParticipantsResponse> {
  const searchParams: Record<string, string> = {}
  if (params?.page) searchParams.page = String(params.page)
  if (params?.page_size) searchParams.page_size = String(params.page_size)
  if (params?.q) searchParams.q = params.q
  if (params?.county) searchParams.county = params.county
  if (params?.voter_status) searchParams.voter_status = params.voter_status
  if (params?.has_district_mismatch != null) searchParams.has_district_mismatch = String(params.has_district_mismatch)
  if (params?.county_precinct) searchParams.county_precinct = params.county_precinct
  if (params?.ballot_style) searchParams.ballot_style = params.ballot_style
  if (params?.congressional_district) searchParams.congressional_district = params.congressional_district
  if (params?.state_senate_district) searchParams.state_senate_district = params.state_senate_district
  if (params?.state_house_district) searchParams.state_house_district = params.state_house_district
  // ... rest unchanged
}
```

---

## URL Search Param Schema (Route Extension)

### `src/routes/elections/$electionDate.tsx`

```typescript
const searchSchema = z.object({
  // existing
  tab: z.enum(["info", "results", "participation"]).optional(),
  // NEW participant filter params (prefixed p_ to avoid future collisions)
  p_q:            z.string().optional().catch(undefined),
  p_county:       z.string().optional().catch(undefined),
  p_voter_status: z.string().optional().catch(undefined),
  p_mismatch:     z.enum(["true", "false"]).optional().catch(undefined),
  p_precinct:     z.string().optional().catch(undefined),
  p_ballot_style: z.string().optional().catch(undefined),
  p_congressional: z.string().optional().catch(undefined),
  p_senate:       z.string().optional().catch(undefined),
  p_house:        z.string().optional().catch(undefined),
  p_page:         z.coerce.number().int().positive().optional().catch(undefined),
})
```
