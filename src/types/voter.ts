export interface VoterSummary {
  id: string
  first_name: string
  last_name: string
  county: string
  voter_id: string
  registration_date: string | null
  status: string
}

export interface VoterDetail {
  id: string
  first_name: string
  middle_name: string | null
  last_name: string
  suffix: string | null
  voter_id: string
  county: string
  status: string
  registration_date: string
  address_line_1: string
  address_line_2: string | null
  city: string
  state: string
  zip_code: string
  congressional_district: string | null
  state_senate_district: string | null
  state_house_district: string | null
  county_precinct: string | null
  precinct: string | null
}

export interface VoterSearchResponse {
  voters: VoterSummary[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface VoterFilterOptions {
  counties: string[]
  statuses: string[]
  congressional_districts: string[]
  state_senate_districts: string[]
  state_house_districts: string[]
  residence_cities: string[]
  residence_zipcodes: string[]
}

export interface VoterSearchParams {
  q?: string
  county?: string
  status?: string
  congressional_district?: string
  state_senate_district?: string
  state_house_district?: string
  sort_by?: "name" | "county" | "registration_date" | "voter_id"
  sort_order?: "asc" | "desc"
  page?: number
}
