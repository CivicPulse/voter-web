export interface VoterSummary {
  id: string
  first_name: string
  last_name: string
  county: string
  voter_id: string
  registration_date: string
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
  district_types: DistrictTypeOption[]
}

export interface DistrictTypeOption {
  type: string
  label: string
  districts: DistrictOption[]
}

export interface DistrictOption {
  id: string
  name: string
}

export interface VoterSearchParams {
  q?: string
  county?: string
  status?: string
  district_type?: string
  district_id?: string
  sort_by?: "name" | "county" | "registration_date" | "voter_id"
  sort_order?: "asc" | "desc"
  page?: number
}
