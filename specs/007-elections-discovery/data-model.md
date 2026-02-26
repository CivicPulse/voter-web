# Data Model: Elections Discovery and Details Redesign

**Feature**: 007-elections-discovery | **Date**: 2026-02-25

## Entity Relationship Overview

```text
Election (extended) ──1:N──▶ CandidateSummary (list endpoint)
                    ──1:1──▶ CandidateDetail ──1:N──▶ CandidateLink
                    ──1:1──▶ ElectionResultsResponse (existing, unchanged)
                    ──1:1──▶ ParticipationStats (existing, unchanged)
```

## Modified Types

### Election (extended)

**File**: `src/types/elections.ts`

Add 9 new nullable fields to the existing `Election` interface. All are optional and returned on both list and detail endpoints when populated.

```typescript
export interface Election {
  // ... existing fields unchanged ...
  id: string
  name: string
  election_date: string
  election_type: ElectionType
  district: string
  status: ElectionStatus
  last_refreshed_at: string | null
  ballot_item_id?: string | null
  precincts_reporting?: number | null
  precincts_participating?: number | null
  data_source_url?: string
  refresh_interval_seconds?: number
  created_at?: string
  updated_at?: string

  // NEW: Election metadata fields (all nullable)
  /** Detailed election description */
  description?: string | null
  /** Short statement of what the election decides (used in list view) */
  purpose?: string | null
  /** Human-readable eligibility description */
  eligibility_description?: string | null
  /** Voter registration deadline (YYYY-MM-DD) */
  registration_deadline?: string | null
  /** Early voting start date (YYYY-MM-DD) */
  early_voting_start?: string | null
  /** Early voting end date (YYYY-MM-DD) */
  early_voting_end?: string | null
  /** Absentee ballot request deadline (YYYY-MM-DD) */
  absentee_request_deadline?: string | null
  /** Qualifying period start (ISO 8601 datetime) */
  qualifying_start?: string | null
  /** Qualifying period end (ISO 8601 datetime) */
  qualifying_end?: string | null
}
```

### ElectionFilters (extended)

**File**: `src/types/elections.ts`

Extend the existing filter interface to support new API params and client-side search.

```typescript
export interface ElectionFilters {
  // Existing
  status: ElectionStatus | "all"
  election_type: ElectionType | "all"
  date_from: string | null
  date_to: string | null

  // NEW: API-supported boolean filters
  registration_open?: boolean
  early_voting_active?: boolean

  // NEW: Client-side search (not sent to API)
  search?: string
}
```

### UpdateElectionRequest (extended)

**File**: `src/types/elections.ts`

Add the new metadata fields to the admin update request.

```typescript
export interface UpdateElectionRequest {
  // ... existing fields ...
  name?: string
  data_source_url?: string
  status?: ElectionStatus
  refresh_interval_seconds?: number
  ballot_item_id?: string | null

  // NEW: metadata fields
  description?: string | null
  purpose?: string | null
  eligibility_description?: string | null
  registration_deadline?: string | null
  early_voting_start?: string | null
  early_voting_end?: string | null
  absentee_request_deadline?: string | null
  qualifying_start?: string | null
  qualifying_end?: string | null
}
```

## New Types

### Candidate Types

**File**: `src/types/candidates.ts` (new file)

```typescript
/** Filing status for a candidate */
export type FilingStatus = "qualified" | "withdrawn" | "disqualified" | "write_in"

/** Link types for candidate profiles */
export type CandidateLinkType =
  | "website"
  | "campaign"
  | "facebook"
  | "twitter"
  | "instagram"
  | "youtube"
  | "linkedin"
  | "other"

/** A link on a candidate profile */
export interface CandidateLink {
  id: string
  link_type: CandidateLinkType
  url: string
  label: string
}

/** Summary candidate record from the list endpoint */
export interface CandidateSummary {
  id: string
  election_id: string
  full_name: string
  party: string | null
  photo_url: string | null
  ballot_order: number | null
  filing_status: FilingStatus
  is_incumbent: boolean
  created_at: string
}

/** Full candidate detail from the detail endpoint */
export interface CandidateDetail extends CandidateSummary {
  bio: string | null
  sos_ballot_option_id: string | null
  updated_at: string
  links: CandidateLink[]
  /** Vote count from SOS results (populated when sos_ballot_option_id matches) */
  result_vote_count: number | null
  /** Party from SOS results (populated when sos_ballot_option_id matches) */
  result_political_party: string | null
}

/** Paginated candidate list response */
export interface PaginatedCandidateListResponse {
  items: CandidateSummary[]
  pagination: {
    total: number
    page: number
    page_size: number
    total_pages: number
  }
}

/** Query params for candidate list endpoint */
export interface CandidateListParams {
  status?: FilingStatus
  page?: number
  page_size?: number
}

// ============================================================================
// Admin Request Types
// ============================================================================

/** Request body for creating a candidate link (used in candidate create/link endpoints) */
export interface CreateCandidateLinkRequest {
  link_type: CandidateLinkType
  url: string
  label: string
}

/** Request body for POST /elections/{id}/candidates */
export interface CreateCandidateRequest {
  full_name: string
  party?: string | null
  bio?: string | null
  photo_url?: string | null
  ballot_order?: number | null
  filing_status?: FilingStatus
  is_incumbent?: boolean
  sos_ballot_option_id?: string | null
  links?: CreateCandidateLinkRequest[]
}

/** Request body for PATCH /candidates/{id} (all fields optional) */
export interface UpdateCandidateRequest {
  full_name?: string
  party?: string | null
  bio?: string | null
  photo_url?: string | null
  ballot_order?: number | null
  filing_status?: FilingStatus
  is_incumbent?: boolean
  sos_ballot_option_id?: string | null
}
```

### Validation Rules

| Field | Rule |
|-------|------|
| `CandidateSummary.full_name` | Required, max 200 chars |
| `CandidateSummary.filing_status` | One of: `qualified`, `withdrawn`, `disqualified`, `write_in` |
| `CandidateLink.link_type` | One of: `website`, `campaign`, `facebook`, `twitter`, `instagram`, `youtube`, `linkedin`, `other` |
| `CandidateLink.url` | Valid URL |
| `Election.registration_deadline` | YYYY-MM-DD format or null |
| `Election.early_voting_start` | YYYY-MM-DD format or null |
| `Election.early_voting_end` | YYYY-MM-DD format or null |
| `Election.absentee_request_deadline` | YYYY-MM-DD format or null |
| `Election.qualifying_start` | ISO 8601 datetime or null |
| `Election.qualifying_end` | ISO 8601 datetime or null |

### State Transitions

**Filing Status** (candidates):
```
qualified (default) → withdrawn
qualified → disqualified
(separate path) → write_in
```

**Tab Defaulting** (UI state):
```
Election loaded → check hasResults
  hasResults=true  → default tab = "results"
  hasResults=false → default tab = "info"
URL ?tab= present → override default (always)
User clicks tab   → navigate to selected tab (always)
```

## Existing Types (Unchanged)

The following existing types are used as-is:
- `ElectionResultsResponse`, `CandidateResult`, `CountyResult` — Results tab data
- `ParticipationStats`, `ElectionParticipant` — Participation tab data
- `CountyResultFeatureCollection`, `PrecinctResultFeatureCollection` — Map GeoJSON
- `NavigationContextState` (Zustand store) — Geographic context
