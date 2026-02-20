import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook } from "@testing-library/react"
import { createTestQueryClient } from "@/test/render"
import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useDistrictDisambiguation } from "@/hooks/useDistrictDisambiguation"
import type { BoundaryFeatureCollection } from "@/types/boundary"

vi.mock("@/lib/static-geojson", () => ({
  fetchStaticGeoJSON: vi.fn().mockResolvedValue(null),
}))

vi.mock("@/api/client", () => ({
  api: {
    get: vi.fn(),
  },
}))

import { api } from "@/api/client"

const mockedApi = vi.mocked(api)

function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function makeBoundaryCollection(
  ...entries: Array<{
    id: string
    name: string
    boundaryType: string
    boundaryIdentifier: string
    county: string | null
  }>
): BoundaryFeatureCollection {
  return {
    type: "FeatureCollection",
    features: entries.map((entry) => ({
      type: "Feature" as const,
      id: entry.id,
      geometry: { type: "Polygon" as const, coordinates: [] },
      properties: {
        name: entry.name,
        boundary_type: entry.boundaryType,
        boundary_identifier: entry.boundaryIdentifier,
        source: "test",
        county: entry.county,
      },
    })),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useDistrictDisambiguation", () => {
  it("returns loading state when data is pending", () => {
    mockedApi.get.mockReturnValue({
      json: vi.fn().mockReturnValue(new Promise(() => {})),
    } as unknown as ReturnType<typeof api.get>)

    const { result } = renderHook(
      () => useDistrictDisambiguation("county-commission", "005"),
      { wrapper: createWrapper() },
    )

    expect(result.current.isLoading).toBe(true)
    expect(result.current.matches).toEqual([])
  })

  it("returns single match with fully-qualified URL", async () => {
    const data = makeBoundaryCollection({
      id: "uuid-bibb-005",
      name: "005",
      boundaryType: "county_commission",
      boundaryIdentifier: "13CC005",
      county: "Bibb",
    })

    mockedApi.get.mockReturnValue({
      json: vi.fn().mockResolvedValue(data),
    } as unknown as ReturnType<typeof api.get>)

    const { result } = renderHook(
      () => useDistrictDisambiguation("county-commission", "005"),
      { wrapper: createWrapper() },
    )

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isSingleMatch).toBe(true)
    expect(result.current.matches).toHaveLength(1)
    expect(result.current.matches[0]).toEqual({
      districtId: "uuid-bibb-005",
      name: "005",
      boundaryType: "county_commission",
      county: "Bibb",
      stateAbbrev: "ga",
      fullyQualifiedUrl: "/districts/ga/bibb/county-commission/005",
    })
  })

  it("returns multiple matches for colliding district names", async () => {
    const data = makeBoundaryCollection(
      {
        id: "uuid-bibb-005",
        name: "005",
        boundaryType: "county_commission",
        boundaryIdentifier: "13CC005",
        county: "Bibb",
      },
      {
        id: "uuid-houston-005",
        name: "005",
        boundaryType: "county_commission",
        boundaryIdentifier: "13CC005H",
        county: "Houston",
      },
    )

    mockedApi.get.mockReturnValue({
      json: vi.fn().mockResolvedValue(data),
    } as unknown as ReturnType<typeof api.get>)

    const { result } = renderHook(
      () => useDistrictDisambiguation("county-commission", "005"),
      { wrapper: createWrapper() },
    )

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isSingleMatch).toBe(false)
    expect(result.current.matches).toHaveLength(2)
    expect(result.current.matches[0].fullyQualifiedUrl).toBe(
      "/districts/ga/bibb/county-commission/005",
    )
    expect(result.current.matches[1].fullyQualifiedUrl).toBe(
      "/districts/ga/houston/county-commission/005",
    )
  })

  it("returns zero matches for non-existent district", async () => {
    const data = makeBoundaryCollection({
      id: "uuid-bibb-005",
      name: "005",
      boundaryType: "county_commission",
      boundaryIdentifier: "13CC005",
      county: "Bibb",
    })

    mockedApi.get.mockReturnValue({
      json: vi.fn().mockResolvedValue(data),
    } as unknown as ReturnType<typeof api.get>)

    const { result } = renderHook(
      () => useDistrictDisambiguation("county-commission", "999"),
      { wrapper: createWrapper() },
    )

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.matches).toHaveLength(0)
    expect(result.current.isSingleMatch).toBe(false)
  })

  it("generates state-level URL for district without county", async () => {
    const data = makeBoundaryCollection({
      id: "uuid-senate-18",
      name: "018",
      boundaryType: "state_senate",
      boundaryIdentifier: "13SS018",
      county: null,
    })

    mockedApi.get.mockReturnValue({
      json: vi.fn().mockResolvedValue(data),
    } as unknown as ReturnType<typeof api.get>)

    const { result } = renderHook(
      () => useDistrictDisambiguation("state-senate", "018"),
      { wrapper: createWrapper() },
    )

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.matches[0].fullyQualifiedUrl).toBe(
      "/districts/ga/state-senate/018",
    )
    expect(result.current.matches[0].county).toBeNull()
  })

  it("returns empty when disabled (empty params)", () => {
    const { result } = renderHook(
      () => useDistrictDisambiguation("", ""),
      { wrapper: createWrapper() },
    )

    expect(result.current.isLoading).toBe(false)
    expect(result.current.matches).toEqual([])
  })
})
