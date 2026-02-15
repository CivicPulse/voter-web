import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  getElections,
  getElectionDetail,
  getElectionResults,
  getElectionGeoJSON,
  getPrecinctGeoJSON,
  createElection,
  updateElection,
  refreshElection,
} from "@/lib/api/elections"

// Mock the ky-based api client
const mockJson = vi.fn()
const mockGet = vi.fn(() => ({ json: mockJson }))
const mockPost = vi.fn(() => ({ json: mockJson }))
const mockPatch = vi.fn(() => ({ json: mockJson }))

vi.mock("@/api/client", () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
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

    it("passes county filter param", async () => {
      await getPrecinctGeoJSON("abc-123", "Bibb County")
      expect(mockGet).toHaveBeenCalledWith(
        "elections/abc-123/results/geojson/precincts",
        { searchParams: { county: "Bibb County" } },
      )
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
})
