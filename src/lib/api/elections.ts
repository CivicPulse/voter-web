import { api } from "@/api/client"
import type {
  PaginatedElectionListResponse,
  ElectionDetailResponse,
  ElectionResultsResponse,
  CountyResultFeatureCollection,
  PrecinctResultFeatureCollection,
  CreateElectionRequest,
  UpdateElectionRequest,
  RefreshResponse,
  ElectionFilters,
} from "@/types/elections"

// ============================================================================
// Public Endpoints (No Authentication Required)
// ============================================================================

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

  return api
    .get("elections", { searchParams })
    .json<PaginatedElectionListResponse>()
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
    searchParams.county = county
  }

  return api
    .get(`elections/${electionId}/results/geojson/precincts`, { searchParams })
    .json<PrecinctResultFeatureCollection>()
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
