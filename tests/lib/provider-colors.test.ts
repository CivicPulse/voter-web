import { describe, it, expect, vi, beforeAll } from "vitest"
import { DISTRICT_COLORS } from "@/lib/colors"

// Mock Leaflet before importing provider-colors (which imports L)
vi.mock("leaflet", () => {
  return {
    default: {
      divIcon: vi.fn((options: unknown) => ({ _isDivIcon: true, ...options as object })),
    },
  }
})

import {
  PROVIDER_COLORS,
  getProviderColor,
  createProviderDivIcon,
  applyCoordinateJitter,
} from "@/lib/provider-colors"
import type { VoterGeocodedLocation } from "@/types/lookup"

// Helper to create a minimal VoterGeocodedLocation
function makeLocation(
  overrides: Partial<VoterGeocodedLocation> & Pick<VoterGeocodedLocation, "id" | "latitude" | "longitude" | "source_type">,
): VoterGeocodedLocation {
  return {
    voter_id: "voter-1",
    confidence_score: null,
    is_primary: false,
    input_address: null,
    geocoded_at: "2024-01-01T00:00:00Z",
    ...overrides,
  }
}

describe("PROVIDER_COLORS", () => {
  it("contains exactly 6 named providers", () => {
    const keys = Object.keys(PROVIDER_COLORS)
    expect(keys).toHaveLength(6)
    expect(keys).toContain("nominatim")
    expect(keys).toContain("google")
    expect(keys).toContain("photon")
    expect(keys).toContain("census")
    expect(keys).toContain("usps")
    expect(keys).toContain("manual")
  })
})

describe("getProviderColor", () => {
  it("returns correct color for nominatim", () => {
    const color = getProviderColor("nominatim", 0)
    expect(color).toEqual(PROVIDER_COLORS.nominatim)
    expect(color.label).toBe("Nominatim")
    expect(color.fill).toBe("#4363d8")
  })

  it("returns correct color for google", () => {
    const color = getProviderColor("google", 0)
    expect(color).toEqual(PROVIDER_COLORS.google)
    expect(color.label).toBe("Google")
    expect(color.fill).toBe("#e6194b")
  })

  it("returns correct color for photon", () => {
    const color = getProviderColor("photon", 0)
    expect(color).toEqual(PROVIDER_COLORS.photon)
    expect(color.label).toBe("Photon")
    expect(color.fill).toBe("#3cb44b")
  })

  it("returns correct color for census", () => {
    const color = getProviderColor("census", 0)
    expect(color).toEqual(PROVIDER_COLORS.census)
    expect(color.label).toBe("Census")
    expect(color.fill).toBe("#f58231")
  })

  it("returns correct color for usps", () => {
    const color = getProviderColor("usps", 0)
    expect(color).toEqual(PROVIDER_COLORS.usps)
    expect(color.label).toBe("USPS")
    expect(color.fill).toBe("#911eb4")
  })

  it("returns correct color for manual", () => {
    const color = getProviderColor("manual", 0)
    expect(color).toEqual(PROVIDER_COLORS.manual)
    expect(color.label).toBe("Manual")
    expect(color.fill).toBe("#42d4f4")
  })

  it("is case-insensitive for known providers", () => {
    expect(getProviderColor("NOMINATIM", 0)).toEqual(PROVIDER_COLORS.nominatim)
    expect(getProviderColor("Google", 0)).toEqual(PROVIDER_COLORS.google)
    expect(getProviderColor("CENSUS", 0)).toEqual(PROVIDER_COLORS.census)
  })

  it("falls back to DISTRICT_COLORS[0] for unknown provider at index 0", () => {
    const color = getProviderColor("unknown-provider", 0)
    expect(color.fill).toBe(DISTRICT_COLORS[0].fill)
    expect(color.border).toBe(DISTRICT_COLORS[0].border)
  })

  it("falls back to DISTRICT_COLORS[1] for unknown provider at index 1", () => {
    const color = getProviderColor("another-unknown", 1)
    expect(color.fill).toBe(DISTRICT_COLORS[1].fill)
    expect(color.border).toBe(DISTRICT_COLORS[1].border)
  })

  it("cycles DISTRICT_COLORS for fallback index beyond palette length", () => {
    const paletteLength = DISTRICT_COLORS.length
    const color = getProviderColor("cycling-provider", paletteLength)
    // Should wrap around to DISTRICT_COLORS[0]
    expect(color.fill).toBe(DISTRICT_COLORS[0].fill)
  })

  it("capitalises unknown provider label", () => {
    const color = getProviderColor("myservice", 0)
    expect(color.label).toBe("Myservice")
  })

  it("preserves capitalisation of rest of unknown provider label", () => {
    const color = getProviderColor("myService", 0)
    expect(color.label).toBe("MyService")
  })
})

describe("createProviderDivIcon", () => {
  beforeAll(() => {
    // Leaflet is mocked above; L.divIcon is a vi.fn()
  })

  const sampleColor = { fill: "#ff0000", border: "#cc0000", label: "Test" }

  it("returns a DivIcon-like object for primary marker", () => {
    const icon = createProviderDivIcon(sampleColor, true)
    expect(icon).toBeDefined()
    // Our mock returns an object with _isDivIcon
    expect((icon as { _isDivIcon?: boolean })._isDivIcon).toBe(true)
  })

  it("returns a DivIcon-like object for secondary marker", () => {
    const icon = createProviderDivIcon(sampleColor, false)
    expect(icon).toBeDefined()
    expect((icon as { _isDivIcon?: boolean })._isDivIcon).toBe(true)
  })

  it("primary icon has larger iconSize than secondary", () => {
    const primary = createProviderDivIcon(sampleColor, true) as { iconSize?: number[] }
    const secondary = createProviderDivIcon(sampleColor, false) as { iconSize?: number[] }
    // primary: [28,28], secondary: [20,20]
    expect(primary.iconSize![0]).toBeGreaterThan(secondary.iconSize![0])
  })

  it("primary icon SVG contains white inner ring", () => {
    const primary = createProviderDivIcon(sampleColor, true) as { html?: string }
    expect(primary.html).toContain("white")
  })

  it("secondary icon SVG does not contain white inner ring", () => {
    const secondary = createProviderDivIcon(sampleColor, false) as { html?: string }
    // Secondary has no white circle
    expect(secondary.html).not.toContain('fill="white"')
  })

  it("icon SVG uses provider fill color", () => {
    const primary = createProviderDivIcon(sampleColor, true) as { html?: string }
    expect(primary.html).toContain(sampleColor.fill)
  })

  it("icon SVG uses provider border color", () => {
    const primary = createProviderDivIcon(sampleColor, true) as { html?: string }
    expect(primary.html).toContain(sampleColor.border)
  })
})

describe("applyCoordinateJitter", () => {
  it("returns empty array for empty input", () => {
    expect(applyCoordinateJitter([])).toEqual([])
  })

  it("returns single location unchanged", () => {
    const loc = makeLocation({ id: "a", latitude: 32.0, longitude: -83.0, source_type: "nominatim" })
    const result = applyCoordinateJitter([loc])
    expect(result[0].latitude).toBe(32.0)
    expect(result[0].longitude).toBe(-83.0)
  })

  it("does not modify non-overlapping coordinates", () => {
    const loc1 = makeLocation({ id: "a", latitude: 32.0, longitude: -83.0, source_type: "nominatim" })
    const loc2 = makeLocation({ id: "b", latitude: 33.0, longitude: -84.0, source_type: "google" })
    const result = applyCoordinateJitter([loc1, loc2])
    expect(result[0].latitude).toBe(32.0)
    expect(result[0].longitude).toBe(-83.0)
    expect(result[1].latitude).toBe(33.0)
    expect(result[1].longitude).toBe(-84.0)
  })

  it("offsets second location when coordinates are identical", () => {
    const loc1 = makeLocation({ id: "a", latitude: 32.0, longitude: -83.0, source_type: "nominatim" })
    const loc2 = makeLocation({ id: "b", latitude: 32.0, longitude: -83.0, source_type: "google" })
    const result = applyCoordinateJitter([loc1, loc2])
    // First stays put
    expect(result[0].latitude).toBe(32.0)
    expect(result[0].longitude).toBe(-83.0)
    // Second is offset in at least one dimension
    const latChanged = result[1].latitude !== 32.0
    const lngChanged = result[1].longitude !== -83.0
    expect(latChanged || lngChanged).toBe(true)
  })

  it("offsets second location when coordinates are within 0.0001° threshold", () => {
    const loc1 = makeLocation({ id: "a", latitude: 32.0, longitude: -83.0, source_type: "nominatim" })
    // Within threshold (0.00005 < 0.0001)
    const loc2 = makeLocation({ id: "b", latitude: 32.00005, longitude: -83.00005, source_type: "google" })
    const result = applyCoordinateJitter([loc1, loc2])
    // Second should be jittered (moved)
    const originalDist =
      Math.abs(loc1.latitude - loc2.latitude) + Math.abs(loc1.longitude - loc2.longitude)
    const resultDist =
      Math.abs(result[0].latitude - result[1].latitude) +
      Math.abs(result[0].longitude - result[1].longitude)
    // After jitter they should be further apart than originally
    expect(resultDist).toBeGreaterThan(originalDist)
  })

  it("does not offset second location when coordinates are beyond threshold", () => {
    const loc1 = makeLocation({ id: "a", latitude: 32.0, longitude: -83.0, source_type: "nominatim" })
    // Beyond threshold (0.0002 > 0.0001)
    const loc2 = makeLocation({ id: "b", latitude: 32.0002, longitude: -83.0, source_type: "google" })
    const result = applyCoordinateJitter([loc1, loc2])
    expect(result[1].latitude).toBe(32.0002)
    expect(result[1].longitude).toBe(-83.0)
  })

  it("preserves all other location fields unchanged", () => {
    const loc1 = makeLocation({ id: "a", latitude: 32.0, longitude: -83.0, source_type: "nominatim", is_primary: true, voter_id: "v1" })
    const loc2 = makeLocation({ id: "b", latitude: 32.0, longitude: -83.0, source_type: "google", is_primary: false, voter_id: "v1" })
    const result = applyCoordinateJitter([loc1, loc2])
    expect(result[1].id).toBe("b")
    expect(result[1].source_type).toBe("google")
    expect(result[1].is_primary).toBe(false)
    expect(result[1].voter_id).toBe("v1")
  })

  it("does not mutate the original input array", () => {
    const loc1 = makeLocation({ id: "a", latitude: 32.0, longitude: -83.0, source_type: "nominatim" })
    const loc2 = makeLocation({ id: "b", latitude: 32.0, longitude: -83.0, source_type: "google" })
    const input = [loc1, loc2]
    applyCoordinateJitter(input)
    // Original locations should be unchanged
    expect(input[0].latitude).toBe(32.0)
    expect(input[1].latitude).toBe(32.0)
  })
})
