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

/** An election record from the API — represents a single race/contest.
 *  The list endpoint returns a subset of fields; detail-only fields are optional. */
export interface Election {
  id: string
  name: string
  election_date: string
  election_type: ElectionType
  district: string
  status: ElectionStatus
  last_refreshed_at: string | null
  /** SOS ballot item ID for multi-race feeds; null for single-race elections */
  ballot_item_id?: string | null
  /** Only present on list endpoint */
  precincts_reporting?: number | null
  /** Only present on list endpoint */
  precincts_participating?: number | null
  /** Only present on detail endpoint */
  data_source_url?: string
  /** Only present on detail endpoint */
  refresh_interval_seconds?: number
  /** Only present on detail endpoint */
  created_at?: string
  /** Only present on detail endpoint */
  updated_at?: string

  // Election metadata fields (all nullable)
  description?: string | null
  purpose?: string | null
  eligibility_description?: string | null
  registration_deadline?: string | null
  early_voting_start?: string | null
  early_voting_end?: string | null
  absentee_request_deadline?: string | null
  qualifying_start?: string | null
  qualifying_end?: string | null
  /** Source of this election record — set server-side at creation time */
  source?: "sos_feed" | "manual" | null
  /** UUID of the geographic boundary linked to this election (manual elections only) */
  boundary_id?: string | null
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
  ballot_order?: number
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
  precincts_participating: number | null
  precincts_reporting: number | null
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
  data_source_url?: string
  refresh_interval_seconds?: number
  ballot_item_id?: string | null
  boundary_id?: string
}

/** Request body for PATCH /elections/{id} (update) — all fields optional */
export interface UpdateElectionRequest {
  name?: string
  data_source_url?: string
  status?: ElectionStatus
  refresh_interval_seconds?: number
  ballot_item_id?: string | null
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
  data_source_url?: string
  refresh_interval_seconds: number
  boundary_id?: string
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
  reporting_status: string
  candidates: CandidateResult[]
  /** Whether this feature has matched election result data (set by client-side merge) */
  has_results?: boolean
}

/** Precinct-level election results GeoJSON */
export type PrecinctResultFeatureCollection = FeatureCollection<
  Polygon | MultiPolygon,
  PrecinctResultGeoProperties
>

// ============================================================================
// Filter and UI State Types
// ============================================================================

/** Race category for filtering the race list */
export type RaceCategory = "federal" | "state_senate" | "state_house" | "local" | "all"

/** Elections list filter state */
export interface ElectionFilters {
  status: ElectionStatus | "all"
  election_type: ElectionType | "all"
  date_from: string | null
  date_to: string | null
  registration_open?: boolean
  early_voting_active?: boolean
  search?: string
  /** Server-side text search query */
  q?: string
  /** Race category filter (e.g., federal, state_senate, state_house, local) */
  race_category?: string
  /** County filter */
  county?: string
  /** Exact election date filter (ISO date string) */
  election_date?: string
}

/** Response from GET /elections/filter-options */
export interface FilterOptionsResponse {
  race_categories: string[]
  counties: string[]
  election_dates: string[]
}

/** Race list filter state (within an election event) */
export interface RaceFilters {
  search: string
  category: RaceCategory
}

/** API capabilities response from GET /elections/capabilities */
export interface CapabilitiesResponse {
  supported_filters: string[]
  endpoints: {
    filter_options: boolean
  }
}

/** Feature flags derived from API capabilities */
export interface ElectionFeatureFlags {
  /** Server-side text search via `q` param */
  search: boolean
  /** Race category filter via `race_category` param */
  raceCategory: boolean
  /** Geographic filters via `county` and/or `district` params */
  geographic: boolean
  /** Election date exact filter via `election_date` param */
  electionDate: boolean
  /** Filter options endpoint availability */
  filterOptions: boolean
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
  Ind: { fill: "#7c3aed", border: "#6d28d9" },
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

/** Resolve race-wide precinct counts, falling back to county_results sum when top-level values are null */
export function resolvePrecinctCounts(
  results: ElectionResultsResponse,
): { participating: number; reporting: number } {
  return {
    participating:
      results.precincts_participating ??
      results.county_results.reduce((sum, c) => sum + c.precincts_participating, 0),
    reporting:
      results.precincts_reporting ??
      results.county_results.reduce((sum, c) => sum + c.precincts_reporting, 0),
  }
}

/** Calculate reporting percentage for a county or race */
export function getReportingPercentage(
  reporting: number | null | undefined,
  participating: number | null | undefined,
): number {
  if (participating == null || participating === 0) return 0
  return ((reporting ?? 0) / participating) * 100
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

/** County color palette for participation breakdown charts (index-based, wraps around) */
export const COUNTY_COLORS = [
  "#2563eb", // blue
  "#dc2626", // red
  "#16a34a", // green
  "#eab308", // amber
  "#7c3aed", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#8b5cf6", // purple
  "#14b8a6", // teal
]

/** Get a distinct color for a county by index */
export function getCountyColor(index: number): string {
  return COUNTY_COLORS[index % COUNTY_COLORS.length]
}

/** Precinct reporting statuses that indicate results are available */
const REPORTED_STATUSES = new Set([
  "Reported",
  "Fully Reported",
  "Partially Reported",
  "Election Night Complete",
])

/** Check whether a precinct reporting status indicates results are available */
export function isReported(status: string): boolean {
  return REPORTED_STATUSES.has(status)
}

/** Synthesize a description for an election, preferring the API purpose field */
export function synthesizeDescription(election: Election): string {
  if (election.purpose) return election.purpose
  const type = election.election_type.charAt(0).toUpperCase() + election.election_type.slice(1)
  return `${type} — ${election.district}`
}

// ============================================================================
// Feed Import Types
// ============================================================================

/** Request body for POST /elections/import-feed/preview and /elections/import-feed */
export interface FeedImportRequest {
  data_source_url: string
  election_type: ElectionType
  refresh_interval_seconds?: number
  auto_refresh?: boolean
}

/** A race summary returned from feed preview */
export interface FeedRaceSummary {
  ballot_item_id: string
  name: string
  candidate_count: number
  statewide_precincts_participating: number | null
  statewide_precincts_reporting: number | null
}

/** Response from POST /elections/import-feed/preview */
export interface FeedImportPreviewResponse {
  data_source_url: string
  election_date: string
  election_name: string
  total_races: number
  races: FeedRaceSummary[]
}

/** An election created by the feed import */
export interface FeedImportedElection {
  election_id: string
  ballot_item_id: string
  name: string
  election_date: string
  refreshed: boolean
  precincts_reporting: number | null
  precincts_participating: number | null
}

/** Response from POST /elections/import-feed */
export interface FeedImportResponse {
  elections_created: number
  elections_skipped: number
  elections: FeedImportedElection[]
}

// ============================================================================
// Participation Types
// ============================================================================

export interface CountyBreakdownItem {
  county: string
  count: number
  percentage: number
}

export interface MethodBreakdownItem {
  method: string
  count: number
  percentage: number
}

export interface PrecinctBreakdownItem {
  precinct: string
  precinct_name?: string
  count: number
  percentage: number
}

export interface ParticipationStats {
  election_id: string
  total_voted: number
  is_preliminary: boolean
  county_breakdown: CountyBreakdownItem[]
  method_breakdown: MethodBreakdownItem[]
  precinct_breakdown?: PrecinctBreakdownItem[]
}

export interface ElectionParticipant {
  id: string
  voter_id: string | null
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

/** URL search params for the participant list */
export interface ParticipantUrlParams {
  p_q?: string
  p_county?: string
  p_voter_status?: string
  p_mismatch?: "true" | "false"
  p_precinct?: string
  p_ballot_style?: string
  p_congressional?: string
  p_senate?: string
  p_house?: string
  p_page?: number
}

/** Filter params forwarded to the API for the participant list */
export interface ParticipantFilterParams {
  q?: string
  county?: string
  voter_status?: string
  has_district_mismatch?: "true" | "false"
  county_precinct?: string
  ballot_style?: string
  congressional_district?: string
  state_senate_district?: string
  state_house_district?: string
  page?: number
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
