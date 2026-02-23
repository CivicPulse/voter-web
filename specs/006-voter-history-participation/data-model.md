# Data Model: Voter History & Election Participation

**Feature Branch**: `006-voter-history-participation`
**Date**: 2026-02-23

## Entities

### 1. VoterParticipationRecord

A single record of a voter's participation in an election. Returned as an array from the voter history endpoint.

**Location**: `src/types/voter.ts` (add to existing file)

| Field | Type | Description |
|-------|------|-------------|
| `election_id` | `string` | UUID of the election |
| `election_name` | `string` | Display name of the election/race |
| `election_date` | `string` | ISO date string (YYYY-MM-DD) |
| `election_type` | `ElectionType` | `"general" \| "primary" \| "special" \| "runoff"` |
| `voting_method` | `string` | How the voter cast their ballot (e.g., "In Person", "Absentee by Mail", "Early Voting") |

**Relationships**:
- Belongs to a `VoterDetail` (fetched via `voter_registration_number`)
- References an `Election` (via `election_id`, navigable to election detail page)

**Validation Rules**:
- `election_id` must be a valid UUID
- `election_date` must be a valid ISO date
- `election_type` must be one of the defined `ElectionType` values
- `voting_method` is a free-form string (backend-defined, varies by jurisdiction)

**State Transitions**: None — participation records are immutable historical data.

### 2. ParticipationStats

Aggregate turnout statistics for a specific election. Returned from the participation stats endpoint.

**Location**: `src/types/elections.ts` (add to existing file)

| Field | Type | Description |
|-------|------|-------------|
| `election_id` | `string` | UUID of the election |
| `total_eligible` | `number` | Total eligible voters for this election |
| `total_voted` | `number` | Total voters who participated |
| `turnout_percentage` | `number` | Pre-calculated turnout percentage (0-100) |
| `is_preliminary` | `boolean` | Whether vote counting is still in progress |
| `party_breakdown` | `PartyBreakdownItem[]` | Breakdown by voter party affiliation |
| `method_breakdown` | `MethodBreakdownItem[]` | Breakdown by voting method |

### 3. PartyBreakdownItem

A single entry in the party affiliation breakdown.

**Location**: `src/types/elections.ts` (add to existing file)

| Field | Type | Description |
|-------|------|-------------|
| `party` | `string` | Party abbreviation (e.g., "Dem", "Rep", "Lib", "Ind") |
| `count` | `number` | Number of voters from this party who participated |
| `percentage` | `number` | Percentage of total votes cast (0-100) |

### 4. MethodBreakdownItem

A single entry in the voting method breakdown.

**Location**: `src/types/elections.ts` (add to existing file)

| Field | Type | Description |
|-------|------|-------------|
| `method` | `string` | Voting method name (e.g., "In Person", "Absentee by Mail", "Early Voting") |
| `count` | `number` | Number of voters who used this method |
| `percentage` | `number` | Percentage of total votes cast (0-100) |

### 5. ElectionParticipant

A voter who participated in a specific election. Returned in a paginated list from the election participants endpoint.

**Location**: `src/types/elections.ts` (add to existing file)

| Field | Type | Description |
|-------|------|-------------|
| `voter_id` | `string` | Internal UUID of the voter |
| `voter_registration_number` | `string` | Voter registration number (display identifier) |
| `first_name` | `string` | Voter's first name |
| `last_name` | `string` | Voter's last name |
| `county` | `string` | Voter's county |
| `voting_method` | `string` | How this voter cast their ballot |

**Relationships**:
- References a `VoterDetail` (via `voter_id`, navigable to voter detail page)
- Belongs to an `Election` (via the parent endpoint)

### 6. ElectionParticipantsResponse

Paginated response for the election participants list.

**Location**: `src/types/elections.ts` (add to existing file)

| Field | Type | Description |
|-------|------|-------------|
| `items` | `ElectionParticipant[]` | Array of participants for the current page |
| `pagination` | `PaginationInfo` | Pagination metadata |

### 7. PaginationInfo

Standard pagination metadata (matches existing backend pattern from election list endpoint).

**Location**: `src/types/elections.ts` (reuse if already exists, otherwise add)

| Field | Type | Description |
|-------|------|-------------|
| `total` | `number` | Total number of items |
| `page` | `number` | Current page number (1-based) |
| `page_size` | `number` | Items per page |
| `total_pages` | `number` | Total number of pages |

## Type Definitions (TypeScript)

```typescript
// === src/types/voter.ts (additions) ===

import type { ElectionType } from "@/types/elections"

export interface VoterParticipationRecord {
  election_id: string
  election_name: string
  election_date: string
  election_type: ElectionType
  voting_method: string
}

// === src/types/elections.ts (additions) ===

export interface PartyBreakdownItem {
  party: string
  count: number
  percentage: number
}

export interface MethodBreakdownItem {
  method: string
  count: number
  percentage: number
}

export interface ParticipationStats {
  election_id: string
  total_eligible: number
  total_voted: number
  turnout_percentage: number
  is_preliminary: boolean
  party_breakdown: PartyBreakdownItem[]
  method_breakdown: MethodBreakdownItem[]
}

export interface ElectionParticipant {
  voter_id: string
  voter_registration_number: string
  first_name: string
  last_name: string
  county: string
  voting_method: string
}

export interface ElectionParticipantsResponse {
  items: ElectionParticipant[]
  pagination: {
    total: number
    page: number
    page_size: number
    total_pages: number
  }
}
```

## Entity Relationship Diagram

```text
VoterDetail (existing)
  └── has many → VoterParticipationRecord
                    └── references → Election (via election_id)

Election (existing)
  ├── has one → ParticipationStats
  │               ├── has many → PartyBreakdownItem
  │               └── has many → MethodBreakdownItem
  └── has many → ElectionParticipant (paginated)
                    └── references → VoterDetail (via voter_id)
```
