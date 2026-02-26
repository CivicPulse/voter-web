import type {
  CandidateSummary,
  CandidateDetail,
  CandidateLink,
  PaginatedCandidateListResponse,
} from "@/types/candidates"

export function mockCandidateLink(
  overrides?: Partial<CandidateLink>,
): CandidateLink {
  return {
    id: "link-001",
    link_type: "campaign",
    url: "https://cookeforsenate.com",
    label: "Campaign Site",
    ...overrides,
  }
}

export function mockCandidateSummary(
  overrides?: Partial<CandidateSummary>,
): CandidateSummary {
  return {
    id: "cand-uuid-001",
    election_id: "550e8400-e29b-41d4-a716-446655440000",
    full_name: "Andrea C. Cooke",
    party: "Dem",
    photo_url: "https://example.com/photo.jpg",
    ballot_order: 1,
    filing_status: "qualified",
    is_incumbent: true,
    created_at: "2026-01-15T10:00:00Z",
    ...overrides,
  }
}

export function mockCandidateDetail(
  overrides?: Partial<CandidateDetail>,
): CandidateDetail {
  return {
    ...mockCandidateSummary(),
    bio: "Community advocate and former city council member.",
    sos_ballot_option_id: "SOS-123",
    updated_at: "2026-02-01T14:30:00Z",
    links: [
      mockCandidateLink(),
      mockCandidateLink({
        id: "link-002",
        link_type: "twitter",
        url: "https://twitter.com/cookeforsenate",
        label: "@cookeforsenate",
      }),
    ],
    result_vote_count: 15234,
    result_political_party: "Democratic",
    ...overrides,
  }
}

export function mockPaginatedCandidateList(
  overrides?: Partial<PaginatedCandidateListResponse>,
): PaginatedCandidateListResponse {
  return {
    items: [
      mockCandidateSummary(),
      mockCandidateSummary({
        id: "cand-uuid-002",
        full_name: "Robert T. Williams",
        party: "Rep",
        photo_url: null,
        ballot_order: 2,
        is_incumbent: false,
      }),
    ],
    pagination: {
      total: 2,
      page: 1,
      page_size: 20,
      total_pages: 1,
    },
    ...overrides,
  }
}
