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

/** Helper to build a minimal precinct boundary feature */
function makePrecinctFeature(county: string, precinctId: string, precinctName: string) {
  return {
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [[[-83.65, 32.85], [-83.6, 32.85], [-83.6, 32.9], [-83.65, 32.9], [-83.65, 32.85]]],
    },
    properties: {
      name: precinctName,
      boundary_type: "county_precinct",
      boundary_identifier: `${county.toLowerCase()}-${precinctId}`,
      source: "census-tiger",
      county,
      precinct_name: precinctName,
      precinct_id: precinctId,
      precinct_county_name: `${county} County`,
    },
  }
}

/** County-specific boundary GeoJSON responses (precinct_id values match by_precinct mock) */
export const countyPrecinctBoundaries: Record<string, { type: string; features: ReturnType<typeof makePrecinctFeature>[] }> = {
  Bibb: {
    type: "FeatureCollection",
    features: [
      makePrecinctFeature("Bibb", "BI1", "BIBB 1"),
      makePrecinctFeature("Bibb", "BI2", "BIBB 2"),
      makePrecinctFeature("Bibb", "BI3", "BIBB 3"),
    ],
  },
  Houston: {
    type: "FeatureCollection",
    features: [
      makePrecinctFeature("Houston", "HO1", "HOUSTON 1"),
      makePrecinctFeature("Houston", "HO2", "HOUSTON 2"),
    ],
  },
  Peach: {
    type: "FeatureCollection",
    features: [
      makePrecinctFeature("Peach", "PE1", "PEACH 1"),
    ],
  },
  Crawford: {
    type: "FeatureCollection",
    features: [
      makePrecinctFeature("Crawford", "CR1", "CRAWFORD 1"),
    ],
  },
}

/** Default boundary GeoJSON (used when county param is not matched) */
export const boundaryGeoJSONResponse = countyPrecinctBoundaries.Bibb

// ---------------------------------------------------------------------------
// GET /boundaries/geojson?boundary_type=county_commission&county=...
// ---------------------------------------------------------------------------

function makeCommissionFeature(county: string, id: string, name: string) {
  return {
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [[[-83.65, 32.85], [-83.6, 32.85], [-83.6, 32.9], [-83.65, 32.9], [-83.65, 32.85]]],
    },
    properties: {
      name,
      boundary_type: "county_commission",
      boundary_identifier: id,
      source: "census-tiger",
      county,
    },
  }
}

export const countyCommissionBoundaries: Record<string, { type: string; features: ReturnType<typeof makeCommissionFeature>[] }> = {
  Bibb: {
    type: "FeatureCollection",
    features: [
      makeCommissionFeature("Bibb", "cc-001", "Commission District 1"),
      makeCommissionFeature("Bibb", "cc-002", "Commission District 2"),
      makeCommissionFeature("Bibb", "cc-003", "Commission District 3"),
    ],
  },
}

// ---------------------------------------------------------------------------
// GET /boundaries/geojson?boundary_type=school_board&county=...
// ---------------------------------------------------------------------------

function makeSchoolBoardFeature(county: string, id: string, name: string) {
  return {
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [[[-83.65, 32.85], [-83.6, 32.85], [-83.6, 32.9], [-83.65, 32.9], [-83.65, 32.85]]],
    },
    properties: {
      name,
      boundary_type: "school_board",
      boundary_identifier: id,
      source: "census-tiger",
      county,
    },
  }
}

export const schoolBoardBoundaries: Record<string, { type: string; features: ReturnType<typeof makeSchoolBoardFeature>[] }> = {
  Bibb: {
    type: "FeatureCollection",
    features: [
      makeSchoolBoardFeature("Bibb", "sb-001", "School Board District 1"),
      makeSchoolBoardFeature("Bibb", "sb-002", "School Board District 2"),
    ],
  },
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

export const voterFilterOptionsWithCountyResponse = {
  ...voterFilterOptionsResponse,
  county_precincts: ["BI1", "BI2", "BI3"],
  county_commission_districts: ["1", "2", "3"],
  school_board_districts: ["1", "2"],
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

// ---------------------------------------------------------------------------
// GET /voters/{voter_registration_number}/history
// (Backend returns PaginatedVoterHistoryResponse with VoterHistoryRecord items)
// ---------------------------------------------------------------------------

export const voterHistoryResponse = {
  items: [
    {
      id: "7343267d-e218-448c-8b3a-65553a894905",
      election_id: ELECTION_ID,
      voter_registration_number: "GA-12345678",
      county: "Bibb",
      election_date: ELECTION_DATE,
      election_type: "State Senate District 18 Special",
      normalized_election_type: "special",
      party: null,
      ballot_style: null,
      absentee: false,
      provisional: false,
      supplemental: false,
      created_at: "2026-02-17T19:40:48Z",
    },
    {
      id: "e-002",
      election_id: "d4e5f6a7-b8c9-0123-def0-456789abcdef",
      voter_registration_number: "GA-12345678",
      county: "Bibb",
      election_date: "2024-11-05",
      election_type: "2024 General Election",
      normalized_election_type: "general",
      party: "Democrat",
      ballot_style: null,
      absentee: false,
      provisional: false,
      supplemental: false,
      created_at: "2024-11-05T20:00:00Z",
    },
    {
      id: "e-003",
      election_id: null,
      voter_registration_number: "GA-12345678",
      county: "Bibb",
      election_date: "2024-05-21",
      election_type: "2024 Primary Election",
      normalized_election_type: "primary",
      party: null,
      ballot_style: null,
      absentee: true,
      provisional: false,
      supplemental: false,
      created_at: "2024-05-21T20:00:00Z",
    },
  ],
  pagination: {
    total: 3,
    page: 1,
    page_size: 20,
    total_pages: 1,
  },
}

// ---------------------------------------------------------------------------
// GET /elections/{id}/participation/stats
// (Backend returns ParticipationStatsResponse)
// ---------------------------------------------------------------------------

export const participationStatsResponse = {
  election_id: ELECTION_ID,
  total_participants: 22300,
  by_county: [
    { county: "Bibb", count: 10500 },
    { county: "Houston", count: 8200 },
    { county: "Peach", count: 2800 },
    { county: "Crawford", count: 800 },
  ],
  by_ballot_style: [
    { ballot_style: "In Person", count: 12000 },
    { ballot_style: "Early Voting", count: 6500 },
    { ballot_style: "Absentee by Mail", count: 3200 },
    { ballot_style: "Provisional", count: 600 },
  ],
  by_precinct: [
    { precinct: "BI1", precinct_name: "BIBB 1", count: 3500 },
    { precinct: "BI2", precinct_name: "BIBB 2", count: 3700 },
    { precinct: "BI3", precinct_name: "BIBB 3", count: 3300 },
    { precinct: "HO1", precinct_name: "HOUSTON 1", count: 4200 },
    { precinct: "HO2", precinct_name: "HOUSTON 2", count: 4000 },
    { precinct: "PE1", precinct_name: "PEACH 1", count: 2800 },
    { precinct: "CR1", precinct_name: "CRAWFORD 1", count: 800 },
  ],
}

// ---------------------------------------------------------------------------
// GET /elections/{id}/participation
// (Backend returns PaginatedElectionParticipationResponse)
// ---------------------------------------------------------------------------

export const electionParticipantsResponse = {
  items: [
    {
      id: "f1e2d3c4-b5a6-7890-1234-567890abcdef",
      voter_id: "e99ba779-9d57-4d0f-b520-63f9095c2391",
      voter_registration_number: "GA-12345678",
      county: "Bibb",
      election_date: ELECTION_DATE,
      election_type: "State Senate District 18 Special",
      normalized_election_type: "special",
      party: null,
      ballot_style: null,
      absentee: false,
      provisional: false,
      supplemental: false,
    },
    {
      id: "a2b3c4d5-e6f7-8901-2345-678901bcdef0",
      voter_id: "825c8a84-b761-46e5-ac44-9dd110b99c28",
      voter_registration_number: "GA-87654321",
      county: "Houston",
      election_date: ELECTION_DATE,
      election_type: "State Senate District 18 Special",
      normalized_election_type: "special",
      party: null,
      ballot_style: null,
      absentee: false,
      provisional: false,
      supplemental: false,
    },
  ],
  pagination: {
    total: 22300,
    page: 1,
    page_size: 25,
    total_pages: 892,
  },
}
