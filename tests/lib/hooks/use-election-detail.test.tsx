import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { useElectionDetail } from "@/lib/hooks/use-election-detail"
import { createTestQueryClient } from "@/test/render"
import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { mockElection, mockPaginatedElectionList } from "@/test/mocks/elections"

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

describe("useElectionDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches races for a specific date using date_from/date_to", async () => {
    const races = [
      mockElection({ id: "a", election_date: "2026-02-17" }),
      mockElection({ id: "b", election_date: "2026-02-17" }),
    ]
    mockedGetElections.mockResolvedValueOnce(
      mockPaginatedElectionList({ elections: races, total: 2 }),
    )

    const { result } = renderHook(() => useElectionDetail("2026-02-17"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedGetElections).toHaveBeenCalledWith(
      expect.objectContaining({
        date_from: "2026-02-17",
        date_to: "2026-02-17",
        page_size: 100,
      }),
    )
    expect(result.current.data).toHaveLength(2)
  })

  it("returns elections array directly (not paginated wrapper)", async () => {
    const races = [mockElection({ election_date: "2026-02-17" })]
    mockedGetElections.mockResolvedValueOnce(
      mockPaginatedElectionList({ elections: races }),
    )

    const { result } = renderHook(() => useElectionDetail("2026-02-17"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Should be an array of Election, not PaginatedElectionListResponse
    expect(Array.isArray(result.current.data)).toBe(true)
    expect(result.current.data![0]).toHaveProperty("id")
    expect(result.current.data![0]).toHaveProperty("election_date")
  })

  it("does not fetch when electionDate is empty", () => {
    renderHook(() => useElectionDetail(""), {
      wrapper: createWrapper(),
    })

    expect(mockedGetElections).not.toHaveBeenCalled()
  })

  it("returns loading state initially", () => {
    mockedGetElections.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useElectionDetail("2026-02-17"), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
  })

  it("handles API errors", async () => {
    // Reject all retries (hook retries up to 2 times)
    mockedGetElections.mockRejectedValue(new Error("Server error"))

    const { result } = renderHook(() => useElectionDetail("2026-02-17"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    })
    expect(result.current.error).toBeDefined()
  })
})
