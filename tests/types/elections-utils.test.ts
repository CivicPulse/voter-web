import { describe, it, expect } from "vitest"
import { synthesizeDescription } from "@/types/elections"
import { mockElection } from "@/test/mocks/elections"

describe("synthesizeDescription", () => {
  it("returns purpose field when available", () => {
    const election = mockElection({ purpose: "Special — State Senate" })
    expect(synthesizeDescription(election)).toBe("Special — State Senate")
  })

  it("falls back to type + district format when purpose is null", () => {
    const election = mockElection({
      purpose: null,
      election_type: "general",
      district: "US Senate",
    })
    expect(synthesizeDescription(election)).toBe("General — US Senate")
  })

  it("falls back when purpose is undefined", () => {
    const election = mockElection()
    expect(synthesizeDescription(election)).toBe("Special — State Senate - District 18")
  })

  it("capitalizes election type in fallback", () => {
    const election = mockElection({
      purpose: null,
      election_type: "special",
      district: "State House - District 5",
    })
    expect(synthesizeDescription(election)).toBe("Special — State House - District 5")
  })
})
