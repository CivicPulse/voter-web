import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  DATE_PRESETS,
  resolvePreset,
  matchPreset,
  getDefaultDateRange,
  DEFAULT_PRESET,
} from "@/lib/date-presets"

describe("date-presets", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-03-15"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("DATE_PRESETS", () => {
    it("contains all 8 presets with key and label fields", () => {
      expect(DATE_PRESETS).toHaveLength(8)
      for (const preset of DATE_PRESETS) {
        expect(preset).toHaveProperty("key")
        expect(preset).toHaveProperty("label")
        expect(typeof preset.key).toBe("string")
        expect(typeof preset.label).toBe("string")
      }
    })

    it("has presets in the expected order", () => {
      const keys = DATE_PRESETS.map((p) => p.key)
      expect(keys).toEqual([
        "next-3-months",
        "next-6-months",
        "this-year",
        "last-30-days",
        "last-6-months",
        "last-year",
        "all-time",
        "custom",
      ])
    })
  })

  describe("DEFAULT_PRESET", () => {
    it("is 'next-3-months'", () => {
      expect(DEFAULT_PRESET).toBe("next-3-months")
    })
  })

  describe("resolvePreset", () => {
    it("resolves 'next-3-months' to today through today + 3 months", () => {
      const result = resolvePreset("next-3-months")
      expect(result.date_from).toBe("2026-03-15")
      expect(result.date_to).toBe("2026-06-15")
    })

    it("resolves 'next-6-months' to today through today + 6 months", () => {
      const result = resolvePreset("next-6-months")
      expect(result.date_from).toBe("2026-03-15")
      expect(result.date_to).toBe("2026-09-15")
    })

    it("resolves 'this-year' to Jan 1 through Dec 31 of current year", () => {
      const result = resolvePreset("this-year")
      expect(result.date_from).toBe("2026-01-01")
      expect(result.date_to).toBe("2026-12-31")
    })

    it("resolves 'last-30-days' to today - 30 days through today", () => {
      const result = resolvePreset("last-30-days")
      expect(result.date_from).toBe("2026-02-13")
      expect(result.date_to).toBe("2026-03-15")
    })

    it("resolves 'last-6-months' to today - 6 months through today", () => {
      const result = resolvePreset("last-6-months")
      expect(result.date_from).toBe("2025-09-15")
      expect(result.date_to).toBe("2026-03-15")
    })

    it("resolves 'last-year' to Jan 1 through Dec 31 of previous year", () => {
      const result = resolvePreset("last-year")
      expect(result.date_from).toBe("2025-01-01")
      expect(result.date_to).toBe("2025-12-31")
    })

    it("resolves 'all-time' to undefined date_from and date_to", () => {
      const result = resolvePreset("all-time")
      expect(result.date_from).toBeUndefined()
      expect(result.date_to).toBeUndefined()
    })

    it("resolves 'custom' to undefined date_from and date_to", () => {
      const result = resolvePreset("custom")
      expect(result.date_from).toBeUndefined()
      expect(result.date_to).toBeUndefined()
    })
  })

  describe("matchPreset", () => {
    it("returns the matching preset key when dates match a preset", () => {
      expect(matchPreset("2026-03-15", "2026-06-15")).toBe("next-3-months")
      expect(matchPreset("2026-03-15", "2026-09-15")).toBe("next-6-months")
      expect(matchPreset("2026-01-01", "2026-12-31")).toBe("this-year")
      expect(matchPreset("2026-02-13", "2026-03-15")).toBe("last-30-days")
      expect(matchPreset("2025-09-15", "2026-03-15")).toBe("last-6-months")
      expect(matchPreset("2025-01-01", "2025-12-31")).toBe("last-year")
    })

    it("returns 'custom' when dates don't match any preset", () => {
      expect(matchPreset("2026-01-01", "2026-03-01")).toBe("custom")
      expect(matchPreset("2025-06-01", "2025-12-01")).toBe("custom")
    })

    it("returns 'custom' when both dates are undefined", () => {
      expect(matchPreset(undefined, undefined)).toBe("custom")
    })
  })

  describe("getDefaultDateRange", () => {
    it("returns the resolved 'next-3-months' date range with both values defined", () => {
      const result = getDefaultDateRange()
      expect(result.date_from).toBe("2026-03-15")
      expect(result.date_to).toBe("2026-06-15")
      expect(typeof result.date_from).toBe("string")
      expect(typeof result.date_to).toBe("string")
    })
  })
})
