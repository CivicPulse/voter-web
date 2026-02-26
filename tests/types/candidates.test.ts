import { describe, it, expect } from "vitest"
import { getCandidateInitials, sortCandidates } from "@/types/candidates"
import { mockCandidateSummary } from "@/test/mocks/candidates"

describe("getCandidateInitials", () => {
  it("returns first and last initials for two-word name", () => {
    expect(getCandidateInitials("Jane Doe")).toBe("JD")
  })

  it("returns first and last initials for three-word name", () => {
    expect(getCandidateInitials("Andrea C. Cooke")).toBe("AC")
  })

  it("returns single initial for mononym", () => {
    expect(getCandidateInitials("Madonna")).toBe("M")
  })

  it("returns empty string for whitespace-only input", () => {
    expect(getCandidateInitials("  ")).toBe("")
  })

  it("returns empty string for empty string input", () => {
    expect(getCandidateInitials("")).toBe("")
  })

  it("returns first and last initials for hyphenated first name", () => {
    expect(getCandidateInitials("Mary-Jane Watson")).toBe("MW")
  })

  it("returns first and last initials for hyphenated multi-word name", () => {
    expect(getCandidateInitials("Jean-Luc Picard")).toBe("JP")
  })
})

describe("sortCandidates", () => {
  it("sorts by ballot_order ascending when all have values", () => {
    const candidates = [
      mockCandidateSummary({ full_name: "Charlie", ballot_order: 3 }),
      mockCandidateSummary({ full_name: "Alice", ballot_order: 1 }),
      mockCandidateSummary({ full_name: "Bob", ballot_order: 2 }),
    ]
    const sorted = sortCandidates(candidates)
    expect(sorted.map((c) => c.ballot_order)).toEqual([1, 2, 3])
  })

  it("puts null ballot_order items last", () => {
    const candidates = [
      mockCandidateSummary({ full_name: "Zara", ballot_order: null }),
      mockCandidateSummary({ full_name: "Alice", ballot_order: 1 }),
    ]
    const sorted = sortCandidates(candidates)
    expect(sorted[0].full_name).toBe("Alice")
    expect(sorted[1].full_name).toBe("Zara")
  })

  it("sorts alphabetically by full_name when all have null ballot_order", () => {
    const candidates = [
      mockCandidateSummary({ full_name: "Charlie", ballot_order: null }),
      mockCandidateSummary({ full_name: "Alice", ballot_order: null }),
      mockCandidateSummary({ full_name: "Bob", ballot_order: null }),
    ]
    const sorted = sortCandidates(candidates)
    expect(sorted.map((c) => c.full_name)).toEqual(["Alice", "Bob", "Charlie"])
  })

  it("places non-null ballot_orders first sorted, then nulls alphabetically", () => {
    const candidates = [
      mockCandidateSummary({ full_name: "Zara", ballot_order: null }),
      mockCandidateSummary({ full_name: "Alice", ballot_order: null }),
      mockCandidateSummary({ full_name: "Bob", ballot_order: 2 }),
      mockCandidateSummary({ full_name: "Charlie", ballot_order: 1 }),
    ]
    const sorted = sortCandidates(candidates)
    expect(sorted.map((c) => c.full_name)).toEqual(["Charlie", "Bob", "Alice", "Zara"])
  })

  it("returns a new array without mutating the input", () => {
    const candidates = [
      mockCandidateSummary({ full_name: "Bob", ballot_order: 2 }),
      mockCandidateSummary({ full_name: "Alice", ballot_order: 1 }),
    ]
    const sorted = sortCandidates(candidates)
    expect(sorted).not.toBe(candidates)
    expect(candidates[0].full_name).toBe("Bob")
    expect(candidates[1].full_name).toBe("Alice")
  })
})
