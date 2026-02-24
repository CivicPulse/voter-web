import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { useCountyDistrictOptions } from "@/lib/hooks/use-county-district-options"
import { createTestQueryClient } from "@/test/render"
import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"

const mockJson = vi.fn()
const mockGet = vi.fn(() => ({ json: mockJson }))

vi.mock("@/api/client", () => ({
  publicApi: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}))

function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe("useCountyDistrictOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("is disabled when county is null", () => {
    const { result } = renderHook(
      () => useCountyDistrictOptions("county_precinct", null),
      { wrapper: createWrapper() },
    )

    expect(result.current.isFetching).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(mockGet).not.toHaveBeenCalled()
  })

  it("fetches precinct options and extracts precinct_id", async () => {
    mockJson.mockResolvedValue({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [] },
          properties: {
            name: "BIBB 1",
            boundary_type: "county_precinct",
            boundary_identifier: "bibb-BI1",
            source: "census-tiger",
            county: "Bibb",
            precinct_id: "BI1",
            precinct_name: "BIBB 1",
          },
        },
        {
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [] },
          properties: {
            name: "BIBB 2",
            boundary_type: "county_precinct",
            boundary_identifier: "bibb-BI2",
            source: "census-tiger",
            county: "Bibb",
            precinct_id: "BI2",
            precinct_name: "BIBB 2",
          },
        },
      ],
    })

    const { result } = renderHook(
      () => useCountyDistrictOptions("county_precinct", "Bibb"),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockGet).toHaveBeenCalledWith("boundaries/geojson", {
      searchParams: { boundary_type: "county_precinct", county: "Bibb" },
    })
    expect(result.current.data).toEqual([
      { value: "BI1", label: "BIBB 1" },
      { value: "BI2", label: "BIBB 2" },
    ])
  })

  it("fetches commission options and strips leading zeros from boundary_identifier", async () => {
    mockJson.mockResolvedValue({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [] },
          properties: {
            name: "Commission District 1",
            boundary_type: "county_commission",
            boundary_identifier: "001",
            source: "census-tiger",
            county: "Bibb",
          },
        },
        {
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [] },
          properties: {
            name: "Commission District 5",
            boundary_type: "county_commission",
            boundary_identifier: "005",
            source: "census-tiger",
            county: "Bibb",
          },
        },
      ],
    })

    const { result } = renderHook(
      () => useCountyDistrictOptions("county_commission", "Bibb"),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockGet).toHaveBeenCalledWith("boundaries/geojson", {
      searchParams: { boundary_type: "county_commission", county: "Bibb" },
    })
    expect(result.current.data).toEqual([
      { value: "1", label: "Commission District 1" },
      { value: "5", label: "Commission District 5" },
    ])
  })

  it("deduplicates features with same identifier", async () => {
    mockJson.mockResolvedValue({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [] },
          properties: {
            name: "BIBB 1",
            boundary_type: "county_precinct",
            boundary_identifier: "bibb-BI1",
            source: "census-tiger",
            county: "Bibb",
            precinct_id: "BI1",
            precinct_name: "BIBB 1",
          },
        },
        {
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [] },
          properties: {
            name: "BIBB 1 (alt)",
            boundary_type: "county_precinct",
            boundary_identifier: "bibb-BI1",
            source: "census-tiger",
            county: "Bibb",
            precinct_id: "BI1",
            precinct_name: "BIBB 1 (alt)",
          },
        },
      ],
    })

    const { result } = renderHook(
      () => useCountyDistrictOptions("county_precinct", "Bibb"),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
  })

  it("strips County suffix from county name", async () => {
    mockJson.mockResolvedValue({
      type: "FeatureCollection",
      features: [],
    })

    const { result } = renderHook(
      () => useCountyDistrictOptions("county_precinct", "Bibb County"),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockGet).toHaveBeenCalledWith("boundaries/geojson", {
      searchParams: { boundary_type: "county_precinct", county: "Bibb" },
    })
    expect(result.current.data).toEqual([])
  })

  it("returns sorted options with stripped leading zeros", async () => {
    mockJson.mockResolvedValue({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [] },
          properties: {
            name: "School Board 3",
            boundary_type: "school_board",
            boundary_identifier: "003",
            source: "census-tiger",
            county: "Bibb",
          },
        },
        {
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [] },
          properties: {
            name: "School Board 1",
            boundary_type: "school_board",
            boundary_identifier: "001",
            source: "census-tiger",
            county: "Bibb",
          },
        },
      ],
    })

    const { result } = renderHook(
      () => useCountyDistrictOptions("school_board", "Bibb"),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([
      { value: "1", label: "School Board 1" },
      { value: "3", label: "School Board 3" },
    ])
  })
})
