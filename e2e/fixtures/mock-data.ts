/**
 * Static mock data for E2E tests.
 *
 * Mirrors the factory output from src/test/mocks/elections.ts but is
 * self-contained (no @/ path-alias imports) so Playwright can load it
 * without Vite's path resolution.
 */

export const ELECTION_ID = "550e8400-e29b-41d4-a716-446655440000"
export const ELECTION_DATE = "2026-02-17"

// ---------------------------------------------------------------------------
// Shared candidate data
// ---------------------------------------------------------------------------

const janeDoe = {
  id: "cand-001",
  name: "Jane Doe",
  political_party: "Dem",
  ballot_order: 1,
  vote_count: 12500,
  group_results: [
    { group_name: "Election Day", vote_count: 8000 },
    { group_name: "Advance Voting", vote_count: 3500 },
    { group_name: "Absentee by Mail", vote_count: 900 },
    { group_name: "Provisional", vote_count: 100 },
  ],
}

const johnSmith = {
  id: "cand-002",
  name: "John Smith",
  political_party: "Rep",
  ballot_order: 2,
  vote_count: 9800,
  group_results: [
    { group_name: "Election Day", vote_count: 7200 },
    { group_name: "Advance Voting", vote_count: 2000 },
    { group_name: "Absentee by Mail", vote_count: 500 },
    { group_name: "Provisional", vote_count: 100 },
  ],
}

// ---------------------------------------------------------------------------
// GET /elections  (raw API shape: { items, pagination })
// ---------------------------------------------------------------------------

export const electionsListResponse = {
  items: [
    {
      id: ELECTION_ID,
      name: "State Senate District 18 Special",
      election_date: ELECTION_DATE,
      election_type: "special",
      district: "State Senate - District 18",
      data_source_url: "https://results.sos.ga.gov/api/test",
      status: "active",
      last_refreshed_at: "2026-02-17T19:40:48Z",
      refresh_interval_seconds: 120,
      created_at: "2026-02-10T14:00:00Z",
      updated_at: "2026-02-17T19:40:48Z",
    },
  ],
  pagination: {
    total: 1,
    page: 1,
    page_size: 20,
    total_pages: 1,
  },
}

// ---------------------------------------------------------------------------
// GET /elections/{id}
// ---------------------------------------------------------------------------

export const electionDetailResponse = {
  id: ELECTION_ID,
  name: "State Senate District 18 Special",
  election_date: ELECTION_DATE,
  election_type: "special",
  district: "State Senate - District 18",
  data_source_url: "https://results.sos.ga.gov/api/test",
  status: "active",
  last_refreshed_at: "2026-02-17T19:40:48Z",
  refresh_interval_seconds: 120,
  created_at: "2026-02-10T14:00:00Z",
  updated_at: "2026-02-17T19:40:48Z",
}

// ---------------------------------------------------------------------------
// GET /elections/{id}/results
// ---------------------------------------------------------------------------

export const electionResultsResponse = {
  election_id: ELECTION_ID,
  candidates: [janeDoe, johnSmith],
  county_results: [
    {
      county_name: "Bibb County",
      county_name_normalized: "bibb",
      precincts_participating: 45,
      precincts_reporting: 38,
      candidates: [
        { ...janeDoe, vote_count: 6200 },
        { ...johnSmith, vote_count: 4800 },
      ],
    },
  ],
  precincts_participating: 120,
  precincts_reporting: 95,
}

/** Variant with null precinct counts — regression test for the NaN% bug. */
export const electionResultsWithNullCounts = {
  ...electionResultsResponse,
  precincts_participating: null,
  precincts_reporting: null,
}

// ---------------------------------------------------------------------------
// GET /elections/{id}/results/geojson  (county-level choropleth)
// ---------------------------------------------------------------------------

export const countyGeoJSONResponse = {
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
          { ...janeDoe, vote_count: 6200 },
          { ...johnSmith, vote_count: 4800 },
        ],
      },
    },
  ],
}

// ---------------------------------------------------------------------------
// GET /elections/{id}/results/geojson/precincts
// ---------------------------------------------------------------------------

export const precinctGeoJSONResponse = {
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
        reporting_status: "Reported",
        candidates: [
          { ...janeDoe, vote_count: 350 },
          { ...johnSmith, vote_count: 280 },
        ],
      },
    },
  ],
}

/**
 * Variant with reporting_status "Election Night Complete" — regression test
 * for the bug where precincts with this status were not colored by candidate.
 */
export const precinctGeoJSONElectionNightComplete = {
  ...precinctGeoJSONResponse,
  features: precinctGeoJSONResponse.features.map((f) => ({
    ...f,
    properties: {
      ...f.properties,
      reporting_status: "Election Night Complete",
    },
  })),
}

// ---------------------------------------------------------------------------
// GET /boundaries/geojson?boundary_type=county_precinct&county=...
// ---------------------------------------------------------------------------

export const boundaryGeoJSONResponse = {
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
        name: "Bibb Precinct 1",
        boundary_type: "county_precinct",
        boundary_identifier: "bibb-precinct-001",
        source: "census-tiger",
        county: "Bibb",
        precinct_name: "Bibb Precinct 1",
        precinct_id: "precinct-001",
        precinct_county_name: "Bibb County",
      },
    },
  ],
}
