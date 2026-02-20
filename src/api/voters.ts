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

/** Address sub-object returned by the backend for voter detail */
interface AddressResponse {
  street_number: string | null
  pre_direction: string | null
  street_name: string | null
  street_type: string | null
  post_direction: string | null
  apt_unit_number: string | null
  city: string | null
  zipcode: string | null
  full_address: string
}

/** Raw voter detail shape returned by GET /voters/{id} */
interface RawVoterDetail {
  id: string
  voter_registration_number: string
  first_name: string
  middle_name: string | null
  last_name: string
  suffix?: string | null
  status: string
  registration_date: string | null
  county: string
  residence_address: AddressResponse
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
  const raw = await api.get(`voters/${voterId}`).json<RawVoterDetail>()
  const addr = raw.residence_address
  return {
    id: raw.id,
    voter_id: raw.voter_registration_number,
    first_name: raw.first_name,
    middle_name: raw.middle_name ?? null,
    last_name: raw.last_name,
    suffix: raw.suffix ?? null,
    county: raw.county,
    status: raw.status,
    registration_date: raw.registration_date ?? "",
    address_line_1: addr.full_address,
    address_line_2: addr.apt_unit_number ?? null,
    city: addr.city ?? "",
    state: "",
    zip_code: addr.zipcode ?? "",
  }
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
