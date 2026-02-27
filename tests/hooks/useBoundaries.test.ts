import { describe, it, expect, vi, beforeEach } from "vitest"
import { waitFor } from "@testing-library/react"
import { renderHook } from "@/test/render"
import { useBoundaryDetail } from "@/hooks/useBoundaries"
import type { BoundaryDetailResponse } from "@/types/boundary"

// Mock the boundaries API module
vi.mock("@/lib/api/boundaries", () => ({
  getBoundaryDetail: vi.fn(),
}))

import { getBoundaryDetail } from "@/lib/api/boundaries"

const mockBoundaryDetail: BoundaryDetailResponse = {
  id: "abc-123",
  name: "Congressional District 2",
  boundary_type: "congressional",
  boundary_identifier: "13002",
  source: "census",
  county: null,
  effective_date: null,
  created_at: "2024-01-01T00:00:00Z",
  geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] },
  properties: null,
  county_metadata: null,
  precinct_metadata: null,
  voter_stats: null,
}

describe("useBoundaryDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns data when id is non-null", async () => {
    vi.mocked(getBoundaryDetail).mockResolvedValue(mockBoundaryDetail)

    const { result } = renderHook(() => useBoundaryDetail("abc-123"))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockBoundaryDetail)
    expect(getBoundaryDetail).toHaveBeenCalledWith("abc-123")
  })

  it("returns undefined and does not fetch when id is null (enabled: false)", () => {
    const { result } = renderHook(() => useBoundaryDetail(null))

    expect(result.current.data).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
    expect(getBoundaryDetail).not.toHaveBeenCalled()
  })

  it("uses correct query key ['boundaries', id]", async () => {
    vi.mocked(getBoundaryDetail).mockResolvedValue(mockBoundaryDetail)

    const { result } = renderHook(() => useBoundaryDetail("xyz-456"))

    await waitFor(() => {
      expect(result.current.data).toBeDefined()
    })

    expect(getBoundaryDetail).toHaveBeenCalledWith("xyz-456")
  })

  it("does not call API when switching from non-null to null id", async () => {
    vi.mocked(getBoundaryDetail).mockResolvedValue(mockBoundaryDetail)

    const { result, rerender } = renderHook(
      ({ id }: { id: string | null }) => useBoundaryDetail(id),
      { initialProps: { id: "abc-123" } },
    )

    await waitFor(() => {
      expect(result.current.data).toBeDefined()
    })

    expect(getBoundaryDetail).toHaveBeenCalledTimes(1)

    rerender({ id: null })

    // After switching to null, the query is disabled — no additional calls
    expect(getBoundaryDetail).toHaveBeenCalledTimes(1)
    expect(result.current.isLoading).toBe(false)
  })

  it("returns error when API call fails", async () => {
    const error = new Error("Network error")
    vi.mocked(getBoundaryDetail).mockRejectedValue(error)

    const { result } = renderHook(() => useBoundaryDetail("bad-id"))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.data).toBeUndefined()
  })
})
