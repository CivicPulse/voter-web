import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook } from "@testing-library/react"
import { createTestQueryClient } from "@/test/render"
import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useAvailableStates } from "@/hooks/useAvailableStates"
import type { CountyFeatureCollection } from "@/types/boundaries"

vi.mock("@/hooks/useCountyBoundaries", () => ({
  useCountyBoundaries: vi.fn(),
}))

import { useCountyBoundaries } from "@/hooks/useCountyBoundaries"

const mockedUseCountyBoundaries = vi.mocked(useCountyBoundaries)

function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function makeCountyFeatures(
  ...entries: Array<{ name: string; fips: string }>
): CountyFeatureCollection {
  return {
    type: "FeatureCollection",
    features: entries.map((entry, i) => ({
      type: "Feature" as const,
      id: `county-${i}`,
      geometry: { type: "Polygon" as const, coordinates: [] },
      properties: {
        name: entry.name,
        boundary_type: "county",
        boundary_identifier: entry.fips,
        source: "test",
        county: entry.name,
      },
    })),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useAvailableStates", () => {
  it("returns loading state when data is not ready", () => {
    mockedUseCountyBoundaries.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useCountyBoundaries>)

    const { result } = renderHook(() => useAvailableStates(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.states).toEqual([])
  })

  it("extracts single state from county boundaries", () => {
    mockedUseCountyBoundaries.mockReturnValue({
      data: makeCountyFeatures(
        { name: "Bibb", fips: "13021" },
        { name: "Houston", fips: "13153" },
      ),
      isLoading: false,
    } as ReturnType<typeof useCountyBoundaries>)

    const { result } = renderHook(() => useAvailableStates(), {
      wrapper: createWrapper(),
    })

    expect(result.current.states).toHaveLength(1)
    expect(result.current.states[0]).toEqual({
      abbreviation: "ga",
      fipsCode: "13",
      countyCount: 2,
    })
    expect(result.current.isSingleState).toBe(true)
    expect(result.current.defaultState?.abbreviation).toBe("ga")
  })

  it("extracts multiple states sorted alphabetically", () => {
    mockedUseCountyBoundaries.mockReturnValue({
      data: makeCountyFeatures(
        { name: "Bibb", fips: "13021" },
        { name: "Monroe", fips: "01099" },
        { name: "Houston", fips: "13153" },
      ),
      isLoading: false,
    } as ReturnType<typeof useCountyBoundaries>)

    const { result } = renderHook(() => useAvailableStates(), {
      wrapper: createWrapper(),
    })

    expect(result.current.states).toHaveLength(2)
    expect(result.current.states[0].abbreviation).toBe("al")
    expect(result.current.states[0].countyCount).toBe(1)
    expect(result.current.states[1].abbreviation).toBe("ga")
    expect(result.current.states[1].countyCount).toBe(2)
    expect(result.current.isSingleState).toBe(false)
    expect(result.current.defaultState).toBeUndefined()
  })

  it("returns empty states when no boundaries loaded", () => {
    mockedUseCountyBoundaries.mockReturnValue({
      data: makeCountyFeatures(),
      isLoading: false,
    } as ReturnType<typeof useCountyBoundaries>)

    const { result } = renderHook(() => useAvailableStates(), {
      wrapper: createWrapper(),
    })

    expect(result.current.states).toEqual([])
    expect(result.current.isSingleState).toBe(false)
  })
})
