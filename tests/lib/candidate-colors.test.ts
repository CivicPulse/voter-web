import { describe, it, expect } from "vitest"
import {
  buildCandidateColorMap,
  PARTY_SHADE_PALETTES,
} from "@/lib/candidate-colors"
import { mockCandidateResult } from "@/test/mocks/elections"

describe("buildCandidateColorMap", () => {
  it("returns empty map for empty candidates array", () => {
    const map = buildCandidateColorMap([])
    expect(map.size).toBe(0)
  })

  it("assigns vivid shade (index 0) to single candidate", () => {
    const candidates = [
      mockCandidateResult({ id: "a", political_party: "Dem", vote_count: 100 }),
    ]
    const map = buildCandidateColorMap(candidates)
    expect(map.get("a")).toEqual(PARTY_SHADE_PALETTES.Dem[0])
  })

  it("assigns different shades to same-party candidates by vote ranking", () => {
    const candidates = [
      mockCandidateResult({ id: "a", political_party: "Rep", vote_count: 500 }),
      mockCandidateResult({ id: "b", political_party: "Rep", vote_count: 300 }),
      mockCandidateResult({ id: "c", political_party: "Rep", vote_count: 100 }),
    ]
    const map = buildCandidateColorMap(candidates)
    expect(map.get("a")).toEqual(PARTY_SHADE_PALETTES.Rep[0])
    expect(map.get("b")).toEqual(PARTY_SHADE_PALETTES.Rep[1])
    expect(map.get("c")).toEqual(PARTY_SHADE_PALETTES.Rep[2])
  })

  it("assigns vivid shade to each party's top candidate", () => {
    const candidates = [
      mockCandidateResult({ id: "d1", political_party: "Dem", vote_count: 400 }),
      mockCandidateResult({ id: "r1", political_party: "Rep", vote_count: 300 }),
      mockCandidateResult({ id: "i1", political_party: "Ind", vote_count: 50 }),
    ]
    const map = buildCandidateColorMap(candidates)
    expect(map.get("d1")).toEqual(PARTY_SHADE_PALETTES.Dem[0])
    expect(map.get("r1")).toEqual(PARTY_SHADE_PALETTES.Rep[0])
    expect(map.get("i1")).toEqual(PARTY_SHADE_PALETTES.Ind[0])
  })

  it("assigns distinct shades to multiple same-party candidates across parties", () => {
    const candidates = [
      mockCandidateResult({ id: "d1", political_party: "Dem", vote_count: 500 }),
      mockCandidateResult({ id: "r1", political_party: "Rep", vote_count: 400 }),
      mockCandidateResult({ id: "r2", political_party: "Rep", vote_count: 200 }),
      mockCandidateResult({ id: "d2", political_party: "Dem", vote_count: 100 }),
    ]
    const map = buildCandidateColorMap(candidates)
    // Dem: d1 gets shade 0, d2 gets shade 1
    expect(map.get("d1")).toEqual(PARTY_SHADE_PALETTES.Dem[0])
    expect(map.get("d2")).toEqual(PARTY_SHADE_PALETTES.Dem[1])
    // Rep: r1 gets shade 0, r2 gets shade 1
    expect(map.get("r1")).toEqual(PARTY_SHADE_PALETTES.Rep[0])
    expect(map.get("r2")).toEqual(PARTY_SHADE_PALETTES.Rep[1])
  })

  it("uses default gray palette for unknown party", () => {
    const candidates = [
      mockCandidateResult({ id: "x", political_party: "Unknown", vote_count: 100 }),
    ]
    const map = buildCandidateColorMap(candidates)
    const color = map.get("x")
    expect(color).toBeDefined()
    // Default palette starts with gray
    expect(color!.fill).toBe("#9ca3af")
  })

  it("includes all candidate IDs in the returned map", () => {
    const candidates = [
      mockCandidateResult({ id: "a", vote_count: 100 }),
      mockCandidateResult({ id: "b", vote_count: 200 }),
      mockCandidateResult({ id: "c", vote_count: 300 }),
    ]
    const map = buildCandidateColorMap(candidates)
    expect(map.size).toBe(3)
    expect(map.has("a")).toBe(true)
    expect(map.has("b")).toBe(true)
    expect(map.has("c")).toBe(true)
  })

  it("wraps shade index when more candidates than palette size", () => {
    const candidates = Array.from({ length: 7 }, (_, i) =>
      mockCandidateResult({
        id: `r${i}`,
        political_party: "Rep",
        vote_count: 700 - i * 100,
      }),
    )
    const map = buildCandidateColorMap(candidates)
    // Palette has 5 shades, so candidate 5 wraps to shade 0
    expect(map.get("r5")).toEqual(PARTY_SHADE_PALETTES.Rep[0])
    expect(map.get("r6")).toEqual(PARTY_SHADE_PALETTES.Rep[1])
  })

  it("assigns higher vote-getter the more vivid shade regardless of input order", () => {
    const candidates = [
      mockCandidateResult({ id: "low", political_party: "Dem", vote_count: 50 }),
      mockCandidateResult({ id: "high", political_party: "Dem", vote_count: 500 }),
      mockCandidateResult({ id: "mid", political_party: "Dem", vote_count: 200 }),
    ]
    const map = buildCandidateColorMap(candidates)
    expect(map.get("high")).toEqual(PARTY_SHADE_PALETTES.Dem[0])
    expect(map.get("mid")).toEqual(PARTY_SHADE_PALETTES.Dem[1])
    expect(map.get("low")).toEqual(PARTY_SHADE_PALETTES.Dem[2])
  })

  it("uses purple palette for Ind party", () => {
    const candidates = [
      mockCandidateResult({ id: "ind1", political_party: "Ind", vote_count: 100 }),
    ]
    const map = buildCandidateColorMap(candidates)
    expect(map.get("ind1")!.fill).toBe("#7c3aed")
  })
})
