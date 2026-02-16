export type OfficialStatus = "auto" | "approved" | "manual"

export interface ElectedOfficialSummaryResponse {
  id: string
  boundary_type: string
  district_identifier: string
  full_name: string
  party: string | null
  title: string | null
  photo_url: string | null
  status: OfficialStatus
  created_at: string
}

export interface ElectedOfficialSourceResponse {
  id: string
  source_name: string
  source_record_id: string
  boundary_type: string
  district_identifier: string
  full_name: string
  first_name: string | null
  last_name: string | null
  party: string | null
  title: string | null
  photo_url: string | null
  term_start_date: string | null
  term_end_date: string | null
  website: string | null
  email: string | null
  phone: string | null
  office_address: string | null
  fetched_at: string
  is_current: boolean
  created_at: string
}

export interface ElectedOfficialDetailResponse {
  id: string
  full_name: string
  first_name: string | null
  last_name: string | null
  party: string | null
  title: string | null
  photo_url: string | null
  boundary_type: string
  district_identifier: string
  term_start_date: string | null
  term_end_date: string | null
  last_election_date: string | null
  next_election_date: string | null
  website: string | null
  email: string | null
  phone: string | null
  office_address: string | null
  external_ids: Record<string, string> | null
  status: OfficialStatus
  approved_by_id: string | null
  approved_at: string | null
  sources: ElectedOfficialSourceResponse[]
  created_at: string
  updated_at: string
}

export interface PaginationMeta {
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface PaginatedElectedOfficialResponse {
  items: ElectedOfficialSummaryResponse[]
  pagination: PaginationMeta
}
