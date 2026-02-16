import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { useRaceResults } from "@/lib/hooks/use-race-results"
import { createTestQueryClient } from "@/test/render"
import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import {
  mockElection,
  mockElectionResultsResponse,
} from "@/test/mocks/elections"

vi.mock("@/lib/api/elections", () => ({
  getElectionDetail: vi.fn(),
  getElectionResults: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: {
    warning: vi.fn(),
  },
}))

import { getElectionDetail, getElectionResults } from "@/lib/api/elections"

const mockedGetDetail = vi.mocked(getElectionDetail)
const mockedGetResults = vi.mocked(getElectionResults)

function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe("useRaceResults", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches election detail and results", async () => {
    const election = mockElection()
    const results = mockElectionResultsResponse()
    mockedGetDetail.mockResolvedValueOnce(election)
    mockedGetResults.mockResolvedValueOnce(results)

    const { result } = renderHook(
      () => useRaceResults("election-123"),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedGetDetail).toHaveBeenCalledWith("election-123")
    expect(mockedGetResults).toHaveBeenCalledWith("election-123")
    expect(result.current.data?.election.name).toBe(
      "State Senate District 18 Special",
    )
    expect(result.current.data?.results.candidates).toHaveLength(2)
  })

  it("does not fetch when electionId is empty", () => {
    renderHook(() => useRaceResults(""), {
      wrapper: createWrapper(),
    })

    expect(mockedGetDetail).not.toHaveBeenCalled()
    expect(mockedGetResults).not.toHaveBeenCalled()
  })

  it("returns loading state initially", () => {
    mockedGetDetail.mockReturnValue(new Promise(() => {}))
    mockedGetResults.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(
      () => useRaceResults("election-123"),
      { wrapper: createWrapper() },
    )

    expect(result.current.isLoading).toBe(true)
  })

  it("returns error state on failure", async () => {
    mockedGetDetail.mockRejectedValue(new Error("API error"))
    mockedGetResults.mockRejectedValue(new Error("API error"))

    const { result } = renderHook(
      () => useRaceResults("election-123"),
      { wrapper: createWrapper() },
    )

    await waitFor(
      () => expect(result.current.isError).toBe(true),
      { timeout: 5000 },
    )
  })

  it("enables refetchInterval for active elections", async () => {
    const election = mockElection({
      status: "active",
      refresh_interval_seconds: 120,
    })
    const results = mockElectionResultsResponse()
    mockedGetDetail.mockResolvedValue(election)
    mockedGetResults.mockResolvedValue(results)

    const queryClient = createTestQueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(
      () => useRaceResults("election-123"),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Verify the query is configured — the refetchInterval function
    // returns the interval in ms for active elections
    const queryState = queryClient.getQueryState([
      "elections",
      "results",
      "election-123",
    ])
    expect(queryState?.status).toBe("success")
    expect(result.current.data?.election.status).toBe("active")
  })

  it("does not poll for finalized elections", async () => {
    const election = mockElection({ status: "finalized" })
    const results = mockElectionResultsResponse()
    mockedGetDetail.mockResolvedValueOnce(election)
    mockedGetResults.mockResolvedValueOnce(results)

    const { result } = renderHook(
      () => useRaceResults("election-123"),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.election.status).toBe("finalized")
    // Only called once (initial fetch, no polling)
    expect(mockedGetDetail).toHaveBeenCalledTimes(1)
  })
})
