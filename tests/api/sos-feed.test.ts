import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  isSosUrl,
  fetchSosFeed,
  detectElectionType,
  extractDistrict,
  extractAutoFillData,
} from "@/api/sos-feed"
import {
  mockSosFeedResponse,
  mockSosFeedBallotItem,
  mockSosFeedResults,
  mockMultiContestSosFeedResponse,
} from "@/test/mocks/sos-feed"

// ============================================================================
// isSosUrl
// ============================================================================

describe("isSosUrl", () => {
  it("accepts valid HTTPS SOS JSON URLs", () => {
    expect(
      isSosUrl(
        "https://results.sos.ga.gov/cdn/results/Georgia/export-January20SpecialElection.json",
      ),
    ).toBe(true)
  })

  it("accepts SOS URLs with various path structures", () => {
    expect(
      isSosUrl(
        "https://results.sos.ga.gov/cdn/results/Georgia/export-Jan6HD23SERunoff.json",
      ),
    ).toBe(true)
    expect(
      isSosUrl(
        "https://results.sos.ga.gov/cdn/results/Georgia/export-MunicipalGeneralSpecialElectionPSC11042025.json",
      ),
    ).toBe(true)
  })

  it("rejects HTTP URLs (must be HTTPS)", () => {
    expect(
      isSosUrl(
        "http://results.sos.ga.gov/cdn/results/Georgia/export-test.json",
      ),
    ).toBe(false)
  })

  it("rejects non-SOS domains", () => {
    expect(isSosUrl("https://example.com/data.json")).toBe(false)
    expect(isSosUrl("https://sos.ga.gov/results.json")).toBe(false)
  })

  it("rejects URLs without .json extension", () => {
    expect(
      isSosUrl("https://results.sos.ga.gov/cdn/results/Georgia/export-test"),
    ).toBe(false)
    expect(
      isSosUrl(
        "https://results.sos.ga.gov/cdn/results/Georgia/export-test.xml",
      ),
    ).toBe(false)
  })

  it("normalizes path traversal (URL constructor resolves ..)", () => {
    // The URL constructor normalizes "../" so this resolves to a valid SOS URL
    expect(
      isSosUrl("https://results.sos.ga.gov/../internal/data.json"),
    ).toBe(true)
  })

  it("rejects invalid URLs", () => {
    expect(isSosUrl("not-a-url")).toBe(false)
    expect(isSosUrl("")).toBe(false)
  })
})

// ============================================================================
// fetchSosFeed
// ============================================================================

describe("fetchSosFeed", () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal("fetch", mockFetch)
  })

  it("returns parsed feed data on success", async () => {
    const feed = mockSosFeedResponse()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(feed),
    })

    const result = await fetchSosFeed(
      "https://results.sos.ga.gov/cdn/results/Georgia/export-test.json",
    )

    expect(result).toEqual(feed)
    expect(mockFetch).toHaveBeenCalledWith(
      "https://results.sos.ga.gov/cdn/results/Georgia/export-test.json",
      expect.objectContaining({ redirect: "error" }),
    )
  })

  it("passes abort signal to fetch", async () => {
    const feed = mockSosFeedResponse()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(feed),
    })

    const controller = new AbortController()
    await fetchSosFeed(
      "https://results.sos.ga.gov/cdn/results/Georgia/export-test.json",
      controller.signal,
    )

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal }),
    )
  })

  it("throws on non-200 response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    })

    await expect(
      fetchSosFeed(
        "https://results.sos.ga.gov/cdn/results/Georgia/export-test.json",
      ),
    ).rejects.toThrow("SOS feed request failed: 404 Not Found")
  })

  it("throws on missing electionName", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve(
          mockSosFeedResponse({ electionName: null }),
        ),
    })

    await expect(
      fetchSosFeed(
        "https://results.sos.ga.gov/cdn/results/Georgia/export-test.json",
      ),
    ).rejects.toThrow("Invalid SOS feed: missing required fields")
  })

  it("throws on missing electionDate", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve(
          mockSosFeedResponse({ electionDate: null }),
        ),
    })

    await expect(
      fetchSosFeed(
        "https://results.sos.ga.gov/cdn/results/Georgia/export-test.json",
      ),
    ).rejects.toThrow("Invalid SOS feed: missing required fields")
  })

  it("throws on missing results", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve(mockSosFeedResponse({ results: null })),
    })

    await expect(
      fetchSosFeed(
        "https://results.sos.ga.gov/cdn/results/Georgia/export-test.json",
      ),
    ).rejects.toThrow("Invalid SOS feed: missing required fields")
  })
})

// ============================================================================
// detectElectionType
// ============================================================================

describe("detectElectionType", () => {
  it('detects "special" elections', () => {
    expect(
      detectElectionType("January 20, 2026 - Special Election"),
    ).toBe("special")
  })

  it('detects "runoff" elections', () => {
    expect(
      detectElectionType("January 6, 2026 – HD 23 Runoff"),
    ).toBe("runoff")
  })

  it('detects "primary" elections', () => {
    expect(detectElectionType("May 2026 Primary")).toBe("primary")
  })

  it('detects "general" elections', () => {
    expect(detectElectionType("November 2026 - General Election")).toBe(
      "general",
    )
  })

  it('classifies "special runoff" as runoff', () => {
    expect(
      detectElectionType("Special Election Runoff - HD 23"),
    ).toBe("runoff")
  })

  it("is case insensitive", () => {
    expect(detectElectionType("SPECIAL ELECTION")).toBe("special")
    expect(detectElectionType("general election")).toBe("general")
  })

  it("returns null when no type is detected", () => {
    expect(detectElectionType("Municipal Election 2026")).toBeNull()
    expect(detectElectionType("")).toBeNull()
  })
})

// ============================================================================
// extractDistrict
// ============================================================================

describe("extractDistrict", () => {
  it("returns ballot item name for single-contest elections", () => {
    const feed = mockSosFeedResponse()
    expect(extractDistrict(feed)).toBe("State Senate - District 18")
  })

  it("returns election name for multi-contest elections", () => {
    const feed = mockMultiContestSosFeedResponse()
    expect(extractDistrict(feed)).toBe("November 2026 - General Election")
  })

  it("returns election name when ballotItems is empty", () => {
    const feed = mockSosFeedResponse({
      results: mockSosFeedResults({ ballotItems: [] }),
    })
    expect(extractDistrict(feed)).toBe(
      "January 20, 2026 - Special Election",
    )
  })

  it("returns election name when ballotItems is null", () => {
    const feed = mockSosFeedResponse({
      results: mockSosFeedResults({ ballotItems: null }),
    })
    expect(extractDistrict(feed)).toBe(
      "January 20, 2026 - Special Election",
    )
  })

  it("returns empty string when both ballotItems and electionName are null", () => {
    const feed = mockSosFeedResponse({
      electionName: null,
      results: mockSosFeedResults({ ballotItems: [] }),
    })
    expect(extractDistrict(feed)).toBe("")
  })

  it("filters out ballot items with null names", () => {
    const feed = mockSosFeedResponse({
      results: mockSosFeedResults({
        ballotItems: [
          mockSosFeedBallotItem({ name: null }),
          mockSosFeedBallotItem({ name: "State Senate - District 18" }),
        ],
      }),
    })
    expect(extractDistrict(feed)).toBe("State Senate - District 18")
  })

  it("returns election name when results is null", () => {
    const feed = mockSosFeedResponse({ results: null })
    expect(extractDistrict(feed)).toBe(
      "January 20, 2026 - Special Election",
    )
  })
})

// ============================================================================
// extractAutoFillData
// ============================================================================

describe("extractAutoFillData", () => {
  it("extracts all fields from a valid feed", () => {
    const feed = mockSosFeedResponse()
    const result = extractAutoFillData(feed)

    expect(result).toEqual({
      name: "January 20, 2026 - Special Election",
      election_date: "2026-01-20",
      election_type: "special",
      district: "State Senate - District 18",
    })
  })

  it("returns null election_type when type cannot be detected", () => {
    const feed = mockSosFeedResponse({
      electionName: "Municipal Election PSC 2025",
    })
    const result = extractAutoFillData(feed)

    expect(result.election_type).toBeNull()
  })

  it("handles feed with null electionName", () => {
    const feed = mockSosFeedResponse({ electionName: null })
    const result = extractAutoFillData(feed)

    expect(result.name).toBe("")
    expect(result.election_type).toBeNull()
  })

  it("handles multi-contest election", () => {
    const feed = mockMultiContestSosFeedResponse()
    const result = extractAutoFillData(feed)

    expect(result).toEqual({
      name: "November 2026 - General Election",
      election_date: "2026-11-03",
      election_type: "general",
      district: "November 2026 - General Election",
    })
  })

  it("trims whitespace from extracted values", () => {
    const feed = mockSosFeedResponse({
      electionName: "  Special Election  ",
      electionDate: " 2026-01-20 ",
    })
    const result = extractAutoFillData(feed)

    expect(result.name).toBe("Special Election")
    expect(result.election_date).toBe("2026-01-20")
  })
})
