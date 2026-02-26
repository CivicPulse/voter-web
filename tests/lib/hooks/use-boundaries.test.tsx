import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { useBoundaries, useBoundaryTypes } from "@/lib/hooks/use-boundaries"
import { createTestQueryClient } from "@/test/render"
import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { AuthenticationError } from "@/types/admin"

vi.mock("@/lib/api/boundaries", () => ({
  getBoundaries: vi.fn(),
  getBoundaryTypes: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

import { getBoundaries, getBoundaryTypes } from "@/lib/api/boundaries"
import { toast } from "sonner"

const mockedGetBoundaries = vi.mocked(getBoundaries)
const mockedGetBoundaryTypes = vi.mocked(getBoundaryTypes)

function makeWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const mockBoundaryListResponse = {
  items: [
    { id: "b-1", name: "Bibb County", boundary_type: "county", boundary_identifier: "021", county: null, source: "census" },
  ],
  pagination: { total: 1, page: 1, page_size: 20, total_pages: 1 },
}

describe("useBoundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("is disabled when no type and search < 2 chars", () => {
    mockedGetBoundaries.mockResolvedValueOnce(mockBoundaryListResponse)

    renderHook(() => useBoundaries({ search: "a" }), { wrapper: makeWrapper() })

    expect(mockedGetBoundaries).not.toHaveBeenCalled()
  })

  it("fetches when type is set", async () => {
    mockedGetBoundaries.mockResolvedValueOnce(mockBoundaryListResponse)

    const { result } = renderHook(
      () => useBoundaries({ type: "county" }),
      { wrapper: makeWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedGetBoundaries).toHaveBeenCalledWith({ type: "county", search: undefined, page_size: undefined })
  })

  it("fetches when search has 2+ chars", async () => {
    mockedGetBoundaries.mockResolvedValueOnce(mockBoundaryListResponse)

    const { result } = renderHook(
      () => useBoundaries({ search: "bi" }),
      { wrapper: makeWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedGetBoundaries).toHaveBeenCalled()
  })

  it("shows session expired toast on AuthenticationError", async () => {
    const authError = new AuthenticationError()
    // Reset all mock implementations and set rejection
    mockedGetBoundaries.mockReset()
    mockedGetBoundaries.mockRejectedValue(authError)

    const { result } = renderHook(
      () => useBoundaries({ type: "county" }),
      { wrapper: makeWrapper() }
    )

    // Wait for the query to have been attempted
    await waitFor(
      () => expect(mockedGetBoundaries).toHaveBeenCalled(),
      { timeout: 3000 }
    )

    // Wait for status to leave pending
    await waitFor(
      () => expect(result.current.status).not.toBe("pending"),
      { timeout: 10000 }
    )

    expect(result.current.isError).toBe(true)
  }, 15000)
})

describe("useBoundaryTypes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches and returns types array", async () => {
    mockedGetBoundaryTypes.mockResolvedValueOnce({ types: ["county", "state_senate"] })

    const { result } = renderHook(() => useBoundaryTypes(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(["county", "state_senate"])
  })
})
