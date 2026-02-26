/**
 * Candidate type definitions for the Elections Discovery feature.
 *
 * @module types/candidates
 */

// ============================================================================
// Enumerations
// ============================================================================

export type FilingStatus = "qualified" | "withdrawn" | "disqualified" | "write_in"

export type CandidateLinkType =
  | "website"
  | "campaign"
  | "facebook"
  | "twitter"
  | "instagram"
  | "youtube"
  | "linkedin"
  | "other"

// ============================================================================
// Entity Types
// ============================================================================

export interface CandidateLink {
  id: string
  link_type: CandidateLinkType
  url: string
  label: string
}

export interface CandidateSummary {
  id: string
  election_id: string
  full_name: string
  party: string | null
  photo_url: string | null
  ballot_order: number | null
  filing_status: FilingStatus
  is_incumbent: boolean
  created_at: string
}

export interface CandidateDetail extends CandidateSummary {
  bio: string | null
  sos_ballot_option_id: string | null
  updated_at: string
  links: CandidateLink[]
  result_vote_count: number | null
  result_political_party: string | null
}

// ============================================================================
// API Response Types
// ============================================================================

export interface PaginatedCandidateListResponse {
  items: CandidateSummary[]
  pagination: {
    total: number
    page: number
    page_size: number
    total_pages: number
  }
}

// ============================================================================
// API Request Types
// ============================================================================

export interface CandidateListParams {
  status?: FilingStatus
  page?: number
  page_size?: number
}

export interface CreateCandidateLinkRequest {
  link_type: CandidateLinkType
  url: string
  label: string
}

export interface CreateCandidateRequest {
  full_name: string
  party?: string | null
  bio?: string | null
  photo_url?: string | null
  ballot_order?: number | null
  filing_status?: FilingStatus
  is_incumbent?: boolean
  sos_ballot_option_id?: string | null
  links?: CreateCandidateLinkRequest[]
}

export interface UpdateCandidateRequest {
  full_name?: string
  party?: string | null
  bio?: string | null
  photo_url?: string | null
  ballot_order?: number | null
  filing_status?: FilingStatus
  is_incumbent?: boolean
  sos_ballot_option_id?: string | null
}

// ============================================================================
// Utility Functions
// ============================================================================

/** Extract initials from a full name for Avatar fallback */
export function getCandidateInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 0 || parts[0] === "") return ""
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/** Sort candidates by ballot_order (nulls last), then alphabetically by full_name */
export function sortCandidates(candidates: CandidateSummary[]): CandidateSummary[] {
  return [...candidates].sort((a, b) => {
    if (a.ballot_order !== null && b.ballot_order !== null) {
      return a.ballot_order - b.ballot_order
    }
    if (a.ballot_order !== null) return -1
    if (b.ballot_order !== null) return 1
    return a.full_name.localeCompare(b.full_name)
  })
}
