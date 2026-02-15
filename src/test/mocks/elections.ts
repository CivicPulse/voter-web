import type {
  Election,
  ElectionEvent,
  CandidateResult,
  VoteMethodResult,
  CountyResult,
  ElectionResultsResponse,
  PaginatedElectionListResponse,
  CountyResultFeatureCollection,
  PrecinctResultFeatureCollection,
  RefreshResponse,
} from "@/types/elections"

// ============================================================================
// Factory Functions — Create mock data with optional overrides
// ============================================================================

export function mockVoteMethodResult(
  overrides?: Partial<VoteMethodResult>,
): VoteMethodResult {
  return {
    group_name: "Election Day",
    vote_count: 5000,
    ...overrides,
  }
}

export function mockCandidateResult(
  overrides?: Partial<CandidateResult>,
): CandidateResult {
  return {
    id: "cand-001",
    name: "Jane Doe",
    political_party: "Dem",
    ballot_order: 1,
    vote_count: 12500,
    group_results: [
      mockVoteMethodResult({ group_name: "Election Day", vote_count: 8000 }),
      mockVoteMethodResult({ group_name: "Advance Voting", vote_count: 3500 }),
      mockVoteMethodResult({ group_name: "Absentee by Mail", vote_count: 900 }),
      mockVoteMethodResult({ group_name: "Provisional", vote_count: 100 }),
    ],
    ...overrides,
  }
}

export function mockCountyResult(
  overrides?: Partial<CountyResult>,
): CountyResult {
  return {
    county_name: "Bibb County",
    county_name_normalized: "bibb",
    precincts_participating: 45,
    precincts_reporting: 38,
    candidates: [
      mockCandidateResult({ id: "cand-001", vote_count: 6200 }),
      mockCandidateResult({
        id: "cand-002",
        name: "John Smith",
        political_party: "Rep",
        ballot_order: 2,
        vote_count: 4800,
      }),
    ],
    ...overrides,
  }
}

export function mockElection(overrides?: Partial<Election>): Election {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "State Senate District 18 Special",
    election_date: "2026-02-17",
    election_type: "special",
    district: "State Senate - District 18",
    data_source_url: "https://results.sos.ga.gov/api/test",
    status: "active",
    last_refreshed_at: "2026-02-17T19:40:48Z",
    refresh_interval_seconds: 120,
    created_at: "2026-02-10T14:00:00Z",
    updated_at: "2026-02-17T19:40:48Z",
    ...overrides,
  }
}

export function mockElectionEvent(
  overrides?: Partial<ElectionEvent>,
): ElectionEvent {
  const race1 = mockElection()
  const race2 = mockElection({
    id: "660e8400-e29b-41d4-a716-446655440001",
    name: "State House District 145",
    district: "State House - District 145",
  })
  return {
    date: "2026-02-17",
    types: ["special"],
    races: [race1, race2],
    raceCount: 2,
    hasActiveRaces: true,
    ...overrides,
  }
}

export function mockElectionResultsResponse(
  overrides?: Partial<ElectionResultsResponse>,
): ElectionResultsResponse {
  return {
    election_id: "550e8400-e29b-41d4-a716-446655440000",
    candidates: [
      mockCandidateResult(),
      mockCandidateResult({
        id: "cand-002",
        name: "John Smith",
        political_party: "Rep",
        ballot_order: 2,
        vote_count: 9800,
        group_results: [
          mockVoteMethodResult({ group_name: "Election Day", vote_count: 7200 }),
          mockVoteMethodResult({ group_name: "Advance Voting", vote_count: 2000 }),
          mockVoteMethodResult({ group_name: "Absentee by Mail", vote_count: 500 }),
          mockVoteMethodResult({ group_name: "Provisional", vote_count: 100 }),
        ],
      }),
    ],
    county_results: [mockCountyResult()],
    total_precincts_participating: 120,
    total_precincts_reporting: 95,
    ...overrides,
  }
}

export function mockPaginatedElectionList(
  overrides?: Partial<PaginatedElectionListResponse>,
): PaginatedElectionListResponse {
  return {
    elections: [
      mockElection(),
      mockElection({
        id: "660e8400-e29b-41d4-a716-446655440001",
        name: "State House District 145",
        district: "State House - District 145",
      }),
      mockElection({
        id: "770e8400-e29b-41d4-a716-446655440002",
        name: "US Senate",
        election_date: "2026-11-03",
        election_type: "general",
        district: "US Senate - Georgia",
        status: "finalized",
      }),
    ],
    total: 3,
    page: 1,
    page_size: 20,
    total_pages: 1,
    ...overrides,
  }
}

export function mockRefreshResponse(
  overrides?: Partial<RefreshResponse>,
): RefreshResponse {
  return {
    election_id: "550e8400-e29b-41d4-a716-446655440000",
    refreshed_at: "2026-02-17T19:45:00Z",
    counties_updated: 5,
    precincts_reporting: 95,
    precincts_participating: 120,
    ...overrides,
  }
}

export function mockCountyGeoJSON(): CountyResultFeatureCollection {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-83.7, 32.8],
              [-83.5, 32.8],
              [-83.5, 33.0],
              [-83.7, 33.0],
              [-83.7, 32.8],
            ],
          ],
        },
        properties: {
          county_name: "Bibb County",
          precincts_participating: 45,
          precincts_reporting: 38,
          leading_candidate_name: "Jane Doe",
          leading_candidate_party: "Dem",
          leading_candidate_votes: 6200,
          total_votes: 11000,
          candidates: [
            mockCandidateResult({ vote_count: 6200 }),
            mockCandidateResult({
              id: "cand-002",
              name: "John Smith",
              political_party: "Rep",
              ballot_order: 2,
              vote_count: 4800,
            }),
          ],
        },
      },
    ],
  }
}

export function mockPrecinctGeoJSON(): PrecinctResultFeatureCollection {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [-83.65, 32.85],
              [-83.6, 32.85],
              [-83.6, 32.9],
              [-83.65, 32.9],
              [-83.65, 32.85],
            ],
          ],
        },
        properties: {
          precinct_id: "precinct-001",
          precinct_name: "Bibb Precinct 1",
          county_name: "Bibb County",
          is_reported: true,
          candidates: [
            mockCandidateResult({ vote_count: 350 }),
            mockCandidateResult({
              id: "cand-002",
              name: "John Smith",
              political_party: "Rep",
              ballot_order: 2,
              vote_count: 280,
            }),
          ],
          total_votes: 630,
        },
      },
    ],
  }
}
