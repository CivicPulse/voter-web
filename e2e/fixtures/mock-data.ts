/**
 * Static mock data for E2E tests.
 *
 * Mirrors the factory output from src/test/mocks/elections.ts but is
 * self-contained (no @/ path-alias imports) so Playwright can load it
 * without Vite's path resolution.
 */

export const ELECTION_ID = "550e8400-e29b-41d4-a716-446655440000"
export const ELECTION_DATE = "2026-02-17"
export const VOTER_ID = "v-001"

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

// ---------------------------------------------------------------------------
// Voter Search & Geocoding
// ---------------------------------------------------------------------------

export const voterSearchResponse = {
  items: [
    {
      id: VOTER_ID,
      voter_registration_number: "GA-12345678",
      first_name: "Jane",
      last_name: "Smith",
      county: "Bibb",
      registration_date: "2020-01-15",
      status: "Active",
    },
    {
      id: "v-002",
      voter_registration_number: "GA-87654321",
      first_name: "John",
      last_name: "Smith",
      county: "Fulton",
      registration_date: "2019-06-20",
      status: "Active",
    },
    {
      id: "v-003",
      voter_registration_number: "GA-11223344",
      first_name: "Robert",
      last_name: "Smithson",
      county: "DeKalb",
      registration_date: "2021-03-10",
      status: "Inactive",
    },
  ],
  total: 3,
  page: 1,
  page_size: 25,
  pages: 1,
}

export const voterDetailResponse = {
  id: VOTER_ID,
  voter_registration_number: "GA-12345678",
  first_name: "Jane",
  middle_name: "Marie",
  last_name: "Smith",
  suffix: null,
  county: "Bibb",
  status: "Active",
  registration_date: "2020-01-15",
  residence_address: {
    street_number: "123",
    pre_direction: null,
    street_name: "Main St",
    street_type: null,
    post_direction: null,
    apt_unit_number: "Apt 4B",
    city: "Macon",
    zipcode: "31201",
    full_address: "123 Main St, Macon, GA 31201",
  },
  mailing_address: null,
  geocoded_locations: [],
  present_in_latest_import: true,
  created_at: "2020-01-15T00:00:00Z",
  updated_at: "2026-01-15T10:30:00Z",
}

export const voterFilterOptionsResponse = {
  counties: ["Bibb", "DeKalb", "Fulton", "Gwinnett"],
  statuses: ["Active", "Inactive"],
  congressional_districts: ["5", "10", "13"],
  state_senate_districts: ["18", "25"],
  state_house_districts: ["145", "150"],
  residence_cities: ["Macon", "Atlanta", "Augusta"],
  residence_zipcodes: ["31201", "30301"],
}

export const voterGeocodedLocationsResponse = [
  {
    id: "loc-001",
    voter_id: VOTER_ID,
    latitude: 32.8407,
    longitude: -83.6324,
    confidence_score: 0.95,
    source_type: "census",
    is_primary: true,
    input_address: "123 Main St, Macon, GA 31201",
    geocoded_at: "2026-01-15T10:30:00Z",
  },
  {
    id: "loc-002",
    voter_id: VOTER_ID,
    latitude: 32.8412,
    longitude: -83.6318,
    confidence_score: 0.88,
    source_type: "osm",
    is_primary: false,
    input_address: "123 Main St, Macon, GA 31201",
    geocoded_at: "2026-01-15T10:30:00Z",
  },
]

export const voterPointLookupResponse = {
  latitude: 32.8407,
  longitude: -83.6324,
  accuracy_radius_meters: null,
  districts: [
    {
      boundary_type: "county",
      name: "Bibb County",
      boundary_identifier: "bibb",
      boundary_id: "bd-001",
      metadata: {},
    },
    {
      boundary_type: "congressional",
      name: "Congressional District 2",
      boundary_identifier: "ga-cd-002",
      boundary_id: "bd-002",
      metadata: {},
    },
    {
      boundary_type: "state_senate",
      name: "State Senate District 18",
      boundary_identifier: "ga-ss-018",
      boundary_id: "bd-003",
      metadata: {},
    },
    {
      boundary_type: "state_house",
      name: "State House District 145",
      boundary_identifier: "ga-sh-145",
      boundary_id: "bd-004",
      metadata: {},
    },
    {
      boundary_type: "county_precinct",
      name: "Precinct 1",
      boundary_identifier: "bibb-p1",
      boundary_id: "bd-005",
      metadata: {},
    },
  ],
}

export const voterGeocodeResultResponse = [
  {
    id: "loc-001",
    voter_id: VOTER_ID,
    latitude: 32.8407,
    longitude: -83.6324,
    confidence_score: 0.95,
    source_type: "census",
    is_primary: true,
    input_address: "123 Main St, Macon, GA 31201",
    geocoded_at: "2026-02-18T14:00:00Z",
  },
  {
    id: "loc-003",
    voter_id: VOTER_ID,
    latitude: 32.8415,
    longitude: -83.632,
    confidence_score: 0.82,
    source_type: "osm",
    is_primary: false,
    input_address: "123 Main St, Macon, GA 31201",
    geocoded_at: "2026-02-18T14:00:00Z",
  },
]
