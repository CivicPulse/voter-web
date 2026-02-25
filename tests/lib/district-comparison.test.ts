import { describe, it, expect } from "vitest"
import { compareDistricts } from "@/lib/district-comparison"
import type { RegisteredDistricts } from "@/types/voter"
import type { PointLookupResponse } from "@/types/lookup"

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

function makePointLookup(
  districts: { boundary_type: string; name: string }[] = [],
): PointLookupResponse {
  return {
    latitude: 32.8,
    longitude: -83.6,
    accuracy_radius_meters: null,
    districts: districts.map((d, i) => ({
      ...d,
      boundary_identifier: `130000${i}`,
      boundary_id: `id-${i}`,
      metadata: {},
    })),
  }
}

describe("compareDistricts", () => {
  it("detects matching districts", () => {
    const registered = makeRegistered({
      congressional_district: "2",
      state_senate_district: "18",
    })
    const lookup = makePointLookup([
      { boundary_type: "congressional", name: "Congressional District 2" },
      { boundary_type: "state_senate", name: "State Senate District 18" },
    ])

    const result = compareDistricts(registered, lookup, 0.95)

    expect(result.mismatchCount).toBe(0)
    expect(result.matchCount).toBe(2)
    expect(result.lowConfidence).toBe(false)

    const congressional = result.comparisons.find(
      (c) => c.registeredKey === "congressional_district",
    )
    expect(congressional?.status).toBe("match")

    const senate = result.comparisons.find(
      (c) => c.registeredKey === "state_senate_district",
    )
    expect(senate?.status).toBe("match")
  })

  it("detects mismatching districts", () => {
    const registered = makeRegistered({
      county_commission_district: "3",
    })
    const lookup = makePointLookup([
      {
        boundary_type: "county_commission",
        name: "County Commission District 7",
      },
    ])

    const result = compareDistricts(registered, lookup, 0.95)

    expect(result.mismatchCount).toBe(1)
    const commission = result.comparisons.find(
      (c) => c.registeredKey === "county_commission_district",
    )
    expect(commission?.status).toBe("mismatch")
    expect(commission?.geographicValue).toBe("007")
  })

  it("handles leading zero normalization (registered '5' vs geographic '005')", () => {
    const registered = makeRegistered({
      state_house_district: "5",
    })
    const lookup = makePointLookup([
      { boundary_type: "state_house", name: "State House District 5" },
    ])

    const result = compareDistricts(registered, lookup, 0.90)
    const house = result.comparisons.find(
      (c) => c.registeredKey === "state_house_district",
    )
    expect(house?.status).toBe("match")
  })

  it("handles zero-padded registered value ('005' vs '005')", () => {
    const registered = makeRegistered({
      state_house_district: "005",
    })
    const lookup = makePointLookup([
      { boundary_type: "state_house", name: "State House District 5" },
    ])

    const result = compareDistricts(registered, lookup, 0.90)
    const house = result.comparisons.find(
      (c) => c.registeredKey === "state_house_district",
    )
    expect(house?.status).toBe("match")
  })

  it("returns no_geographic_data when boundary data is missing", () => {
    const registered = makeRegistered({
      congressional_district: "2",
      school_board_district: "4",
    })
    // Only provide congressional, not school_board
    const lookup = makePointLookup([
      { boundary_type: "congressional", name: "Congressional District 2" },
    ])

    const result = compareDistricts(registered, lookup, 0.90)

    const school = result.comparisons.find(
      (c) => c.registeredKey === "school_board_district",
    )
    expect(school?.status).toBe("no_geographic_data")
  })

  it("returns no_registered_data when voter has no value but geographic exists", () => {
    const registered = makeRegistered({
      congressional_district: null,
    })
    const lookup = makePointLookup([
      { boundary_type: "congressional", name: "Congressional District 2" },
    ])

    const result = compareDistricts(registered, lookup, 0.90)

    const congressional = result.comparisons.find(
      (c) => c.registeredKey === "congressional_district",
    )
    expect(congressional?.status).toBe("no_registered_data")
  })

  it("skips county and psc boundary types", () => {
    const registered = makeRegistered({
      congressional_district: "2",
    })
    const lookup = makePointLookup([
      { boundary_type: "county", name: "Bibb County" },
      { boundary_type: "psc", name: "PSC District 3" },
      { boundary_type: "congressional", name: "Congressional District 2" },
    ])

    const result = compareDistricts(registered, lookup, 0.90)

    // Only congressional should appear — county and psc are skipped
    expect(result.comparisons).toHaveLength(1)
    expect(result.comparisons[0]?.registeredKey).toBe("congressional_district")
    expect(result.matchCount).toBe(1)
  })

  it("flags low confidence when score is below threshold", () => {
    const registered = makeRegistered({
      congressional_district: "2",
    })
    const lookup = makePointLookup([
      { boundary_type: "congressional", name: "Congressional District 2" },
    ])

    const result = compareDistricts(registered, lookup, 0.5)
    expect(result.lowConfidence).toBe(true)
  })

  it("does not flag low confidence when score is null", () => {
    const registered = makeRegistered({
      congressional_district: "2",
    })
    const lookup = makePointLookup([
      { boundary_type: "congressional", name: "Congressional District 2" },
    ])

    const result = compareDistricts(registered, lookup, null)
    expect(result.lowConfidence).toBe(false)
  })

  it("handles commission_district alias for county_commission", () => {
    const registered = makeRegistered({
      county_commission_district: "5",
    })
    const lookup = makePointLookup([
      { boundary_type: "commission_district", name: "Commission District 5" },
    ])

    const result = compareDistricts(registered, lookup, 0.90)
    const commission = result.comparisons.find(
      (c) => c.registeredKey === "county_commission_district",
    )
    expect(commission?.status).toBe("match")
  })

  it("handles precinct alias for county_precinct", () => {
    const registered = makeRegistered({
      county_precinct: "07",
    })
    const lookup = makePointLookup([
      { boundary_type: "precinct", name: "Precinct 7" },
    ])

    const result = compareDistricts(registered, lookup, 0.90)
    const precinct = result.comparisons.find(
      (c) => c.registeredKey === "county_precinct",
    )
    expect(precinct?.status).toBe("match")
  })

  it("returns empty comparisons when point lookup has no districts", () => {
    const registered = makeRegistered({
      congressional_district: "2",
    })
    const lookup = makePointLookup([])

    const result = compareDistricts(registered, lookup, 0.90)

    expect(result.mismatchCount).toBe(0)
    expect(result.matchCount).toBe(0)
    const congressional = result.comparisons.find(
      (c) => c.registeredKey === "congressional_district",
    )
    expect(congressional?.status).toBe("no_geographic_data")
  })

  it("handles non-numeric district names (falls back to raw name)", () => {
    const registered = makeRegistered({
      county_precinct: "MACO",
    })
    const lookup = makePointLookup([
      { boundary_type: "county_precinct", name: "MACO" },
    ])

    const result = compareDistricts(registered, lookup, 0.90)
    const precinct = result.comparisons.find(
      (c) => c.registeredKey === "county_precinct",
    )
    expect(precinct?.status).toBe("match")
  })
})
