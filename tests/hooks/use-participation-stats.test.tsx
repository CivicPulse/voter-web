import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createTestQueryClient } from "@/test/render"
import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useParticipationStats } from "@/lib/hooks/use-participation-stats"
import { mockParticipationStats } from "@/test/mocks/elections"

vi.mock("@/lib/api/elections", () => ({
  getParticipationStats: vi.fn(),
}))

import { getParticipationStats } from "@/lib/api/elections"

const mockedGetStats = vi.mocked(getParticipationStats)

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

describe("useParticipationStats", () => {
  it("fetches participation stats for an election", async () => {
    const stats = mockParticipationStats()
    mockedGetStats.mockResolvedValue(stats)

    const { result } = renderHook(
      () => useParticipationStats("election-001"),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(stats)
    expect(mockedGetStats).toHaveBeenCalledWith("election-001")
  })

  it("returns loading state while fetching", () => {
    mockedGetStats.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(
      () => useParticipationStats("election-001"),
      { wrapper: createWrapper() },
    )

    expect(result.current.isLoading).toBe(true)
  })

  it("returns error state on failure", async () => {
    mockedGetStats.mockRejectedValue(new Error("API error"))

    const { result } = renderHook(
      () => useParticipationStats("election-001"),
      { wrapper: createWrapper() },
    )

    await waitFor(
      () => expect(result.current.isError).toBe(true),
      { timeout: 3000 },
    )
  })

  it("does not fetch when electionId is empty", () => {
    const { result } = renderHook(
      () => useParticipationStats(""),
      { wrapper: createWrapper() },
    )

    expect(result.current.fetchStatus).toBe("idle")
    expect(mockedGetStats).not.toHaveBeenCalled()
  })
})
