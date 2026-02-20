import { api } from "@/api/client"
import type {
  VoterSummary,
  VoterSearchResponse,
  VoterDetail,
  VoterFilterOptions,
  VoterSearchParams,
} from "@/types/voter"

/** Raw summary item returned by GET /voters (search results) */
interface RawVoterSummary {
  id: string
  voter_registration_number: string
  first_name: string
  last_name: string
  county: string
  status: string
  registration_date?: string | null
}

/** Raw paginated response shape returned by the backend */
interface RawVoterSearchResponse {
  items: RawVoterSummary[]
  pages: number
  total: number
  page: number
  page_size: number
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

/** Registered districts sub-object returned by the backend */
interface RegisteredDistrictsResponse {
  county_precinct: string | null
  county_precinct_description: string | null
  municipal_precinct: string | null
  municipal_precinct_description: string | null
  congressional_district: string | null
  state_senate_district: string | null
  state_house_district: string | null
  judicial_district: string | null
  county_commission_district: string | null
  school_board_district: string | null
  city_council_district: string | null
  municipal_school_board_district: string | null
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
  registered_districts?: RegisteredDistrictsResponse | null
}

export async function searchVoters(
  params: VoterSearchParams,
): Promise<VoterSearchResponse> {
  const searchParams: Record<string, string> = {}
  if (params.q) searchParams.q = params.q
  if (params.county) searchParams.county = params.county
  if (params.status) searchParams.status = params.status
  if (params.congressional_district)
    searchParams.congressional_district = params.congressional_district
  if (params.state_senate_district)
    searchParams.state_senate_district = params.state_senate_district
  if (params.state_house_district)
    searchParams.state_house_district = params.state_house_district
  if (params.sort_by) searchParams.sort_by = params.sort_by
  if (params.sort_order) searchParams.sort_order = params.sort_order
  if (params.page) searchParams.page = String(params.page)

  const raw = await api
    .get("voters", { searchParams })
    .json<RawVoterSearchResponse>()

  return {
    voters: raw.items.map(
      (item): VoterSummary => ({
        id: item.id,
        voter_id: item.voter_registration_number,
        first_name: item.first_name,
        last_name: item.last_name,
        county: item.county,
        status: item.status,
        registration_date: item.registration_date ?? null,
      }),
    ),
    total: raw.total,
    page: raw.page,
    page_size: raw.page_size,
    total_pages: raw.pages,
  }
}

export async function getVoterDetail(
  voterId: string,
): Promise<VoterDetail> {
  const raw = await api.get(`voters/${voterId}`).json<RawVoterDetail>()
  const addr = raw.residence_address
  const dist = raw.registered_districts
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
    congressional_district: dist?.congressional_district ?? null,
    state_senate_district: dist?.state_senate_district ?? null,
    state_house_district: dist?.state_house_district ?? null,
    county_precinct: dist?.county_precinct ?? null,
    county_precinct_description: dist?.county_precinct_description ?? null,
    municipal_precinct: dist?.municipal_precinct ?? null,
    municipal_precinct_description:
      dist?.municipal_precinct_description ?? null,
    judicial_district: dist?.judicial_district ?? null,
    county_commission_district: dist?.county_commission_district ?? null,
    school_board_district: dist?.school_board_district ?? null,
    city_council_district: dist?.city_council_district ?? null,
    municipal_school_board_district:
      dist?.municipal_school_board_district ?? null,
  }
}

export async function getVoterFilters(): Promise<VoterFilterOptions> {
  return api.get("voters/filters").json<VoterFilterOptions>()
}

export async function triggerVoterGeocode(voterId: string): Promise<void> {
  await api.post(`geocoding/voter/${voterId}/geocode-all`)
}

export async function deleteGeocodedLocation(
  voterId: string,
  locationId: string,
): Promise<void> {
  await api.delete(`voters/${voterId}/geocoded-locations/${locationId}`)
}
