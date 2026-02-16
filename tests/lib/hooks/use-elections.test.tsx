import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { useElections } from "@/lib/hooks/use-elections"
import { createTestQueryClient } from "@/test/render"
import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { mockPaginatedElectionList } from "@/test/mocks/elections"

vi.mock("@/lib/api/elections", () => ({
  getElections: vi.fn(),
}))

import { getElections } from "@/lib/api/elections"

const mockedGetElections = vi.mocked(getElections)

function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe("useElections", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches elections and groups them by date", async () => {
    const mockResponse = mockPaginatedElectionList()
    mockedGetElections.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useElections(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.events).toBeDefined()
    // 3 elections on 2 different dates: 2 on 2026-02-17, 1 on 2026-11-03
    expect(result.current.data?.events).toHaveLength(2)
    expect(result.current.data?.total).toBe(3)
  })

  it("passes filter params to the API", async () => {
    mockedGetElections.mockResolvedValueOnce(mockPaginatedElectionList())

    const filters = { status: "active" as const, election_type: "all" as const, date_from: null, date_to: null }
    renderHook(() => useElections(filters, 2, 10), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(mockedGetElections).toHaveBeenCalled())

    expect(mockedGetElections).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "active",
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
    // Reject all retries (hook retries up to 2 times)
    mockedGetElections.mockRejectedValue(new Error("Network error"))

    const { result } = renderHook(() => useElections(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    })
    expect(result.current.error).toBeDefined()
  })

  it("groups events sorted by date descending", async () => {
    const mockResponse = mockPaginatedElectionList()
    mockedGetElections.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useElections(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const events = result.current.data!.events
    // 2026-11-03 should come before 2026-02-17 (descending)
    expect(events[0].date).toBe("2026-11-03")
    expect(events[1].date).toBe("2026-02-17")
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
