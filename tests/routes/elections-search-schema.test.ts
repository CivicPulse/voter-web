import { describe, it, expect } from "vitest"
import {
  electionSearchSchema,
  mapParamsToApiFilters,
} from "@/lib/election-search"

describe("electionSearchSchema", () => {
  it("parses empty object to all undefined values", () => {
    const result = electionSearchSchema.parse({})
    expect(result.status).toBeUndefined()
    expect(result.type).toBeUndefined()
    expect(result.date_from).toBeUndefined()
    expect(result.date_to).toBeUndefined()
    expect(result.date_preset).toBeUndefined()
    expect(result.reg_open).toBeUndefined()
    expect(result.early_voting).toBeUndefined()
    expect(result.search).toBeUndefined()
    expect(result.page).toBeUndefined()
  })

  it("parses valid status, type, and page with coercion", () => {
    const result = electionSearchSchema.parse({
      status: "active",
      type: "general",
      page: "2",
    })
    expect(result.status).toBe("active")
    expect(result.type).toBe("general")
    expect(result.page).toBe(2)
  })

  it("catches invalid status to undefined", () => {
    const result = electionSearchSchema.parse({ status: "invalid" })
    expect(result.status).toBeUndefined()
  })

  it("parses date_preset 'all-time' correctly", () => {
    const result = electionSearchSchema.parse({ date_preset: "all-time" })
    expect(result.date_preset).toBe("all-time")
  })

  it("catches invalid date_preset to undefined", () => {
    const result = electionSearchSchema.parse({ date_preset: "invalid" })
    expect(result.date_preset).toBeUndefined()
  })

  it("parses reg_open and early_voting as literal 'true'", () => {
    const result = electionSearchSchema.parse({
      reg_open: "true",
      early_voting: "true",
    })
    expect(result.reg_open).toBe("true")
    expect(result.early_voting).toBe("true")
  })

  it("catches invalid reg_open to undefined", () => {
    const result = electionSearchSchema.parse({ reg_open: "false" })
    expect(result.reg_open).toBeUndefined()
  })

  it("parses date strings", () => {
    const result = electionSearchSchema.parse({
      date_from: "2026-01-01",
      date_to: "2026-06-01",
    })
    expect(result.date_from).toBe("2026-01-01")
    expect(result.date_to).toBe("2026-06-01")
  })

  it("parses search string", () => {
    const result = electionSearchSchema.parse({ search: "governor" })
    expect(result.search).toBe("governor")
  })
})

describe("mapParamsToApiFilters", () => {
  const defaultDates = { date_from: "2026-03-15", date_to: "2026-06-15" }

  it("returns default dates when no params provided", () => {
    const result = mapParamsToApiFilters({}, defaultDates)
    expect(result.status).toBe("all")
    expect(result.election_type).toBe("all")
    expect(result.date_from).toBe("2026-03-15")
    expect(result.date_to).toBe("2026-06-15")
    expect(result.registration_open).toBeUndefined()
    expect(result.early_voting_active).toBeUndefined()
  })

  it("returns null dates when date_preset is 'all-time'", () => {
    const result = mapParamsToApiFilters(
      { date_preset: "all-time" },
      defaultDates,
    )
    expect(result.date_from).toBeNull()
    expect(result.date_to).toBeNull()
  })

  it("returns explicit dates when provided", () => {
    const result = mapParamsToApiFilters(
      { date_from: "2026-01-01", date_to: "2026-06-01" },
      defaultDates,
    )
    expect(result.date_from).toBe("2026-01-01")
    expect(result.date_to).toBe("2026-06-01")
  })

  it("maps reg_open to registration_open boolean", () => {
    const result = mapParamsToApiFilters({ reg_open: "true" }, defaultDates)
    expect(result.registration_open).toBe(true)
  })

  it("leaves registration_open undefined when reg_open is not set", () => {
    const result = mapParamsToApiFilters({}, defaultDates)
    expect(result.registration_open).toBeUndefined()
  })

  it("maps early_voting to early_voting_active boolean", () => {
    const result = mapParamsToApiFilters(
      { early_voting: "true" },
      defaultDates,
    )
    expect(result.early_voting_active).toBe(true)
  })

  it("maps type to election_type", () => {
    const result = mapParamsToApiFilters({ type: "general" }, defaultDates)
    expect(result.election_type).toBe("general")
  })

  it("maps status to status", () => {
    const result = mapParamsToApiFilters({ status: "active" }, defaultDates)
    expect(result.status).toBe("active")
  })
})
