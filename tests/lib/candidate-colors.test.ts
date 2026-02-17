import { describe, it, expect } from "vitest"
import {
  buildCandidateColorMap,
  getCountyFillColor,
  NEUTRAL_COLOR,
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

describe("getCountyFillColor", () => {
  it("returns neutral color for empty candidates array", () => {
    expect(getCountyFillColor([])).toEqual(NEUTRAL_COLOR)
  })

  it("returns neutral color when all candidates have zero votes", () => {
    const candidates = [
      mockCandidateResult({ id: "a", political_party: "Dem", vote_count: 0 }),
      mockCandidateResult({ id: "b", political_party: "Rep", vote_count: 0 }),
    ]
    expect(getCountyFillColor(candidates)).toEqual(NEUTRAL_COLOR)
  })

  it("returns neutral color when top two candidates are tied", () => {
    const candidates = [
      mockCandidateResult({ id: "a", political_party: "Dem", vote_count: 500 }),
      mockCandidateResult({ id: "b", political_party: "Rep", vote_count: 500 }),
    ]
    expect(getCountyFillColor(candidates)).toEqual(NEUTRAL_COLOR)
  })

  it("returns party color for single candidate with votes", () => {
    const candidates = [
      mockCandidateResult({ id: "a", political_party: "Dem", vote_count: 100 }),
    ]
    // Single candidate → 100% margin → shade index 0 (most vivid)
    expect(getCountyFillColor(candidates)).toEqual(PARTY_SHADE_PALETTES.Dem[0])
  })

  it("returns most vivid shade for margin > 60%", () => {
    // margin = (850 - 150) / 1000 * 100 = 70%
    const candidates = [
      mockCandidateResult({ id: "a", political_party: "Rep", vote_count: 850 }),
      mockCandidateResult({ id: "b", political_party: "Dem", vote_count: 150 }),
    ]
    expect(getCountyFillColor(candidates)).toEqual(PARTY_SHADE_PALETTES.Rep[0])
  })

  it("returns shade index 1 for margin between 40% and 60%", () => {
    // margin = (710 - 290) / 1000 * 100 = 42%
    const candidates = [
      mockCandidateResult({ id: "a", political_party: "Dem", vote_count: 710 }),
      mockCandidateResult({ id: "b", political_party: "Rep", vote_count: 290 }),
    ]
    expect(getCountyFillColor(candidates)).toEqual(PARTY_SHADE_PALETTES.Dem[1])
  })

  it("returns shade index 2 for margin between 25% and 40%", () => {
    // margin = (650 - 350) / 1000 * 100 = 30%
    const candidates = [
      mockCandidateResult({ id: "a", political_party: "Rep", vote_count: 650 }),
      mockCandidateResult({ id: "b", political_party: "Dem", vote_count: 350 }),
    ]
    expect(getCountyFillColor(candidates)).toEqual(PARTY_SHADE_PALETTES.Rep[2])
  })

  it("returns shade index 3 for margin between 10% and 25%", () => {
    // margin = (600 - 400) / 1000 * 100 = 20%
    const candidates = [
      mockCandidateResult({ id: "a", political_party: "Dem", vote_count: 600 }),
      mockCandidateResult({ id: "b", political_party: "Rep", vote_count: 400 }),
    ]
    expect(getCountyFillColor(candidates)).toEqual(PARTY_SHADE_PALETTES.Dem[3])
  })

  it("returns lightest shade for margin <= 10%", () => {
    // margin = (530 - 470) / 1000 * 100 = 6%
    const candidates = [
      mockCandidateResult({ id: "a", political_party: "Rep", vote_count: 530 }),
      mockCandidateResult({ id: "b", political_party: "Dem", vote_count: 470 }),
    ]
    expect(getCountyFillColor(candidates)).toEqual(PARTY_SHADE_PALETTES.Rep[4])
  })

  it("uses default gray palette for unknown party", () => {
    // margin = (810 - 190) / 1000 * 100 = 62% → index 0
    const candidates = [
      mockCandidateResult({ id: "a", political_party: "Unknown", vote_count: 810 }),
      mockCandidateResult({ id: "b", political_party: "Dem", vote_count: 190 }),
    ]
    const result = getCountyFillColor(candidates)
    // DEFAULT_SHADE_PALETTE[0] — most vivid gray
    expect(result.fill).toBe("#9ca3af")
    expect(result.border).toBe("#6b7280")
  })

  it("determines leader regardless of input order", () => {
    const candidates = [
      mockCandidateResult({ id: "b", political_party: "Rep", vote_count: 150 }),
      mockCandidateResult({ id: "a", political_party: "Dem", vote_count: 850 }),
    ]
    // margin = (850 - 150) / 1000 * 100 = 70% → index 0
    expect(getCountyFillColor(candidates)).toEqual(PARTY_SHADE_PALETTES.Dem[0])
  })

  it("handles three-way race using top two candidates for margin", () => {
    // margin = (500 - 300) / 1000 * 100 = 20% → index 3
    const candidates = [
      mockCandidateResult({ id: "a", political_party: "Dem", vote_count: 500 }),
      mockCandidateResult({ id: "b", political_party: "Rep", vote_count: 300 }),
      mockCandidateResult({ id: "c", political_party: "Ind", vote_count: 200 }),
    ]
    expect(getCountyFillColor(candidates)).toEqual(PARTY_SHADE_PALETTES.Dem[3])
  })
})
