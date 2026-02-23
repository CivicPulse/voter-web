import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createTestQueryClient } from "@/test/render"
import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useVoterHistory } from "@/hooks/useVoters"
import { mockVoterHistory } from "@/test/mocks/voters"

vi.mock("@/api/voters", () => ({
  searchVoters: vi.fn(),
  getVoterDetail: vi.fn(),
  getVoterFilters: vi.fn(),
  triggerVoterGeocode: vi.fn(),
  deleteGeocodedLocation: vi.fn(),
  getVoterHistory: vi.fn(),
}))

import { getVoterHistory } from "@/api/voters"

const mockedGetVoterHistory = vi.mocked(getVoterHistory)

function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useVoterHistory", () => {
  it("fetches voter history when registration number is provided", async () => {
    const history = mockVoterHistory()
    mockedGetVoterHistory.mockResolvedValue(history)

    const { result } = renderHook(
      () => useVoterHistory("12345678"),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(history)
    expect(mockedGetVoterHistory).toHaveBeenCalledWith("12345678")
  })

  it("does not fetch when registration number is null", () => {
    const { result } = renderHook(
      () => useVoterHistory(null),
      { wrapper: createWrapper() },
    )

    expect(result.current.fetchStatus).toBe("idle")
    expect(mockedGetVoterHistory).not.toHaveBeenCalled()
  })

  it("returns loading state while fetching", () => {
    mockedGetVoterHistory.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(
      () => useVoterHistory("12345678"),
      { wrapper: createWrapper() },
    )

    expect(result.current.isLoading).toBe(true)
  })

  it("returns error state on failure", async () => {
    mockedGetVoterHistory.mockRejectedValue(new Error("Network error"))

    const { result } = renderHook(
      () => useVoterHistory("12345678"),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeDefined()
  })

  it("returns empty array when voter has no history", async () => {
    mockedGetVoterHistory.mockResolvedValue([])

    const { result } = renderHook(
      () => useVoterHistory("12345678"),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })
})
