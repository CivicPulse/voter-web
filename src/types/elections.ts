/**
 * Election results feature type definitions
 *
 * Maps to the voter-api backend responses with frontend-only constructs
 * for election event grouping. The backend models each race/contest as a
 * separate Election record; the frontend groups by election_date.
 *
 * @module types/elections
 */

import type { FeatureCollection, Polygon, MultiPolygon } from "geojson"

// ============================================================================
// Core Entity Types
// ============================================================================

/** Election types as defined by the backend */
export type ElectionType = "general" | "primary" | "special" | "runoff"

/** Election lifecycle status */
export type ElectionStatus = "active" | "finalized"

/** An election record from the API — represents a single race/contest */
export interface Election {
  id: string
  name: string
  election_date: string
  election_type: ElectionType
  district: string
  data_source_url: string
  status: ElectionStatus
  last_refreshed_at: string | null
  refresh_interval_seconds: number
  created_at: string
  updated_at: string
}

/**
 * Frontend construct grouping multiple API Elections (races) by shared date.
 * Not an API entity — computed client-side from the elections list.
 */
export interface ElectionEvent {
  date: string
  types: ElectionType[]
  races: Election[]
  raceCount: number
  hasActiveRaces: boolean
}

// ============================================================================
// Result Types
// ============================================================================

/** A candidate's result within a specific election/race */
export interface CandidateResult {
  id: string
  name: string
  political_party: string
  ballot_order: number
  vote_count: number
  group_results: VoteMethodResult[]
}

/** Votes for a candidate broken down by voting method */
export interface VoteMethodResult {
  group_name: string
  vote_count: number
}

/** Election results aggregated at the county level for a specific race */
export interface CountyResult {
  county_name: string
  county_name_normalized: string
  precincts_participating: number
  precincts_reporting: number
  candidates: CandidateResult[]
}

/** Full results response for a single election/race */
export interface ElectionResultsResponse {
  election_id: string
  candidates: CandidateResult[]
  county_results: CountyResult[]
  total_precincts_participating: number
  total_precincts_reporting: number
}

// ============================================================================
// API Response Types
// ============================================================================

/** Paginated list response from GET /elections */
export interface PaginatedElectionListResponse {
  elections: Election[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

/** Detail response from GET /elections/{id} — same shape as Election */
export type ElectionDetailResponse = Election

// ============================================================================
// Admin Request/Response Types
// ============================================================================

/** Request body for POST /elections (create) */
export interface CreateElectionRequest {
  name: string
  election_date: string
  election_type: ElectionType
  district: string
  data_source_url: string
  refresh_interval_seconds?: number
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

/** Form values for election creation (React Hook Form) */
export interface ElectionFormValues {
  name: string
  election_date: string
  election_type: ElectionType
  district: string
  data_source_url: string
  refresh_interval_seconds: number
}

// ============================================================================
// GeoJSON Types
// ============================================================================

/** Properties on county result GeoJSON features */
export interface CountyResultGeoProperties {
  county_name: string
  precincts_participating: number
  precincts_reporting: number
  leading_candidate_name: string
  leading_candidate_party: string
  leading_candidate_votes: number
  total_votes: number
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

// ============================================================================
// Filter and UI State Types
// ============================================================================

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

// ============================================================================
// Constants and Utility Functions
// ============================================================================

/** Party color mapping for choropleth and result bars */
export const PARTY_COLORS: Record<string, { fill: string; border: string }> = {
  Dem: { fill: "#2563eb", border: "#1d4ed8" },
  Rep: { fill: "#dc2626", border: "#b91c1c" },
  Lib: { fill: "#eab308", border: "#ca8a04" },
  Grn: { fill: "#16a34a", border: "#15803d" },
  Ind: { fill: "#6b7280", border: "#4b5563" },
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

/**
 * Categorize a race by its district name for filtering.
 * Heuristic-based: matches common Georgia district naming conventions.
 * Edge cases (Commissioner, Board of Education, Public Service Commission)
 * fall through to "local" as the catch-all category.
 */
export function categorizeRace(district: string): RaceCategory {
  const lower = district.toLowerCase()
  if (lower.includes("us ") || lower.includes("u.s.") || lower.includes("president")) return "federal"
  if (lower.includes("state senate") || lower.includes("senate district")) return "state_senate"
  if (lower.includes("state house") || lower.includes("house district")) return "state_house"
  return "local"
}

/** Get total votes across all candidates in a result set */
export function getTotalVotes(candidates: CandidateResult[]): number {
  return candidates.reduce((sum, c) => sum + c.vote_count, 0)
}

/** Find leading candidate from a results array */
export function getLeadingCandidate(candidates: CandidateResult[]): CandidateResult | null {
  if (candidates.length === 0) return null
  return candidates.reduce((leader, c) => (c.vote_count > leader.vote_count ? c : leader))
}

/** Group an array of elections by election_date into ElectionEvents */
export function groupElectionsByDate(elections: Election[]): ElectionEvent[] {
  const grouped = new Map<string, Election[]>()

  for (const election of elections) {
    const existing = grouped.get(election.election_date)
    if (existing) {
      existing.push(election)
    } else {
      grouped.set(election.election_date, [election])
    }
  }

  return Array.from(grouped.entries())
    .map(([date, races]) => ({
      date,
      types: [...new Set(races.map((r) => r.election_type))],
      races,
      raceCount: races.length,
      hasActiveRaces: races.some((r) => r.status === "active"),
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
}
