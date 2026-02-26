import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  getCandidates,
  getCandidateDetail,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  createCandidateLink,
  deleteCandidateLink,
} from "@/lib/api/candidates"

// Mock the ky-based api client
const mockJson = vi.fn()
const mockGet = vi.fn(() => ({ json: mockJson }))
const mockPost = vi.fn(() => ({ json: mockJson }))
const mockPatch = vi.fn(() => ({ json: mockJson }))
const mockDelete = vi.fn(() => ({ json: mockJson }))

vi.mock("@/api/client", () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    patch: (...args: unknown[]) => mockPatch(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
  publicApi: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}))

describe("candidates API client", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockJson.mockResolvedValue({})
  })

  describe("getCandidates", () => {
    it("calls GET elections/{id}/candidates with empty searchParams", async () => {
      const mockResponse = {
        items: [],
        pagination: { total: 0, page: 1, page_size: 20, total_pages: 0 },
      }
      mockJson.mockResolvedValue(mockResponse)

      const result = await getCandidates("elec-001")

      expect(mockGet).toHaveBeenCalledWith("elections/elec-001/candidates", {
        searchParams: {},
      })
      expect(result).toEqual(mockResponse)
    })

    it("passes status filter param", async () => {
      mockJson.mockResolvedValue({ items: [], pagination: {} })

      await getCandidates("elec-001", { status: "qualified" })

      expect(mockGet).toHaveBeenCalledWith("elections/elec-001/candidates", {
        searchParams: { status: "qualified" },
      })
    })

    it("passes pagination params as strings", async () => {
      mockJson.mockResolvedValue({ items: [], pagination: {} })

      await getCandidates("elec-001", { page: 3, page_size: 10 })

      expect(mockGet).toHaveBeenCalledWith("elections/elec-001/candidates", {
        searchParams: { page: "3", page_size: "10" },
      })
    })

    it("passes all params together", async () => {
      mockJson.mockResolvedValue({ items: [], pagination: {} })

      await getCandidates("elec-001", {
        status: "withdrawn",
        page: 2,
        page_size: 50,
      })

      expect(mockGet).toHaveBeenCalledWith("elections/elec-001/candidates", {
        searchParams: { status: "withdrawn", page: "2", page_size: "50" },
      })
    })

    it("omits undefined params", async () => {
      mockJson.mockResolvedValue({ items: [], pagination: {} })

      await getCandidates("elec-001", {})

      expect(mockGet).toHaveBeenCalledWith("elections/elec-001/candidates", {
        searchParams: {},
      })
    })
  })

  describe("getCandidateDetail", () => {
    it("calls GET candidates/{id}", async () => {
      const mockDetail = { id: "cand-001", full_name: "Jane Doe" }
      mockJson.mockResolvedValue(mockDetail)

      const result = await getCandidateDetail("cand-001")

      expect(mockGet).toHaveBeenCalledWith("candidates/cand-001")
      expect(result).toEqual(mockDetail)
    })
  })

  describe("createCandidate", () => {
    it("calls POST elections/{id}/candidates with JSON body", async () => {
      const data = {
        full_name: "Jane Doe",
        party: "Dem",
        filing_status: "qualified" as const,
        is_incumbent: false,
      }
      const mockResponse = { id: "cand-new", ...data }
      mockJson.mockResolvedValue(mockResponse)

      const result = await createCandidate("elec-001", data)

      expect(mockPost).toHaveBeenCalledWith(
        "elections/elec-001/candidates",
        { json: data },
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe("updateCandidate", () => {
    it("calls PATCH candidates/{id} with JSON body", async () => {
      const data = { full_name: "Jane M. Doe", party: "Rep" }
      const mockResponse = { id: "cand-001", ...data }
      mockJson.mockResolvedValue(mockResponse)

      const result = await updateCandidate("cand-001", data)

      expect(mockPatch).toHaveBeenCalledWith("candidates/cand-001", {
        json: data,
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe("deleteCandidate", () => {
    it("calls DELETE candidates/{id}", async () => {
      await deleteCandidate("cand-001")

      expect(mockDelete).toHaveBeenCalledWith("candidates/cand-001")
    })
  })

  describe("createCandidateLink", () => {
    it("calls POST candidates/{id}/links with JSON body", async () => {
      const data = {
        link_type: "campaign" as const,
        url: "https://example.com",
        label: "Campaign Site",
      }
      const mockResponse = { id: "link-new", ...data }
      mockJson.mockResolvedValue(mockResponse)

      const result = await createCandidateLink("cand-001", data)

      expect(mockPost).toHaveBeenCalledWith("candidates/cand-001/links", {
        json: data,
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe("deleteCandidateLink", () => {
    it("calls DELETE candidates/{id}/links/{linkId}", async () => {
      await deleteCandidateLink("cand-001", "link-001")

      expect(mockDelete).toHaveBeenCalledWith(
        "candidates/cand-001/links/link-001",
      )
    })
  })
})
