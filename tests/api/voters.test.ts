import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  searchVoters,
  getVoterDetail,
  getVoterFilters,
  triggerVoterGeocode,
  deleteGeocodedLocation,
} from "@/api/voters"
import {
  mockVoterSearchResponse,
  mockVoterFilterOptions,
} from "@/test/mocks/voters"

// Mock the ky client
const mockJson = vi.fn()
const mockGet = vi.fn(() => ({ json: mockJson }))
const mockPost = vi.fn(() => Promise.resolve())
const mockDelete = vi.fn(() => Promise.resolve())

vi.mock("@/api/client", () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("searchVoters", () => {
  it("calls GET /voters with search params and transforms response", async () => {
    const expected = mockVoterSearchResponse()
    // Backend returns { items: [...raw items...], pages, total, page, page_size }
    mockJson.mockResolvedValue({
      items: expected.voters.map((v) => ({
        id: v.id,
        voter_registration_number: v.voter_id,
        first_name: v.first_name,
        last_name: v.last_name,
        county: v.county,
        status: v.status,
        registration_date: v.registration_date,
      })),
      pages: expected.total_pages,
      total: expected.total,
      page: expected.page,
      page_size: expected.page_size,
    })

    const result = await searchVoters({ q: "Smith", page: 2 })

    expect(mockGet).toHaveBeenCalledWith("voters", {
      searchParams: { q: "Smith", page: "2" },
    })
    expect(result).toEqual(expected)
  })

  it("omits undefined params from search params", async () => {
    const expected = mockVoterSearchResponse()
    mockJson.mockResolvedValue({
      items: expected.voters.map((v) => ({
        id: v.id,
        voter_registration_number: v.voter_id,
        first_name: v.first_name,
        last_name: v.last_name,
        county: v.county,
        status: v.status,
        registration_date: v.registration_date,
      })),
      pages: expected.total_pages,
      total: expected.total,
      page: expected.page,
      page_size: expected.page_size,
    })

    await searchVoters({})

    expect(mockGet).toHaveBeenCalledWith("voters", {
      searchParams: {},
    })
  })

  it("passes all filter params when provided", async () => {
    const expected = mockVoterSearchResponse()
    mockJson.mockResolvedValue({
      items: expected.voters.map((v) => ({
        id: v.id,
        voter_registration_number: v.voter_id,
        first_name: v.first_name,
        last_name: v.last_name,
        county: v.county,
        status: v.status,
        registration_date: v.registration_date,
      })),
      pages: expected.total_pages,
      total: expected.total,
      page: expected.page,
      page_size: expected.page_size,
    })

    await searchVoters({
      q: "Jane",
      county: "Bibb",
      status: "Active",
      congressional_district: "5",
      state_senate_district: "18",
      state_house_district: "145",
      sort_by: "name",
      sort_order: "desc",
      page: 3,
    })

    expect(mockGet).toHaveBeenCalledWith("voters", {
      searchParams: {
        q: "Jane",
        county: "Bibb",
        status: "Active",
        congressional_district: "5",
        state_senate_district: "18",
        state_house_district: "145",
        sort_by: "name",
        sort_order: "desc",
        page: "3",
      },
    })
  })

  it("transforms voter_registration_number to voter_id", async () => {
    mockJson.mockResolvedValue({
      items: [
        {
          id: "v-001",
          voter_registration_number: "GA-12345678",
          first_name: "Jane",
          last_name: "Smith",
          county: "Bibb",
          status: "Active",
          registration_date: "2020-01-15",
        },
      ],
      pages: 1,
      total: 1,
      page: 1,
      page_size: 25,
    })

    const result = await searchVoters({})

    expect(result.voters[0].voter_id).toBe("GA-12345678")
  })
})

describe("getVoterDetail", () => {
  it("calls GET /voters/{voterId} and transforms backend response", async () => {
    // Backend returns voter_registration_number, nested residence_address, and district fields
    mockJson.mockResolvedValue({
      id: "v-001",
      voter_registration_number: "GA-12345678",
      first_name: "Jane",
      middle_name: "Marie",
      last_name: "Smith",
      suffix: null,
      status: "Active",
      registration_date: "2020-01-15",
      county: "Bibb",
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
      congressional_district: "5",
      state_senate_district: "18",
      state_house_district: "145",
      county_precinct: "0001",
      precinct: null,
    })

    const result = await getVoterDetail("v-001")

    expect(mockGet).toHaveBeenCalledWith("voters/v-001")
    expect(result).toEqual({
      id: "v-001",
      voter_id: "GA-12345678",
      first_name: "Jane",
      middle_name: "Marie",
      last_name: "Smith",
      suffix: null,
      county: "Bibb",
      status: "Active",
      registration_date: "2020-01-15",
      address_line_1: "123 Main St, Macon, GA 31201",
      address_line_2: "Apt 4B",
      city: "Macon",
      state: "",
      zip_code: "31201",
      congressional_district: "5",
      state_senate_district: "18",
      state_house_district: "145",
      county_precinct: "0001",
      precinct: null,
    })
  })
})

describe("getVoterFilters", () => {
  it("calls GET /voters/filters", async () => {
    const filters = mockVoterFilterOptions()
    mockJson.mockResolvedValue(filters)

    const result = await getVoterFilters()

    expect(mockGet).toHaveBeenCalledWith("voters/filters")
    expect(result).toEqual(filters)
  })
})

describe("triggerVoterGeocode", () => {
  it("calls POST /geocoding/voter/{voterId}/geocode-all", async () => {
    await triggerVoterGeocode("v-001")

    expect(mockPost).toHaveBeenCalledWith("geocoding/voter/v-001/geocode-all")
  })
})

describe("deleteGeocodedLocation", () => {
  it("calls DELETE /voters/{voterId}/geocoded-locations/{locationId}", async () => {
    await deleteGeocodedLocation("v-001", "loc-001")

    expect(mockDelete).toHaveBeenCalledWith(
      "voters/v-001/geocoded-locations/loc-001",
    )
  })
})
