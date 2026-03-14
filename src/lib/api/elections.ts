import { api, publicApi } from "@/api/client"
import { stripCountySuffix } from "@/lib/utils"
import type {
  Election,
  PaginatedElectionListResponse,
  ElectionDetailResponse,
  ElectionResultsResponse,
  CountyResultFeatureCollection,
  PrecinctResultFeatureCollection,
  CreateElectionRequest,
  UpdateElectionRequest,
  RefreshResponse,
  ElectionFilters,
  FilterOptionsResponse,
  CapabilitiesResponse,
  FeedImportRequest,
  FeedImportPreviewResponse,
  FeedImportResponse,
} from "@/types/elections"

// ============================================================================
// Public Endpoints (No Authentication Required)
// ============================================================================

/** Fetch election API capabilities (which filters are supported) */
export async function getElectionCapabilities(): Promise<CapabilitiesResponse> {
  return publicApi
    .get("elections/capabilities")
    .json<CapabilitiesResponse>()
}

/** Fetch available filter options scoped to current filter state */
export async function getFilterOptions(
  filters?: Partial<ElectionFilters>,
): Promise<FilterOptionsResponse> {
  const searchParams: Record<string, string> = {}
  if (filters?.status && filters.status !== "all") searchParams.status = filters.status
  if (filters?.election_type && filters.election_type !== "all") searchParams.election_type = filters.election_type
  if (filters?.date_from) searchParams.date_from = filters.date_from
  if (filters?.date_to) searchParams.date_to = filters.date_to
  if (filters?.q) searchParams.q = filters.q
  if (filters?.race_category) searchParams.race_category = filters.race_category
  if (filters?.county) searchParams.county = filters.county
  return publicApi
    .get("elections/filter-options", { searchParams })
    .json<FilterOptionsResponse>()
}

/** Raw API response shape from GET /elections */
interface RawElectionListResponse {
  items: Election[]
  pagination: {
    total: number
    page: number
    page_size: number
    total_pages: number
  }
}

/** List elections with optional filters and pagination */
export async function getElections(
  params?: Partial<ElectionFilters> & { page?: number; page_size?: number },
): Promise<PaginatedElectionListResponse> {
  const searchParams: Record<string, string> = {}

  if (params?.status && params.status !== "all") {
    searchParams.status = params.status
  }
  if (params?.election_type && params.election_type !== "all") {
    searchParams.election_type = params.election_type
  }
  if (params?.date_from) {
    searchParams.date_from = params.date_from
  }
  if (params?.date_to) {
    searchParams.date_to = params.date_to
  }
  if (params?.page) {
    searchParams.page = String(params.page)
  }
  if (params?.page_size) {
    searchParams.page_size = String(params.page_size)
  }
  if (params?.registration_open) {
    searchParams.registration_open = "true"
  }
  if (params?.early_voting_active) {
    searchParams.early_voting_active = "true"
  }
  if (params?.q) {
    searchParams.q = params.q
  }
  if (params?.race_category) {
    searchParams.race_category = params.race_category
  }
  if (params?.county) {
    searchParams.county = params.county
  }
  if (params?.election_date) {
    searchParams.election_date = params.election_date
  }

  const raw = await api
    .get("elections", { searchParams })
    .json<RawElectionListResponse>()

  return {
    elections: raw.items,
    ...raw.pagination,
  }
}

/** Get a single election's detail */
export async function getElectionDetail(
  electionId: string,
): Promise<ElectionDetailResponse> {
  return api.get(`elections/${electionId}`).json<ElectionDetailResponse>()
}

/** Get election results (JSON) */
export async function getElectionResults(
  electionId: string,
): Promise<ElectionResultsResponse> {
  return api
    .get(`elections/${electionId}/results`)
    .json<ElectionResultsResponse>()
}

/** Get county-level GeoJSON for choropleth map */
export async function getElectionGeoJSON(
  electionId: string,
): Promise<CountyResultFeatureCollection> {
  return api
    .get(`elections/${electionId}/results/geojson`)
    .json<CountyResultFeatureCollection>()
}

/** Get precinct-level GeoJSON with optional county filter */
export async function getPrecinctGeoJSON(
  electionId: string,
  county?: string,
): Promise<PrecinctResultFeatureCollection> {
  const searchParams: Record<string, string> = {}
  if (county) {
    // API expects bare county name (e.g. "Houston") without " County" suffix
    searchParams.county = stripCountySuffix(county)
  }

  return api
    .get(`elections/${electionId}/results/geojson/precincts`, { searchParams })
    .json<PrecinctResultFeatureCollection>()
}

// ============================================================================
// Participation Endpoints
// ============================================================================

/** Raw backend shape for GET /elections/{id}/participation/stats */
interface RawParticipationStats {
  election_id: string
  total_participants: number
  by_county: { county: string; count: number }[]
  by_ballot_style: { ballot_style: string; count: number }[]
  by_precinct?: { precinct: string; precinct_name?: string; count: number }[]
}

/** Get aggregate participation statistics for an election */
export async function getParticipationStats(
  electionId: string,
): Promise<import("@/types/elections").ParticipationStats> {
  const raw = await publicApi
    .get(`elections/${electionId}/participation/stats`)
    .json<RawParticipationStats>()

  const total = raw.total_participants

  // Map by_county → county_breakdown
  const countyBreakdown = raw.by_county.map((c) => ({
    county: c.county,
    count: c.count,
    percentage: total > 0 ? (c.count / total) * 100 : 0,
  }))

  // Map by_ballot_style → method_breakdown
  const methodBreakdown = raw.by_ballot_style.map((b) => ({
    method: b.ballot_style,
    count: b.count,
    percentage: total > 0 ? (b.count / total) * 100 : 0,
  }))

  // Map by_precinct → precinct_breakdown (when backend provides it)
  const precinctBreakdown = raw.by_precinct?.map((p) => ({
    precinct: p.precinct,
    ...(p.precinct_name && { precinct_name: p.precinct_name }),
    count: p.count,
    percentage: total > 0 ? (p.count / total) * 100 : 0,
  }))

  return {
    election_id: raw.election_id,
    total_voted: total,
    is_preliminary: true,
    county_breakdown: countyBreakdown,
    method_breakdown: methodBreakdown,
    ...(precinctBreakdown && precinctBreakdown.length > 0 && { precinct_breakdown: precinctBreakdown }),
  }
}

/** Raw backend shape for election participation records */
interface RawElectionParticipant {
  id: string
  voter_id: string | null
  voter_registration_number: string
  first_name?: string | null
  last_name?: string | null
  county: string
  election_date: string
  election_type: string
  normalized_election_type: string
  party: string | null
  ballot_style: string | null
  early_voting: boolean
  absentee: boolean
  provisional: boolean
  supplemental: boolean
}

/** Get paginated list of voters who participated in an election */
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
): Promise<import("@/types/elections").ElectionParticipantsResponse> {
  const searchParams: Record<string, string> = {}
  if (params?.page) searchParams.page = String(params.page)
  if (params?.page_size) searchParams.page_size = String(params.page_size)
  if (params?.q) searchParams.q = params.q
  if (params?.county) searchParams.county = params.county
  if (params?.voter_status) searchParams.voter_status = params.voter_status
  if (params?.has_district_mismatch !== undefined) searchParams.has_district_mismatch = String(params.has_district_mismatch)
  if (params?.county_precinct) searchParams.county_precinct = params.county_precinct
  if (params?.ballot_style) searchParams.ballot_style = params.ballot_style
  if (params?.congressional_district) searchParams.congressional_district = params.congressional_district
  if (params?.state_senate_district) searchParams.state_senate_district = params.state_senate_district
  if (params?.state_house_district) searchParams.state_house_district = params.state_house_district

  const raw = await api
    .get(`elections/${electionId}/participation`, { searchParams })
    .json<{
      items: RawElectionParticipant[]
      pagination: { total: number; page: number; page_size: number; total_pages: number }
    }>()

  return {
    items: raw.items.map((r) => {
      // Derive voting method from boolean flags
      let votingMethod = "In Person"
      if (r.absentee) votingMethod = "Absentee by Mail"
      else if (r.early_voting) votingMethod = "Early Voting"
      else if (r.provisional) votingMethod = "Provisional"
      else if (r.supplemental) votingMethod = "Supplemental"

      return {
        id: r.id,
        voter_id: r.voter_id,
        voter_registration_number: r.voter_registration_number,
        first_name: r.first_name ?? "",
        last_name: r.last_name ?? "",
        county: r.county,
        voting_method: votingMethod,
      }
    }),
    pagination: raw.pagination,
  }
}

// ============================================================================
// Admin Endpoints (Requires admin Role)
// ============================================================================

/** Create a new election */
export async function createElection(
  data: CreateElectionRequest,
): Promise<ElectionDetailResponse> {
  return api.post("elections", { json: data }).json<ElectionDetailResponse>()
}

/** Update an existing election */
export async function updateElection(
  electionId: string,
  data: UpdateElectionRequest,
): Promise<ElectionDetailResponse> {
  return api
    .patch(`elections/${electionId}`, { json: data })
    .json<ElectionDetailResponse>()
}

/** Manually trigger a data refresh for an election */
export async function refreshElection(
  electionId: string,
): Promise<RefreshResponse> {
  return api
    .post(`elections/${electionId}/refresh`)
    .json<RefreshResponse>()
}

/** Preview races available in an SOS feed URL */
export async function previewFeedImport(
  data: FeedImportRequest,
): Promise<FeedImportPreviewResponse> {
  return api
    .post("elections/import-feed/preview", { json: data })
    .json<FeedImportPreviewResponse>()
}

/** Import all races from an SOS feed URL as election records */
export async function importFeed(
  data: FeedImportRequest,
): Promise<FeedImportResponse> {
  return api
    .post("elections/import-feed", { json: data })
    .json<FeedImportResponse>()
}

/** Delete an election (admin only) */
export async function deleteElection(electionId: string): Promise<void> {
  await api.delete(`elections/${electionId}`)
}
