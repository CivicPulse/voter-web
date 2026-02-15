# Data Model: Live Election Results Visualization

**Feature**: `002-election-results` | **Date**: 2026-02-15

## Overview

This document defines the TypeScript types for the election results feature. These types map to the voter-api backend responses with frontend-only constructs for election event grouping.

**Important**: The backend API models each race/contest as a separate `Election` record. The frontend groups elections by `election_date` to create "election events." See [research.md](research.md) §1 for full rationale.

## Entity Relationship

```text
ElectionEvent (frontend-only, grouped by date)
  └── Election (1 per API record = 1 race/contest)
        ├── ElectionResults (race-wide summary)
        │     ├── CandidateResult[]
        │     │     └── VoteMethodResult[]
        │     └── CountyResult[]
        │           └── CandidateResult[]
        │                 └── VoteMethodResult[]
        └── GeoJSON (county-level or precinct-level)
```

## Types

### Election (API Entity — represents a single race/contest)

```typescript
/** Election types as defined by the backend */
export type ElectionType = "general" | "primary" | "special" | "runoff"

/** Election lifecycle status */
export type ElectionStatus = "active" | "finalized"

/** An election record from the API — represents a single race/contest */
export interface Election {
  id: string                          // UUID
  name: string                        // e.g., "State Senate District 18 Special"
  election_date: string               // ISO date: "2026-02-17"
  election_type: ElectionType
  district: string                    // e.g., "State Senate - District 18"
  data_source_url: string             // SOS results URL (admin-only visibility)
  status: ElectionStatus
  last_refreshed_at: string | null    // ISO datetime or null if never refreshed
  refresh_interval_seconds: number    // Minimum 60
  created_at: string                  // ISO datetime
  updated_at: string                  // ISO datetime
}
```

### Election Event (Frontend-Only Grouping)

```typescript
/**
 * Frontend construct grouping multiple API Elections (races) by shared date.
 * Not an API entity — computed client-side from the elections list.
 */
export interface ElectionEvent {
  /** ISO date string used as the grouping key and URL parameter */
  date: string                        // e.g., "2026-02-17"
  /** Distinct election types present on this date */
  types: ElectionType[]
  /** All races (API elections) on this date */
  races: Election[]
  /** Count of races */
  raceCount: number
  /** Overall reporting progress across all races (if available) */
  hasActiveRaces: boolean
}
```

### Candidate Result

```typescript
/** A candidate's result within a specific election/race */
export interface CandidateResult {
  id: string
  name: string
  political_party: string             // e.g., "Dem", "Rep", "Lib", "Ind"
  ballot_order: number
  vote_count: number
  /** Vote method breakdowns (Election Day, Advance, Absentee, etc.) */
  group_results: VoteMethodResult[]
}
```

### Vote Method Result

```typescript
/** Votes for a candidate broken down by voting method */
export interface VoteMethodResult {
  group_name: string                  // e.g., "Election Day", "Advance Voting", "Absentee by Mail", "Provisional"
  vote_count: number
}
```

### County Result

```typescript
/** Election results aggregated at the county level for a specific race */
export interface CountyResult {
  county_name: string
  county_name_normalized: string      // Lowercase, no spaces (for matching GeoJSON)
  precincts_participating: number
  precincts_reporting: number
  candidates: CandidateResult[]
}
```

### Election Results Response (API Response)

```typescript
/** Full results response for a single election/race */
export interface ElectionResultsResponse {
  election_id: string
  /** Race-wide (statewide) candidate results */
  candidates: CandidateResult[]
  /** Per-county breakdown */
  county_results: CountyResult[]
  /** Total precincts across all counties */
  total_precincts_participating: number
  total_precincts_reporting: number
}
```

### Paginated Elections List (API Response)

```typescript
/** Paginated list response from GET /elections */
export interface PaginatedElectionListResponse {
  elections: Election[]
  total: number
  page: number
  page_size: number
  total_pages: number
}
```

### Election Detail (API Response)

```typescript
/** Detail response from GET /elections/{id} — same shape as Election */
export type ElectionDetailResponse = Election
```

### Admin: Create/Update Requests

```typescript
/** Request body for POST /elections (create) */
export interface CreateElectionRequest {
  name: string
  election_date: string               // ISO date
  election_type: ElectionType
  district: string
  data_source_url: string
  refresh_interval_seconds?: number   // Optional, defaults to 120, min 60
}

/** Request body for PATCH /elections/{id} (update) — all fields optional */
export interface UpdateElectionRequest {
  name?: string
  data_source_url?: string
  status?: ElectionStatus
  refresh_interval_seconds?: number
}

/** Response from POST /elections/{id}/refresh */
export interface RefreshResponse {
  election_id: string
  refreshed_at: string
  counties_updated: number
  precincts_reporting: number
  precincts_participating: number
}
```

### Admin Form Values

```typescript
/** Form values for election creation (React Hook Form) */
export interface ElectionFormValues {
  name: string
  election_date: string
  election_type: ElectionType
  district: string
  data_source_url: string
  refresh_interval_seconds: number
}
```

### GeoJSON Types

```typescript
import type { FeatureCollection, Feature, Polygon, MultiPolygon } from "geojson"

/** Properties on county result GeoJSON features */
export interface CountyResultGeoProperties {
  county_name: string
  precincts_participating: number
  precincts_reporting: number
  /** Leading candidate info for choropleth coloring */
  leading_candidate_name: string
  leading_candidate_party: string
  leading_candidate_votes: number
  total_votes: number
  /** Per-candidate results embedded in feature properties */
  candidates: CandidateResult[]
}

/** County-level election results GeoJSON */
export type CountyResultFeatureCollection = FeatureCollection<
  Polygon | MultiPolygon,
  CountyResultGeoProperties
>

/** Properties on precinct result GeoJSON features */
export interface PrecinctResultGeoProperties {
  precinct_id: string
  precinct_name: string
  county_name: string
  is_reported: boolean
  candidates: CandidateResult[]
  total_votes: number
}

/** Precinct-level election results GeoJSON */
export type PrecinctResultFeatureCollection = FeatureCollection<
  Polygon | MultiPolygon,
  PrecinctResultGeoProperties
>
```

### Filter and UI State Types

```typescript
/** Map data layer options for the choropleth */
export type MapDataLayer = "leading_candidate" | "precincts_reporting" | "total_votes"

/** Race category for filtering the race list */
export type RaceCategory = "federal" | "state_senate" | "state_house" | "local" | "all"

/** Elections list filter state */
export interface ElectionFilters {
  status: ElectionStatus | "all"
  election_type: ElectionType | "all"
  date_from: string | null
  date_to: string | null
}

/** Race list filter state (within an election event) */
export interface RaceFilters {
  search: string
  category: RaceCategory
}
```

### Utility Types

```typescript
/** Party color mapping for choropleth and result bars */
export const PARTY_COLORS: Record<string, { fill: string; border: string }> = {
  Dem: { fill: "#2563eb", border: "#1d4ed8" },   // Blue
  Rep: { fill: "#dc2626", border: "#b91c1c" },   // Red
  Lib: { fill: "#eab308", border: "#ca8a04" },    // Gold
  Grn: { fill: "#16a34a", border: "#15803d" },    // Green
  Ind: { fill: "#6b7280", border: "#4b5563" },    // Gray
}

/** Default color for unknown parties */
export const DEFAULT_PARTY_COLOR = { fill: "#9ca3af", border: "#6b7280" }

/** Get party color with fallback */
export function getPartyColor(party: string): { fill: string; border: string } {
  return PARTY_COLORS[party] ?? DEFAULT_PARTY_COLOR
}

/** Calculate vote percentage for a candidate */
export function getVotePercentage(candidateVotes: number, totalVotes: number): number {
  if (totalVotes === 0) return 0
  return (candidateVotes / totalVotes) * 100
}

/** Calculate reporting percentage for a county or race */
export function getReportingPercentage(reporting: number, participating: number): number {
  if (participating === 0) return 0
  return (reporting / participating) * 100
}

/** Determine if an election is actively polling */
export function isActiveElection(election: Election): boolean {
  return election.status === "active"
}

/** Get certification label from election status */
export function getCertificationLabel(status: ElectionStatus): string {
  return status === "active" ? "Unofficial Results" : "Official Results"
}

/** Categorize a race by its district name for filtering */
export function categorizeRace(district: string): RaceCategory {
  const lower = district.toLowerCase()
  if (lower.includes("us ") || lower.includes("u.s.") || lower.includes("president")) return "federal"
  if (lower.includes("state senate") || lower.includes("senate district")) return "state_senate"
  if (lower.includes("state house") || lower.includes("house district")) return "state_house"
  return "local"
}
```

## Validation Rules

| Field | Rule | Enforcement |
| ----- | ---- | ----------- |
| `election_date` | Valid ISO date string | Zod schema in form |
| `election_type` | One of: general, primary, special, runoff | Zod enum |
| `data_source_url` | Valid URL format | Zod `.url()` |
| `refresh_interval_seconds` | Integer, minimum 60 | Zod `.int().min(60)` |
| `name` | Non-empty, max 500 chars | Zod `.min(1).max(500)` |
| `district` | Non-empty, max 200 chars | Zod `.min(1).max(200)` |

## State Transitions

```text
Election Status Lifecycle:

  [created] → active → finalized
                 ↑         |
                 └─────────┘  (can revert to active if admin re-opens)

  active:     Auto-refresh enabled, "Unofficial Results" badge
  finalized:  Auto-refresh disabled, "Official Results" badge
```
