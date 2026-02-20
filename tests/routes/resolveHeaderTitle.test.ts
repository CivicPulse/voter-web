import { describe, it, expect } from "vitest"
import { resolveHeaderTitle } from "@/routes/__root"

const defaults = {
  isOnDistrictRoute: false,
  district: undefined,
  isOnCountyRoute: false,
  county: undefined,
  isOnStatePage: false,
  stateAbbrev: undefined,
  isOnLookupPage: false,
  isOnHomePage: false,
}

describe("resolveHeaderTitle", () => {
  it("returns district name and type when on district route", () => {
    const result = resolveHeaderTitle({
      ...defaults,
      isOnDistrictRoute: true,
      district: { name: "018", boundary_type: "state_senate" },
    })
    expect(result).toBe("018 (state senate)")
  })

  it("returns county name when on county route", () => {
    const result = resolveHeaderTitle({
      ...defaults,
      isOnCountyRoute: true,
      county: { name: "Bibb" },
    })
    expect(result).toBe("Bibb County")
  })

  it("returns full state name when on state page", () => {
    const result = resolveHeaderTitle({
      ...defaults,
      isOnStatePage: true,
      stateAbbrev: "ga",
    })
    expect(result).toBe("Georgia")
  })

  it("returns uppercase abbreviation for unknown state", () => {
    const result = resolveHeaderTitle({
      ...defaults,
      isOnStatePage: true,
      stateAbbrev: "xx",
    })
    expect(result).toBe("XX")
  })

  it("returns 'Address Lookup' on lookup page", () => {
    const result = resolveHeaderTitle({
      ...defaults,
      isOnLookupPage: true,
    })
    expect(result).toBe("Address Lookup")
  })

  it("returns 'Voter Web' on home page", () => {
    const result = resolveHeaderTitle({
      ...defaults,
      isOnHomePage: true,
    })
    expect(result).toBe("Voter Web")
  })

  it("returns null when no route matches", () => {
    const result = resolveHeaderTitle(defaults)
    expect(result).toBeNull()
  })

  it("prioritizes district over county", () => {
    const result = resolveHeaderTitle({
      ...defaults,
      isOnDistrictRoute: true,
      district: { name: "005", boundary_type: "county_commission" },
      isOnCountyRoute: true,
      county: { name: "Bibb" },
    })
    expect(result).toBe("005 (county commission)")
  })

  it("prioritizes state page over home page", () => {
    const result = resolveHeaderTitle({
      ...defaults,
      isOnStatePage: true,
      stateAbbrev: "fl",
      isOnHomePage: true,
    })
    expect(result).toBe("Florida")
  })
})
