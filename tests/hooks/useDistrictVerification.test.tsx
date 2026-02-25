import { describe, it, expect, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useDistrictVerification } from "@/hooks/useDistrictVerification"
import type { RegisteredDistricts } from "@/types/voter"
import type { VoterGeocodedLocation, PointLookupResponse } from "@/types/lookup"

// Mock the point lookup API call
vi.mock("@/api/lookup", () => ({
  pointLookup: vi.fn(),
}))

import { pointLookup } from "@/api/lookup"
const mockPointLookup = vi.mocked(pointLookup)

function makeRegistered(
  overrides: Partial<RegisteredDistricts> = {},
): RegisteredDistricts {
  return {
    congressional_district: null,
    state_senate_district: null,
    state_house_district: null,
    judicial_district: null,
    county_commission_district: null,
    school_board_district: null,
    city_council_district: null,
    municipal_school_board_district: null,
    county_precinct: null,
    county_precinct_description: null,
    municipal_precinct: null,
    municipal_precinct_description: null,
    ...overrides,
  }
}

function makePrimaryLocation(
  overrides: Partial<VoterGeocodedLocation> = {},
): VoterGeocodedLocation {
  return {
    id: "loc-1",
    voter_id: "voter-1",
    latitude: 32.8,
    longitude: -83.6,
    confidence_score: 0.95,
    source_type: "geocoder",
    is_primary: true,
    input_address: "123 Main St",
    geocoded_at: "2024-01-01T00:00:00Z",
    ...overrides,
  }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe("useDistrictVerification", () => {
  it("returns null verification when no locations", () => {
    const { result } = renderHook(
      () =>
        useDistrictVerification({
          districts: makeRegistered({ congressional_district: "2" }),
          locations: undefined,
        }),
      { wrapper: createWrapper() },
    )

    expect(result.current.verification).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.primaryLocation).toBeNull()
  })

  it("returns null verification when no primary location", () => {
    const nonPrimary = makePrimaryLocation({ is_primary: false })
    const { result } = renderHook(
      () =>
        useDistrictVerification({
          districts: makeRegistered({ congressional_district: "2" }),
          locations: [nonPrimary],
        }),
      { wrapper: createWrapper() },
    )

    expect(result.current.verification).toBeNull()
    expect(result.current.primaryLocation).toBeNull()
  })

  it("calls point lookup and returns verification for primary location", async () => {
    const mockResponse: PointLookupResponse = {
      latitude: 32.8,
      longitude: -83.6,
      accuracy_radius_meters: null,
      districts: [
        {
          boundary_type: "congressional",
          name: "Congressional District 2",
          boundary_identifier: "130002",
          boundary_id: "bd-1",
          metadata: {},
        },
      ],
    }
    mockPointLookup.mockResolvedValue(mockResponse)

    const { result } = renderHook(
      () =>
        useDistrictVerification({
          districts: makeRegistered({ congressional_district: "2" }),
          locations: [makePrimaryLocation()],
        }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(result.current.verification).not.toBeNull()
    })

    expect(result.current.verification!.matchCount).toBe(1)
    expect(result.current.verification!.mismatchCount).toBe(0)
    expect(result.current.primaryLocation).not.toBeNull()
  })

  it("detects mismatches from point lookup", async () => {
    const mockResponse: PointLookupResponse = {
      latitude: 32.8,
      longitude: -83.6,
      accuracy_radius_meters: null,
      districts: [
        {
          boundary_type: "county_commission",
          name: "County Commission District 7",
          boundary_identifier: "130007",
          boundary_id: "bd-2",
          metadata: {},
        },
      ],
    }
    mockPointLookup.mockResolvedValue(mockResponse)

    const { result } = renderHook(
      () =>
        useDistrictVerification({
          districts: makeRegistered({ county_commission_district: "3" }),
          locations: [makePrimaryLocation()],
        }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(result.current.verification).not.toBeNull()
    })

    expect(result.current.verification!.mismatchCount).toBe(1)
    const commission = result.current.verification!.comparisons.find(
      (c) => c.registeredKey === "county_commission_district",
    )
    expect(commission?.status).toBe("mismatch")
    expect(commission?.geographicValue).toBe("007")
  })
})
