import { api } from "@/api/client"
import type {
  VoterSummary,
  VoterSearchResponse,
  VoterDetail,
  VoterFilterOptions,
  VoterSearchParams,
  RegisteredDistricts,
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
  // Flat pagination fields (legacy shape)
  pages?: number
  total?: number
  page?: number
  page_size?: number
  // Nested pagination (current backend shape)
  pagination?: {
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
  registered_districts?: RegisteredDistricts | null
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
  if (params.county_precinct)
    searchParams.county_precinct = params.county_precinct
  if (params.county_commission_district)
    searchParams.county_commission_district =
      params.county_commission_district
  if (params.school_board_district)
    searchParams.school_board_district = params.school_board_district
  if (params.sort_by) searchParams.sort_by = params.sort_by
  if (params.sort_order) searchParams.sort_order = params.sort_order
  if (params.page) searchParams.page = String(params.page)

  const raw = await api
    .get("voters", { searchParams })
    .json<RawVoterSearchResponse>()

  const pg = raw.pagination

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
    total: pg?.total ?? raw.total ?? 0,
    page: pg?.page ?? raw.page ?? 1,
    page_size: pg?.page_size ?? raw.page_size ?? 20,
    total_pages: pg?.total_pages ?? raw.pages ?? 1,
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

export interface VoterFilterParams {
  county?: string
  county_precinct?: string
  county_commission_district?: string
  school_board_district?: string
}

export async function getVoterFilters(params?: VoterFilterParams): Promise<VoterFilterOptions> {
  const searchParams: Record<string, string> = {}
  if (params?.county) searchParams.county = params.county
  if (params?.county_precinct) searchParams.county_precinct = params.county_precinct
  if (params?.county_commission_district) searchParams.county_commission_district = params.county_commission_district
  if (params?.school_board_district) searchParams.school_board_district = params.school_board_district
  return api.get("voters/filters", { searchParams }).json<VoterFilterOptions>()
}

/** Raw backend shape for voter history records */
interface RawVoterHistoryRecord {
  id: string
  election_id: string | null
  voter_registration_number: string
  county: string
  election_date: string
  election_type: string
  normalized_election_type: string | null
  party: string | null
  ballot_style: string | null
  early_voting: boolean
  absentee: boolean
  provisional: boolean
  supplemental: boolean
  created_at: string
}

function deriveVotingMethod(r: RawVoterHistoryRecord): string {
  if (r.absentee) return "Absentee by Mail"
  if (r.early_voting) return "Early Voting"
  if (r.provisional) return "Provisional"
  if (r.supplemental) return "Supplemental"
  return "In Person"
}

export async function getVoterHistory(
  voterRegistrationNumber: string,
): Promise<import("@/types/voter").VoterParticipationRecord[]> {
  const raw = await api
    .get(`voters/${voterRegistrationNumber}/history`)
    .json<{ items: RawVoterHistoryRecord[] } | RawVoterHistoryRecord[]>()

  const items = Array.isArray(raw) ? raw : raw.items

  return items.map((r) => ({
    election_id: r.election_id,
    election_name: `${r.election_date} ${r.election_type}`,
    election_date: r.election_date,
    election_type: (r.normalized_election_type || r.election_type) as import("@/types/elections").ElectionType,
    voting_method: deriveVotingMethod(r),
  }))
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
