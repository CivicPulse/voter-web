import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook } from "@testing-library/react"
import { createTestQueryClient } from "@/test/render"
import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useDistrictSlugResolverScoped } from "@/hooks/useDistrictSlugResolverScoped"
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

describe("useDistrictSlugResolverScoped", () => {
  it("returns disabled state when params are empty", () => {
    const { result } = renderHook(
      () => useDistrictSlugResolverScoped("", null, "", ""),
      { wrapper: createWrapper() },
    )

    expect(result.current.districtId).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isNotFound).toBe(false)
  })

  it("resolves state-level district by state and name", async () => {
    const data = makeBoundaryCollection(
      {
        id: "uuid-senate-18",
        name: "018",
        boundaryType: "state_senate",
        boundaryIdentifier: "018",
        county: null,
      },
      {
        id: "uuid-senate-19",
        name: "019",
        boundaryType: "state_senate",
        boundaryIdentifier: "019",
        county: null,
      },
    )

    mockedApi.get.mockReturnValue({
      json: vi.fn().mockResolvedValue(data),
    } as unknown as ReturnType<typeof api.get>)

    const { result } = renderHook(
      () => useDistrictSlugResolverScoped("ga", null, "state-senate", "018"),
      { wrapper: createWrapper() },
    )

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.districtId).toBe("uuid-senate-18")
    expect(result.current.isNotFound).toBe(false)
  })

  it("resolves county-level district by state, county, and name", async () => {
    const data = makeBoundaryCollection(
      {
        id: "uuid-bibb-005",
        name: "005",
        boundaryType: "county_commission",
        boundaryIdentifier: "005",
        county: "Bibb",
      },
      {
        id: "uuid-houston-005",
        name: "005",
        boundaryType: "county_commission",
        boundaryIdentifier: "005",
        county: "Houston",
      },
    )

    mockedApi.get.mockReturnValue({
      json: vi.fn().mockResolvedValue(data),
    } as unknown as ReturnType<typeof api.get>)

    const { result } = renderHook(
      () =>
        useDistrictSlugResolverScoped(
          "ga",
          "bibb",
          "county-commission",
          "005",
        ),
      { wrapper: createWrapper() },
    )

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.districtId).toBe("uuid-bibb-005")
    expect(result.current.isNotFound).toBe(false)
  })

  it("returns not-found for invalid state abbreviation", async () => {
    mockedApi.get.mockReturnValue({
      json: vi.fn().mockResolvedValue(makeBoundaryCollection()),
    } as unknown as ReturnType<typeof api.get>)

    const { result } = renderHook(
      () =>
        useDistrictSlugResolverScoped(
          "xx",
          null,
          "state-senate",
          "018",
        ),
      { wrapper: createWrapper() },
    )

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isNotFound).toBe(true)
    expect(result.current.districtId).toBeUndefined()
  })

  it("returns not-found when no matching district exists", async () => {
    const data = makeBoundaryCollection({
      id: "uuid-senate-18",
      name: "018",
      boundaryType: "state_senate",
      boundaryIdentifier: "018",
      county: null,
    })

    mockedApi.get.mockReturnValue({
      json: vi.fn().mockResolvedValue(data),
    } as unknown as ReturnType<typeof api.get>)

    const { result } = renderHook(
      () =>
        useDistrictSlugResolverScoped(
          "ga",
          null,
          "state-senate",
          "999",
        ),
      { wrapper: createWrapper() },
    )

    await vi.waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isNotFound).toBe(true)
  })
})
