import { api } from "@/api/client"
import type {
  VoterSummary,
  VoterSearchResponse,
  VoterDetail,
  VoterFilterOptions,
  VoterSearchParams,
} from "@/types/voter"
import type { VoterGeocodedLocation } from "@/types/lookup"

/** Raw paginated response shape returned by the backend */
interface RawVoterSearchResponse {
  items: VoterSummary[]
  pagination: {
    total: number
    page: number
    page_size: number
    total_pages: number
  }
}

export async function searchVoters(
  params: VoterSearchParams,
): Promise<VoterSearchResponse> {
  const searchParams: Record<string, string> = {}
  if (params.q) searchParams.q = params.q
  if (params.county) searchParams.county = params.county
  if (params.status) searchParams.status = params.status
  if (params.district_type) searchParams.district_type = params.district_type
  if (params.district_id) searchParams.district_id = params.district_id
  if (params.sort_by) searchParams.sort_by = params.sort_by
  if (params.sort_order) searchParams.sort_order = params.sort_order
  if (params.page) searchParams.page = String(params.page)

  const raw = await api
    .get("voters", { searchParams })
    .json<RawVoterSearchResponse>()

  return {
    voters: raw.items,
    ...raw.pagination,
  }
}

export async function getVoterDetail(
  voterId: string,
): Promise<VoterDetail> {
  return api.get(`voters/${voterId}`).json<VoterDetail>()
}

export async function getVoterFilters(): Promise<VoterFilterOptions> {
  return api.get("voters/filters").json<VoterFilterOptions>()
}

export async function triggerVoterGeocode(
  voterId: string,
): Promise<VoterGeocodedLocation[]> {
  return api.post(`voters/${voterId}/geocode`).json<VoterGeocodedLocation[]>()
}

export async function deleteGeocodedLocation(
  voterId: string,
  locationId: string,
): Promise<void> {
  await api.delete(`voters/${voterId}/geocoded-locations/${locationId}`)
}
