import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import {
  useCountyResultsGeoJSON,
  usePrecinctResultsGeoJSON,
} from "@/lib/hooks/use-race-geojson"
import { createTestQueryClient } from "@/test/render"
import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { mockCountyGeoJSON, mockPrecinctGeoJSON } from "@/test/mocks/elections"

vi.mock("@/lib/api/elections", () => ({
  getElectionGeoJSON: vi.fn(),
  getPrecinctGeoJSON: vi.fn(),
}))

import { getElectionGeoJSON, getPrecinctGeoJSON } from "@/lib/api/elections"

const mockedGetGeoJSON = vi.mocked(getElectionGeoJSON)
const mockedGetPrecinctGeoJSON = vi.mocked(getPrecinctGeoJSON)

function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe("useCountyResultsGeoJSON", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches county GeoJSON for an election", async () => {
    const mockGeo = mockCountyGeoJSON()
    mockedGetGeoJSON.mockResolvedValueOnce(mockGeo)

    const { result } = renderHook(
      () => useCountyResultsGeoJSON("election-123"),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedGetGeoJSON).toHaveBeenCalledWith("election-123")
    expect(result.current.data?.type).toBe("FeatureCollection")
    expect(result.current.data?.features).toHaveLength(1)
  })

  it("does not fetch when electionId is empty", () => {
    renderHook(() => useCountyResultsGeoJSON(""), {
      wrapper: createWrapper(),
    })

    expect(mockedGetGeoJSON).not.toHaveBeenCalled()
  })

  it("returns loading state initially", () => {
    mockedGetGeoJSON.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(
      () => useCountyResultsGeoJSON("election-123"),
      { wrapper: createWrapper() },
    )

    expect(result.current.isLoading).toBe(true)
  })
})

describe("usePrecinctResultsGeoJSON", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches precinct GeoJSON for an election", async () => {
    const mockGeo = mockPrecinctGeoJSON()
    mockedGetPrecinctGeoJSON.mockResolvedValueOnce(mockGeo)

    const { result } = renderHook(
      () => usePrecinctResultsGeoJSON("election-123"),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedGetPrecinctGeoJSON).toHaveBeenCalledWith(
      "election-123",
      undefined,
    )
    expect(result.current.data?.type).toBe("FeatureCollection")
    expect(result.current.data?.features).toHaveLength(1)
  })

  it("passes county filter to API", async () => {
    const mockGeo = mockPrecinctGeoJSON()
    mockedGetPrecinctGeoJSON.mockResolvedValueOnce(mockGeo)

    const { result } = renderHook(
      () => usePrecinctResultsGeoJSON("election-123", "Bibb County"),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedGetPrecinctGeoJSON).toHaveBeenCalledWith(
      "election-123",
      "Bibb County",
    )
  })

  it("does not fetch when electionId is empty", () => {
    renderHook(() => usePrecinctResultsGeoJSON(""), {
      wrapper: createWrapper(),
    })

    expect(mockedGetPrecinctGeoJSON).not.toHaveBeenCalled()
  })

  it("returns loading state initially", () => {
    mockedGetPrecinctGeoJSON.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(
      () => usePrecinctResultsGeoJSON("election-123"),
      { wrapper: createWrapper() },
    )

    expect(result.current.isLoading).toBe(true)
  })
})
