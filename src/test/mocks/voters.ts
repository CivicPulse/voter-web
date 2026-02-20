import type {
  VoterSummary,
  VoterDetail,
  VoterSearchResponse,
  VoterFilterOptions,
} from "@/types/voter"
import type { VoterGeocodedLocation } from "@/types/lookup"

export function mockVoterSummary(
  overrides?: Partial<VoterSummary>,
): VoterSummary {
  return {
    id: "v-001",
    first_name: "Jane",
    last_name: "Smith",
    county: "Bibb",
    voter_id: "GA-12345678",
    registration_date: "2020-01-15",
    status: "Active",
    ...overrides,
  }
}

export function mockVoterDetail(
  overrides?: Partial<VoterDetail>,
): VoterDetail {
  return {
    id: "v-001",
    first_name: "Jane",
    middle_name: "Marie",
    last_name: "Smith",
    suffix: null,
    voter_id: "GA-12345678",
    county: "Bibb",
    status: "Active",
    registration_date: "2020-01-15",
    address_line_1: "123 Main St, Macon, GA 31201",
    address_line_2: "Apt 4B",
    city: "Macon",
    state: "",
    zip_code: "31201",
    ...overrides,
  }
}

export function mockVoterSearchResponse(
  overrides?: Partial<VoterSearchResponse>,
): VoterSearchResponse {
  return {
    voters: [
      mockVoterSummary(),
      mockVoterSummary({
        id: "v-002",
        first_name: "John",
        last_name: "Smith",
        voter_id: "GA-87654321",
        county: "Fulton",
        registration_date: "2019-06-20",
      }),
      mockVoterSummary({
        id: "v-003",
        first_name: "Robert",
        last_name: "Smithson",
        voter_id: "GA-11223344",
        county: "DeKalb",
        registration_date: "2021-03-10",
        status: "Inactive",
      }),
    ],
    total: 3,
    page: 1,
    page_size: 25,
    total_pages: 1,
    ...overrides,
  }
}

export function mockVoterFilterOptions(
  overrides?: Partial<VoterFilterOptions>,
): VoterFilterOptions {
  return {
    counties: ["Bibb", "DeKalb", "Fulton", "Gwinnett"],
    statuses: ["Active", "Inactive"],
    congressional_districts: ["5", "10", "13"],
    state_senate_districts: ["18", "25"],
    state_house_districts: ["145", "150"],
    residence_cities: ["Macon", "Atlanta", "Augusta"],
    residence_zipcodes: ["31201", "30301"],
    ...overrides,
  }
}

export function mockVoterGeocodedLocation(
  overrides?: Partial<VoterGeocodedLocation>,
): VoterGeocodedLocation {
  return {
    id: "loc-001",
    voter_id: "v-001",
    latitude: 32.8407,
    longitude: -83.6324,
    confidence_score: 0.95,
    source_type: "census",
    is_primary: true,
    input_address: "123 Main St, Macon, GA 31201",
    geocoded_at: "2026-01-15T10:30:00Z",
    ...overrides,
  }
}
