import { describe, it, expect } from "vitest"
import { mapCapabilitiesToFlags, EMPTY_FLAGS } from "@/lib/election-capabilities"
import type { CapabilitiesResponse } from "@/types/elections"

describe("mapCapabilitiesToFlags", () => {
  it("maps q param to search flag", () => {
    const response: CapabilitiesResponse = {
      supported_filters: ["q"],
      endpoints: { filter_options: false },
    }

    const flags = mapCapabilitiesToFlags(response)

    expect(flags.search).toBe(true)
    expect(flags.raceCategory).toBe(false)
    expect(flags.geographic).toBe(false)
    expect(flags.electionDate).toBe(false)
    expect(flags.filterOptions).toBe(false)
  })

  it("maps race_category param to raceCategory flag", () => {
    const response: CapabilitiesResponse = {
      supported_filters: ["race_category"],
      endpoints: { filter_options: false },
    }

    const flags = mapCapabilitiesToFlags(response)

    expect(flags.raceCategory).toBe(true)
    expect(flags.search).toBe(false)
  })

  it("maps county param to geographic flag", () => {
    const response: CapabilitiesResponse = {
      supported_filters: ["county"],
      endpoints: { filter_options: false },
    }

    const flags = mapCapabilitiesToFlags(response)

    expect(flags.geographic).toBe(true)
  })

  it("maps district param to geographic flag", () => {
    const response: CapabilitiesResponse = {
      supported_filters: ["district"],
      endpoints: { filter_options: false },
    }

    const flags = mapCapabilitiesToFlags(response)

    expect(flags.geographic).toBe(true)
  })

  it("maps both county and district to geographic flag", () => {
    const response: CapabilitiesResponse = {
      supported_filters: ["county", "district"],
      endpoints: { filter_options: false },
    }

    const flags = mapCapabilitiesToFlags(response)

    expect(flags.geographic).toBe(true)
  })

  it("maps election_date param to electionDate flag", () => {
    const response: CapabilitiesResponse = {
      supported_filters: ["election_date"],
      endpoints: { filter_options: false },
    }

    const flags = mapCapabilitiesToFlags(response)

    expect(flags.electionDate).toBe(true)
  })

  it("maps filter_options endpoint to filterOptions flag", () => {
    const response: CapabilitiesResponse = {
      supported_filters: [],
      endpoints: { filter_options: true },
    }

    const flags = mapCapabilitiesToFlags(response)

    expect(flags.filterOptions).toBe(true)
    expect(flags.search).toBe(false)
    expect(flags.raceCategory).toBe(false)
    expect(flags.geographic).toBe(false)
    expect(flags.electionDate).toBe(false)
  })

  it("returns all false for empty supported_filters and filter_options false", () => {
    const response: CapabilitiesResponse = {
      supported_filters: [],
      endpoints: { filter_options: false },
    }

    const flags = mapCapabilitiesToFlags(response)

    expect(flags).toEqual({
      search: false,
      raceCategory: false,
      geographic: false,
      electionDate: false,
      filterOptions: false,
    })
  })

  it("returns all true when all params are supported", () => {
    const response: CapabilitiesResponse = {
      supported_filters: ["q", "race_category", "county", "district", "election_date"],
      endpoints: { filter_options: true },
    }

    const flags = mapCapabilitiesToFlags(response)

    expect(flags).toEqual({
      search: true,
      raceCategory: true,
      geographic: true,
      electionDate: true,
      filterOptions: true,
    })
  })

  it("handles missing endpoints field gracefully", () => {
    const response = {
      supported_filters: ["q"],
    } as CapabilitiesResponse

    const flags = mapCapabilitiesToFlags(response)

    expect(flags.search).toBe(true)
    expect(flags.filterOptions).toBe(false)
  })

  it("handles undefined endpoints gracefully", () => {
    const response = {
      supported_filters: [],
      endpoints: undefined,
    } as unknown as CapabilitiesResponse

    const flags = mapCapabilitiesToFlags(response)

    expect(flags.filterOptions).toBe(false)
  })
})

describe("EMPTY_FLAGS", () => {
  it("has all flags set to false", () => {
    expect(EMPTY_FLAGS).toEqual({
      search: false,
      raceCategory: false,
      geographic: false,
      electionDate: false,
      filterOptions: false,
    })
  })
})
