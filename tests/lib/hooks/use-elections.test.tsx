import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { useElections } from "@/lib/hooks/use-elections"
import { createWrapper } from "@/test/render"
import { mockPaginatedElectionList } from "@/test/mocks/elections"

vi.mock("@/lib/api/elections", () => ({
  getElections: vi.fn(),
}))

import { getElections } from "@/lib/api/elections"

const mockedGetElections = vi.mocked(getElections)

describe("useElections", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches a flat list of elections", async () => {
    const mockResponse = mockPaginatedElectionList()
    mockedGetElections.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useElections(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.elections).toBeDefined()
    expect(result.current.data?.elections).toHaveLength(3)
    expect(result.current.data?.total).toBe(3)
  })

  it("defaults to page_size=25", async () => {
    mockedGetElections.mockResolvedValueOnce(mockPaginatedElectionList())

    renderHook(() => useElections(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(mockedGetElections).toHaveBeenCalled())

    expect(mockedGetElections).toHaveBeenCalledWith(
      expect.objectContaining({
        page_size: 25,
      }),
    )
  })

  it("passes filter params to the API", async () => {
    mockedGetElections.mockResolvedValueOnce(mockPaginatedElectionList())

    const filters = {
      status: "active" as const,
      election_type: "all" as const,
      date_from: null,
      date_to: null,
      registration_open: true,
      early_voting_active: true,
    }
    renderHook(() => useElections(filters, 2, 10), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(mockedGetElections).toHaveBeenCalled())

    expect(mockedGetElections).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "active",
        registration_open: true,
        early_voting_active: true,
        page: 2,
        page_size: 10,
      }),
    )
  })

  it("returns loading state initially", () => {
    mockedGetElections.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useElections(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it("returns error state on failure", async () => {
    mockedGetElections.mockRejectedValue(new Error("Network error"))

    const { result } = renderHook(() => useElections(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    })
    expect(result.current.error).toBeDefined()
  })

  it("sorts elections by date descending, then name ascending", async () => {
    const mockResponse = mockPaginatedElectionList()
    mockedGetElections.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useElections(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const elections = result.current.data!.elections
    // 2026-11-03 should come before 2026-02-17 (date descending)
    expect(elections[0].election_date).toBe("2026-11-03")
    // Same-date elections sorted by name ascending
    expect(elections[1].name).toBe("State House District 145")
    expect(elections[2].name).toBe("State Senate District 18 Special")
  })

  it("preserves pagination metadata in response", async () => {
    const mockResponse = mockPaginatedElectionList({
      total: 50,
      page: 3,
      page_size: 10,
      total_pages: 5,
    })
    mockedGetElections.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useElections(undefined, 3, 10), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.total).toBe(50)
    expect(result.current.data?.page).toBe(3)
    expect(result.current.data?.total_pages).toBe(5)
  })
})
