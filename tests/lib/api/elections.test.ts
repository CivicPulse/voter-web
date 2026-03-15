import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  getElections,
  getElectionDetail,
  getElectionResults,
  getElectionGeoJSON,
  getPrecinctGeoJSON,
  getElectionParticipants,
  getFilterOptions,
  getElectionCapabilities,
  createElection,
  updateElection,
  refreshElection,
  deleteElection,
} from "@/lib/api/elections"

// Mock the ky-based api client
const mockJson = vi.fn()
const mockGet = vi.fn(() => ({ json: mockJson }))
const mockPost = vi.fn(() => ({ json: mockJson }))
const mockPatch = vi.fn(() => ({ json: mockJson }))
const mockDelete = vi.fn()
const mockPublicJson = vi.fn()
const mockPublicGet = vi.fn(() => ({ json: mockPublicJson }))

vi.mock("@/api/client", () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
  publicApi: {
    get: (...args: unknown[]) => mockPublicGet(...args),
  },
}))

const mockRawListResponse = {
  items: [
    {
      id: "abc-123",
      name: "Test Election",
      election_date: "2026-03-01",
      election_type: "special",
      district: "Test District",
      status: "active",
      last_refreshed_at: null,
    },
  ],
  pagination: {
    total: 1,
    page: 1,
    page_size: 20,
    total_pages: 1,
  },
}

describe("elections API client", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockJson.mockResolvedValue({})
  })

  describe("getElections", () => {
    beforeEach(() => {
      mockJson.mockResolvedValue(mockRawListResponse)
    })

    it("calls GET /elections and transforms response", async () => {
      const result = await getElections()
      expect(mockGet).toHaveBeenCalledWith("elections", {
        searchParams: {},
      })
      expect(result.elections).toHaveLength(1)
      expect(result.elections[0].name).toBe("Test Election")
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.page_size).toBe(20)
      expect(result.total_pages).toBe(1)
    })

    it("passes filter params", async () => {
      await getElections({
        status: "active",
        election_type: "special",
        date_from: "2026-01-01",
        page: 2,
      })
      expect(mockGet).toHaveBeenCalledWith("elections", {
        searchParams: {
          status: "active",
          election_type: "special",
          date_from: "2026-01-01",
          page: "2",
        },
      })
    })

    it("omits 'all' filter values", async () => {
      await getElections({ status: "all", election_type: "all" })
      expect(mockGet).toHaveBeenCalledWith("elections", {
        searchParams: {},
      })
    })

    it("passes date_to param", async () => {
      await getElections({ date_to: "2026-12-31" })
      expect(mockGet).toHaveBeenCalledWith("elections", {
        searchParams: { date_to: "2026-12-31" },
      })
    })

    it("passes page_size param", async () => {
      await getElections({ page_size: 50 })
      expect(mockGet).toHaveBeenCalledWith("elections", {
        searchParams: { page_size: "50" },
      })
    })

    it("passes registration_open param", async () => {
      await getElections({ registration_open: true })
      expect(mockGet).toHaveBeenCalledWith("elections", {
        searchParams: { registration_open: "true" },
      })
    })

    it("passes early_voting_active param", async () => {
      await getElections({ early_voting_active: true })
      expect(mockGet).toHaveBeenCalledWith("elections", {
        searchParams: { early_voting_active: "true" },
      })
    })

    it("omits registration_open when false", async () => {
      await getElections({ registration_open: false })
      expect(mockGet).toHaveBeenCalledWith("elections", {
        searchParams: {},
      })
    })

    // Phase 3: new filter params
    it("passes q param to searchParams", async () => {
      await getElections({ q: "senate" })
      expect(mockGet).toHaveBeenCalledWith("elections", {
        searchParams: { q: "senate" },
      })
    })

    it("passes race_category param to searchParams", async () => {
      await getElections({ race_category: "federal" })
      expect(mockGet).toHaveBeenCalledWith("elections", {
        searchParams: { race_category: "federal" },
      })
    })

    it("passes county param to searchParams", async () => {
      await getElections({ county: "Bibb" })
      expect(mockGet).toHaveBeenCalledWith("elections", {
        searchParams: { county: "Bibb" },
      })
    })

    it("passes election_date param to searchParams", async () => {
      await getElections({ election_date: "2026-11-03" })
      expect(mockGet).toHaveBeenCalledWith("elections", {
        searchParams: { election_date: "2026-11-03" },
      })
    })
  })

  describe("getElectionDetail", () => {
    it("calls GET /elections/{id}", async () => {
      await getElectionDetail("abc-123")
      expect(mockGet).toHaveBeenCalledWith("elections/abc-123")
    })
  })

  describe("getElectionResults", () => {
    it("calls GET /elections/{id}/results", async () => {
      await getElectionResults("abc-123")
      expect(mockGet).toHaveBeenCalledWith("elections/abc-123/results")
    })
  })

  describe("getElectionGeoJSON", () => {
    it("calls GET /elections/{id}/results/geojson", async () => {
      await getElectionGeoJSON("abc-123")
      expect(mockGet).toHaveBeenCalledWith("elections/abc-123/results/geojson")
    })
  })

  describe("getPrecinctGeoJSON", () => {
    it("calls GET /elections/{id}/results/geojson/precincts without county", async () => {
      await getPrecinctGeoJSON("abc-123")
      expect(mockGet).toHaveBeenCalledWith(
        "elections/abc-123/results/geojson/precincts",
        { searchParams: {} },
      )
    })

    it("strips ' County' suffix from county filter param", async () => {
      await getPrecinctGeoJSON("abc-123", "Bibb County")
      expect(mockGet).toHaveBeenCalledWith(
        "elections/abc-123/results/geojson/precincts",
        { searchParams: { county: "Bibb" } },
      )
    })

    it("passes bare county name unchanged", async () => {
      await getPrecinctGeoJSON("abc-123", "Bibb")
      expect(mockGet).toHaveBeenCalledWith(
        "elections/abc-123/results/geojson/precincts",
        { searchParams: { county: "Bibb" } },
      )
    })
  })

  describe("getElectionParticipants", () => {
    const mockRawParticipantResponse = {
      items: [
        {
          id: "part-001",
          voter_id: "voter-uuid-001",
          voter_registration_number: "12345678",
          first_name: "Jane",
          last_name: "Doe",
          county: "Bibb",
          election_date: "2026-02-17",
          election_type: "special",
          normalized_election_type: "special",
          party: null,
          ballot_style: null,
          early_voting: false,
          absentee: false,
          provisional: false,
          supplemental: false,
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        page_size: 25,
        total_pages: 1,
      },
    }

    beforeEach(() => {
      mockJson.mockResolvedValue(mockRawParticipantResponse)
    })

    it("calls GET elections/{id}/participation with empty searchParams when no params given", async () => {
      await getElectionParticipants("election-001")
      expect(mockGet).toHaveBeenCalledWith(
        "elections/election-001/participation",
        { searchParams: {} },
      )
    })

    it("passes page and page_size params", async () => {
      await getElectionParticipants("election-001", { page: 3, page_size: 50 })
      expect(mockGet).toHaveBeenCalledWith(
        "elections/election-001/participation",
        { searchParams: { page: "3", page_size: "50" } },
      )
    })

    it("passes q (search query) param", async () => {
      await getElectionParticipants("election-001", { q: "Jane Doe" })
      expect(mockGet).toHaveBeenCalledWith(
        "elections/election-001/participation",
        { searchParams: { q: "Jane Doe" } },
      )
    })

    it("passes county param", async () => {
      await getElectionParticipants("election-001", { county: "Bibb" })
      expect(mockGet).toHaveBeenCalledWith(
        "elections/election-001/participation",
        { searchParams: { county: "Bibb" } },
      )
    })

    it("passes voter_status param", async () => {
      await getElectionParticipants("election-001", {
        voter_status: "ACTIVE",
      })
      expect(mockGet).toHaveBeenCalledWith(
        "elections/election-001/participation",
        { searchParams: { voter_status: "ACTIVE" } },
      )
    })

    it("passes has_district_mismatch=true as string 'true'", async () => {
      await getElectionParticipants("election-001", {
        has_district_mismatch: true,
      })
      expect(mockGet).toHaveBeenCalledWith(
        "elections/election-001/participation",
        { searchParams: { has_district_mismatch: "true" } },
      )
    })

    it("passes has_district_mismatch=false as string 'false'", async () => {
      await getElectionParticipants("election-001", {
        has_district_mismatch: false,
      })
      expect(mockGet).toHaveBeenCalledWith(
        "elections/election-001/participation",
        { searchParams: { has_district_mismatch: "false" } },
      )
    })

    it("passes all filter params together", async () => {
      await getElectionParticipants("election-001", {
        page: 2,
        page_size: 25,
        q: "Smith",
        county: "Houston",
        voter_status: "ACTIVE",
        has_district_mismatch: true,
        county_precinct: "012A",
        ballot_style: "REGULAR",
        congressional_district: "008",
        state_senate_district: "018",
        state_house_district: "145",
      })
      expect(mockGet).toHaveBeenCalledWith(
        "elections/election-001/participation",
        {
          searchParams: {
            page: "2",
            page_size: "25",
            q: "Smith",
            county: "Houston",
            voter_status: "ACTIVE",
            has_district_mismatch: "true",
            county_precinct: "012A",
            ballot_style: "REGULAR",
            congressional_district: "008",
            state_senate_district: "018",
            state_house_district: "145",
          },
        },
      )
    })

    it("transforms raw participant data into ElectionParticipant format", async () => {
      mockJson.mockResolvedValueOnce({
        items: [
          {
            id: "part-001",
            voter_id: "voter-uuid-001",
            voter_registration_number: "12345678",
            first_name: "Jane",
            last_name: "Doe",
            county: "Bibb",
            election_date: "2026-02-17",
            election_type: "special",
            normalized_election_type: "special",
            party: null,
            ballot_style: null,
            early_voting: true,
            absentee: false,
            provisional: false,
            supplemental: false,
          },
          {
            id: "part-002",
            voter_id: null,
            voter_registration_number: "87654321",
            first_name: null,
            last_name: null,
            county: "Houston",
            election_date: "2026-02-17",
            election_type: "special",
            normalized_election_type: "special",
            party: null,
            ballot_style: null,
            early_voting: false,
            absentee: true,
            provisional: false,
            supplemental: false,
          },
          {
            id: "part-003",
            voter_id: "voter-uuid-003",
            voter_registration_number: "11223344",
            first_name: "Bob",
            last_name: "Jones",
            county: "Peach",
            election_date: "2026-02-17",
            election_type: "special",
            normalized_election_type: "special",
            party: null,
            ballot_style: null,
            early_voting: false,
            absentee: false,
            provisional: false,
            supplemental: false,
          },
        ],
        pagination: { total: 3, page: 1, page_size: 25, total_pages: 1 },
      })

      const result = await getElectionParticipants("election-001")

      expect(result.items).toHaveLength(3)
      // Early voting
      expect(result.items[0]).toEqual({
        id: "part-001",
        voter_id: "voter-uuid-001",
        voter_registration_number: "12345678",
        first_name: "Jane",
        last_name: "Doe",
        county: "Bibb",
        voting_method: "Early Voting",
      })
      // Absentee by mail — null names become empty strings
      expect(result.items[1]).toEqual({
        id: "part-002",
        voter_id: null,
        voter_registration_number: "87654321",
        first_name: "",
        last_name: "",
        county: "Houston",
        voting_method: "Absentee by Mail",
      })
      // In person (no flags set)
      expect(result.items[2].voting_method).toBe("In Person")
    })

    it("returns pagination from raw response", async () => {
      const result = await getElectionParticipants("election-001")
      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        page_size: 25,
        total_pages: 1,
      })
    })
  })

  describe("getFilterOptions", () => {
    beforeEach(() => {
      mockPublicJson.mockResolvedValue({
        race_categories: ["federal", "local"],
        counties: ["Bibb", "Houston"],
        election_dates: ["2026-11-03"],
      })
    })

    it("calls GET elections/filter-options with scoped filter params", async () => {
      await getFilterOptions({
        status: "active",
        election_type: "general",
        date_from: "2026-01-01",
        date_to: "2026-12-31",
        q: "senate",
        race_category: "federal",
        county: "Bibb",
      })
      expect(mockPublicGet).toHaveBeenCalledWith("elections/filter-options", {
        searchParams: {
          status: "active",
          election_type: "general",
          date_from: "2026-01-01",
          date_to: "2026-12-31",
          q: "senate",
          race_category: "federal",
          county: "Bibb",
        },
      })
    })

    it("omits 'all' values from searchParams", async () => {
      await getFilterOptions({
        status: "all",
        election_type: "all",
      })
      expect(mockPublicGet).toHaveBeenCalledWith("elections/filter-options", {
        searchParams: {},
      })
    })

    it("returns typed FilterOptionsResponse", async () => {
      const result = await getFilterOptions()
      expect(result).toEqual({
        race_categories: ["federal", "local"],
        counties: ["Bibb", "Houston"],
        election_dates: ["2026-11-03"],
      })
    })
  })

  describe("getElectionCapabilities", () => {
    it("calls GET elections/capabilities via publicApi", async () => {
      mockPublicJson.mockResolvedValueOnce({
        supported_filters: ["q", "county"],
        endpoints: { filter_options: true },
      })
      const result = await getElectionCapabilities()
      expect(mockPublicGet).toHaveBeenCalledWith("elections/capabilities")
      expect(result).toEqual({
        supported_filters: ["q", "county"],
        endpoints: { filter_options: true },
      })
    })
  })

  describe("createElection", () => {
    it("calls POST /elections with JSON body", async () => {
      const data = {
        name: "Test",
        election_date: "2026-03-01",
        election_type: "special" as const,
        district: "Test District",
        data_source_url: "https://example.com",
      }
      await createElection(data)
      expect(mockPost).toHaveBeenCalledWith("elections", { json: data })
    })
  })

  describe("updateElection", () => {
    it("calls PATCH /elections/{id} with JSON body", async () => {
      const data = { name: "Updated" }
      await updateElection("abc-123", data)
      expect(mockPatch).toHaveBeenCalledWith("elections/abc-123", {
        json: data,
      })
    })
  })

  describe("refreshElection", () => {
    it("calls POST /elections/{id}/refresh", async () => {
      await refreshElection("abc-123")
      expect(mockPost).toHaveBeenCalledWith("elections/abc-123/refresh")
    })
  })

  describe("deleteElection", () => {
    it("calls DELETE /elections/{id} and resolves void", async () => {
      mockDelete.mockReturnValueOnce(Promise.resolve())

      await deleteElection("election-abc")

      expect(mockDelete).toHaveBeenCalledWith("elections/election-abc")
    })

    it("propagates HTTPError from ky", async () => {
      mockDelete.mockRejectedValueOnce(new Error("HTTP 409"))

      await expect(deleteElection("election-abc")).rejects.toThrow("HTTP 409")
    })
  })
})
