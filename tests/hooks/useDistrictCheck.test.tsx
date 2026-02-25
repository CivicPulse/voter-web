import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createTestQueryClient } from "@/test/render"
import { QueryClientProvider } from "@tanstack/react-query"
import type { DistrictCheckResponse } from "@/types/voter"

const mockGetDistrictCheck = vi.fn()

vi.mock("@/api/voters", () => ({
  getDistrictCheck: (...args: unknown[]) => mockGetDistrictCheck(...args),
}))

import { useDistrictCheck } from "@/hooks/useDistrictCheck"

function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

const mockResponse: DistrictCheckResponse = {
  voter_id: "v-001",
  match_status: "match",
  geocoded_point: { latitude: 32.84, longitude: -83.63 },
  registered_boundaries: { congressional: "5" },
  determined_boundaries: { congressional: "5" },
  comparisons: [
    {
      boundary_type: "congressional",
      registered_value: "5",
      determined_value: "5",
      status: "match",
    },
  ],
  mismatch_count: 0,
  checked_at: "2026-02-25T10:00:00Z",
}

describe("useDistrictCheck", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches district check and adapts to verification result", async () => {
    mockGetDistrictCheck.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useDistrictCheck("v-001"), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.districtCheck).toBeDefined()
    })

    expect(mockGetDistrictCheck).toHaveBeenCalledWith("v-001")
    expect(result.current.districtCheck?.match_status).toBe("match")
    expect(result.current.verification).toBeDefined()
    expect(result.current.verification?.matchCount).toBe(1)
    expect(result.current.verification?.mismatchCount).toBe(0)
  })

  it("does not fetch when voterId is null", () => {
    renderHook(() => useDistrictCheck(null), {
      wrapper: createWrapper(),
    })

    expect(mockGetDistrictCheck).not.toHaveBeenCalled()
  })

  it("returns null verification when no data", () => {
    const { result } = renderHook(() => useDistrictCheck(null), {
      wrapper: createWrapper(),
    })

    expect(result.current.verification).toBeNull()
    expect(result.current.districtCheck).toBeUndefined()
  })
})
