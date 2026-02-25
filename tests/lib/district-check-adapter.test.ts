import { describe, it, expect } from "vitest"
import { adaptDistrictCheck } from "@/hooks/useDistrictCheck"
import type { DistrictCheckResponse } from "@/types/voter"

function mockDistrictCheckResponse(
  overrides?: Partial<DistrictCheckResponse>,
): DistrictCheckResponse {
  return {
    voter_id: "v-001",
    match_status: "match",
    geocoded_point: { latitude: 32.84, longitude: -83.63 },
    registered_boundaries: {
      congressional: "5",
      state_senate: "18",
    },
    determined_boundaries: {
      congressional: "5",
      state_senate: "18",
    },
    comparisons: [
      {
        boundary_type: "congressional",
        registered_value: "5",
        determined_value: "5",
        status: "match",
      },
      {
        boundary_type: "state_senate",
        registered_value: "18",
        determined_value: "18",
        status: "match",
      },
    ],
    mismatch_count: 0,
    checked_at: "2026-02-25T10:00:00Z",
    ...overrides,
  }
}

describe("adaptDistrictCheck", () => {
  it("maps match status correctly", () => {
    const response = mockDistrictCheckResponse()
    const result = adaptDistrictCheck(response)

    expect(result.matchCount).toBe(2)
    expect(result.mismatchCount).toBe(0)
    expect(result.comparisons).toHaveLength(2)
    expect(result.comparisons[0].status).toBe("match")
    expect(result.comparisons[1].status).toBe("match")
  })

  it("maps mismatch status correctly", () => {
    const response = mockDistrictCheckResponse({
      match_status: "mismatch-minor",
      comparisons: [
        {
          boundary_type: "congressional",
          registered_value: "5",
          determined_value: "8",
          status: "mismatch",
        },
        {
          boundary_type: "state_senate",
          registered_value: "18",
          determined_value: "18",
          status: "match",
        },
      ],
      mismatch_count: 1,
    })

    const result = adaptDistrictCheck(response)

    expect(result.mismatchCount).toBe(1)
    expect(result.matchCount).toBe(1)
    expect(result.comparisons[0].status).toBe("mismatch")
    expect(result.comparisons[0].geographicValue).toBe("8")
  })

  it("maps registered-only to no_geographic_data", () => {
    const response = mockDistrictCheckResponse({
      comparisons: [
        {
          boundary_type: "congressional",
          registered_value: "5",
          determined_value: null,
          status: "registered-only",
        },
      ],
    })

    const result = adaptDistrictCheck(response)

    expect(result.comparisons[0].status).toBe("no_geographic_data")
    expect(result.comparisons[0].registeredValue).toBe("5")
    expect(result.comparisons[0].geographicValue).toBeNull()
  })

  it("maps determined-only to no_registered_data", () => {
    const response = mockDistrictCheckResponse({
      comparisons: [
        {
          boundary_type: "state_house",
          registered_value: null,
          determined_value: "145",
          status: "determined-only",
        },
      ],
    })

    const result = adaptDistrictCheck(response)

    expect(result.comparisons[0].status).toBe("no_registered_data")
    expect(result.comparisons[0].registeredValue).toBeNull()
    expect(result.comparisons[0].geographicValue).toBe("145")
  })

  it("maps boundary types to registered keys", () => {
    const response = mockDistrictCheckResponse({
      comparisons: [
        {
          boundary_type: "congressional",
          registered_value: "5",
          determined_value: "5",
          status: "match",
        },
        {
          boundary_type: "county_commission",
          registered_value: "1",
          determined_value: "1",
          status: "match",
        },
      ],
    })

    const result = adaptDistrictCheck(response)

    expect(result.comparisons[0].registeredKey).toBe("congressional_district")
    expect(result.comparisons[0].label).toBe("Congressional")
    expect(result.comparisons[1].registeredKey).toBe("county_commission_district")
    expect(result.comparisons[1].label).toBe("County Commission")
  })

  it("sets lowConfidence to false", () => {
    const response = mockDistrictCheckResponse()
    const result = adaptDistrictCheck(response)

    expect(result.lowConfidence).toBe(false)
  })

  it("handles empty comparisons array", () => {
    const response = mockDistrictCheckResponse({
      comparisons: [],
    })

    const result = adaptDistrictCheck(response)

    expect(result.comparisons).toHaveLength(0)
    expect(result.matchCount).toBe(0)
    expect(result.mismatchCount).toBe(0)
  })
})
