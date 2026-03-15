import { describe, expect, it } from "vitest"
import {
  deriveActiveFilters,
  type ElectionSearchParams,
} from "@/lib/election-search"
import type { DatePresetKey } from "@/lib/date-presets"

describe("deriveActiveFilters", () => {
  const defaults: ElectionSearchParams = {}
  const defaultPreset: DatePresetKey = "next-3-months"

  it("returns empty array for default state (no non-default filters)", () => {
    const result = deriveActiveFilters(defaults, defaultPreset)
    expect(result).toEqual([])
  })

  it("returns status chip when status is set", () => {
    const result = deriveActiveFilters({ status: "active" }, defaultPreset)
    expect(result).toEqual([
      { key: "Status: Active", paramKey: "status" },
    ])
  })

  it("returns type chip when type is set", () => {
    const result = deriveActiveFilters({ type: "general" }, defaultPreset)
    expect(result).toEqual([
      { key: "Type: General", paramKey: "type" },
    ])
  })

  it("returns date chip for non-default preset (last-30-days)", () => {
    const result = deriveActiveFilters({}, "last-30-days")
    expect(result).toEqual([
      { key: "Date: Last 30 days", paramKey: "date_range" },
    ])
  })

  it("returns date chip with date range string for custom preset", () => {
    const result = deriveActiveFilters(
      { date_from: "2026-01-01", date_to: "2026-06-30" },
      "custom",
    )
    expect(result).toEqual([
      { key: "Date: 2026-01-01 to 2026-06-30", paramKey: "date_range" },
    ])
  })

  it("returns date chip with question marks for custom preset without dates", () => {
    const result = deriveActiveFilters({}, "custom")
    expect(result).toEqual([
      { key: "Date: ? to ?", paramKey: "date_range" },
    ])
  })

  it("returns date chip for all-time preset", () => {
    const result = deriveActiveFilters({}, "all-time")
    expect(result).toEqual([
      { key: "Date: All time", paramKey: "date_range" },
    ])
  })

  it("returns registration chip when reg_open is true", () => {
    const result = deriveActiveFilters({ reg_open: "true" }, defaultPreset)
    expect(result).toEqual([
      { key: "Registration open", paramKey: "reg_open" },
    ])
  })

  it("returns early voting chip when early_voting is true", () => {
    const result = deriveActiveFilters(
      { early_voting: "true" },
      defaultPreset,
    )
    expect(result).toEqual([
      { key: "Early voting active", paramKey: "early_voting" },
    ])
  })

  it("returns search chip with search text", () => {
    const result = deriveActiveFilters({ search: "test query" }, defaultPreset)
    expect(result).toEqual([
      { key: 'Search: "test query"', paramKey: "search" },
    ])
  })

  it("truncates search text longer than 20 characters", () => {
    const result = deriveActiveFilters(
      { search: "a very long search string that exceeds twenty characters" },
      defaultPreset,
    )
    expect(result).toEqual([
      { key: 'Search: "a very long search s..."', paramKey: "search" },
    ])
  })

  it("returns multiple chips in correct order for combined filters", () => {
    const result = deriveActiveFilters(
      {
        status: "finalized",
        type: "primary",
        reg_open: "true",
        search: "senate",
      },
      "last-6-months",
    )
    expect(result).toEqual([
      { key: "Status: Finalized", paramKey: "status" },
      { key: "Type: Primary", paramKey: "type" },
      { key: "Date: Last 6 months", paramKey: "date_range" },
      { key: "Registration open", paramKey: "reg_open" },
      { key: 'Search: "senate"', paramKey: "search" },
    ])
  })

  // Phase 3: new filter chip types
  it("returns q chip with search text", () => {
    const result = deriveActiveFilters({ q: "senate" }, defaultPreset)
    expect(result).toContainEqual({
      key: 'Search: "senate"',
      paramKey: "q",
    })
  })

  it("truncates q text longer than 20 characters", () => {
    const result = deriveActiveFilters(
      { q: "a very long search string that exceeds twenty characters" },
      defaultPreset,
    )
    expect(result).toContainEqual({
      key: 'Search: "a very long search s..."',
      paramKey: "q",
    })
  })

  it("returns race chip with formatted label", () => {
    const result = deriveActiveFilters({ race: "state_senate" }, defaultPreset)
    expect(result).toContainEqual({
      key: "Race: State Senate",
      paramKey: "race",
    })
  })

  it("returns county chip", () => {
    const result = deriveActiveFilters({ county: "Bibb" }, defaultPreset)
    expect(result).toContainEqual({
      key: "County: Bibb",
      paramKey: "county",
    })
  })

  it("returns election_date chip with formatted date", () => {
    const result = deriveActiveFilters(
      { election_date: "2026-11-03" },
      defaultPreset,
    )
    expect(result).toContainEqual({
      key: "Date: Nov 3, 2026",
      paramKey: "election_date",
    })
  })

  it("returns new chips after existing chips in correct order", () => {
    const result = deriveActiveFilters(
      {
        status: "active",
        search: "test",
        q: "senate",
        race: "federal",
        county: "Bibb",
        election_date: "2026-11-03",
      },
      defaultPreset,
    )
    const paramKeys = result.map((f) => f.paramKey)
    // Existing chips first, then new Phase 3 chips
    expect(paramKeys).toEqual([
      "status",
      "search",
      "q",
      "race",
      "county",
      "election_date",
    ])
  })
})
