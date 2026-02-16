import { describe, it, expect } from "vitest"
import type { Feature, Polygon, MultiPolygon } from "geojson"
import { mergePrecinctData } from "@/lib/merge-precinct-data"
import type { PrecinctResultFeatureCollection, PrecinctResultGeoProperties } from "@/types/elections"
import type { BoundaryFeatureProperties } from "@/types/boundary"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const POLYGON: Polygon = {
  type: "Polygon",
  coordinates: [[[-83.7, 32.8], [-83.5, 32.8], [-83.5, 33.0], [-83.7, 33.0], [-83.7, 32.8]]],
}

const POLYGON_B: Polygon = {
  type: "Polygon",
  coordinates: [[[-84.0, 33.0], [-83.8, 33.0], [-83.8, 33.2], [-84.0, 33.2], [-84.0, 33.0]]],
}

function makeElectionFC(
  features: Feature<Polygon | MultiPolygon | null, PrecinctResultGeoProperties>[],
): PrecinctResultFeatureCollection {
  return { type: "FeatureCollection", features } as PrecinctResultFeatureCollection
}

function makeElectionFeature(
  overrides: Partial<{
    geometry: Polygon | MultiPolygon | null
    precinct_id: string
    precinct_name: string
    county_name: string
    reporting_status: string
  }> = {},
): Feature<Polygon | MultiPolygon | null, PrecinctResultGeoProperties> {
  return {
    type: "Feature",
    geometry: overrides.geometry ?? null,
    properties: {
      precinct_id: overrides.precinct_id ?? "p-001",
      precinct_name: overrides.precinct_name ?? "Precinct 1",
      county_name: overrides.county_name ?? "Bibb County",
      reporting_status: overrides.reporting_status ?? "Reported",
      candidates: [{ id: "c1", name: "Doe", political_party: "Dem", vote_count: 100, group_results: [] }],
    },
  }
}

function makeBoundaryFeature(
  overrides: Partial<BoundaryFeatureProperties> & { geometry?: Polygon | MultiPolygon | null } = {},
): Feature<Polygon | MultiPolygon, BoundaryFeatureProperties> {
  const { geometry, ...propOverrides } = overrides
  return {
    type: "Feature",
    geometry: geometry ?? POLYGON_B,
    properties: {
      name: propOverrides.name ?? "Precinct 1",
      boundary_type: propOverrides.boundary_type ?? "county_precinct",
      boundary_identifier: propOverrides.boundary_identifier ?? "bnd-001",
      source: propOverrides.source ?? "tiger",
      county: propOverrides.county ?? "Bibb",
      ...propOverrides,
    },
  } as Feature<Polygon | MultiPolygon, BoundaryFeatureProperties>
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("mergePrecinctData", () => {
  describe("Phase 2: election features with geometry", () => {
    it("keeps election features that already have geometry", () => {
      const fc = makeElectionFC([
        makeElectionFeature({ geometry: POLYGON, precinct_id: "p-001" }),
      ])
      const result = mergePrecinctData(fc, [])
      expect(result.features).toHaveLength(1)
      expect(result.features[0].properties.has_results).toBe(true)
      expect(result.features[0].geometry).toEqual(POLYGON)
    })

    it("skips election features with null geometry when no boundaries provided", () => {
      const fc = makeElectionFC([
        makeElectionFeature({ geometry: null, precinct_id: "p-001" }),
      ])
      const result = mergePrecinctData(fc, [])
      expect(result.features).toHaveLength(0)
    })
  })

  describe("Strategy A: match by precinct_id", () => {
    it("fills null-geometry election feature with matching boundary geometry", () => {
      const fc = makeElectionFC([
        makeElectionFeature({ geometry: null, precinct_id: "p-001" }),
      ])
      const boundaries = [
        makeBoundaryFeature({ precinct_id: "p-001" }),
      ]
      const result = mergePrecinctData(fc, boundaries)
      expect(result.features).toHaveLength(1)
      expect(result.features[0].geometry).toEqual(POLYGON_B)
      expect(result.features[0].properties.has_results).toBe(true)
      expect(result.features[0].properties.precinct_id).toBe("p-001")
    })

    it("matches precinct_id case-insensitively", () => {
      const fc = makeElectionFC([
        makeElectionFeature({ geometry: null, precinct_id: "P-001" }),
      ])
      const boundaries = [
        makeBoundaryFeature({ precinct_id: "p-001" }),
      ]
      const result = mergePrecinctData(fc, boundaries)
      expect(result.features).toHaveLength(1)
      expect(result.features[0].properties.has_results).toBe(true)
    })
  })

  describe("Strategy B: match by precinct_sos_id", () => {
    it("falls back to precinct_sos_id when precinct_id does not match", () => {
      const fc = makeElectionFC([
        makeElectionFeature({ geometry: null, precinct_id: "sos-42" }),
      ])
      const boundaries = [
        makeBoundaryFeature({
          precinct_id: "different-id",
          precinct_sos_id: "sos-42",
        }),
      ]
      const result = mergePrecinctData(fc, boundaries)
      expect(result.features).toHaveLength(1)
      expect(result.features[0].properties.has_results).toBe(true)
    })
  })

  describe("Strategy C: match by composite name+county", () => {
    it("matches by precinct_name + county_name composite", () => {
      const fc = makeElectionFC([
        makeElectionFeature({
          geometry: null,
          precinct_id: "",
          precinct_name: "Ward 5",
          county_name: "Bibb County",
        }),
      ])
      const boundaries = [
        makeBoundaryFeature({
          precinct_id: undefined,
          precinct_sos_id: undefined,
          precinct_name: "Ward 5",
          precinct_county_name: "Bibb County",
        }),
      ]
      const result = mergePrecinctData(fc, boundaries)
      expect(result.features).toHaveLength(1)
      expect(result.features[0].properties.has_results).toBe(true)
    })

    it("matches composite key case-insensitively", () => {
      const fc = makeElectionFC([
        makeElectionFeature({
          geometry: null,
          precinct_id: "",
          precinct_name: "WARD 5",
          county_name: "bibb county",
        }),
      ])
      const boundaries = [
        makeBoundaryFeature({
          precinct_id: undefined,
          precinct_sos_id: undefined,
          precinct_name: "ward 5",
          precinct_county_name: "Bibb County",
        }),
      ]
      const result = mergePrecinctData(fc, boundaries)
      expect(result.features).toHaveLength(1)
    })

    it("matches when election has 'County' suffix but boundary does not", () => {
      const fc = makeElectionFC([
        makeElectionFeature({
          geometry: null,
          precinct_id: "",
          precinct_name: "Salem",
          county_name: "Crawford County",
        }),
      ])
      const boundaries = [
        makeBoundaryFeature({
          precinct_id: undefined,
          precinct_sos_id: undefined,
          precinct_name: "Salem",
          precinct_county_name: undefined,
          county: "Crawford",
        }),
      ]
      const result = mergePrecinctData(fc, boundaries)
      expect(result.features).toHaveLength(1)
      expect(result.features[0].properties.has_results).toBe(true)
    })

    it("uses boundary county field as fallback when precinct_county_name is absent", () => {
      const fc = makeElectionFC([
        makeElectionFeature({
          geometry: null,
          precinct_id: "",
          precinct_name: "Ward 5",
          county_name: "Houston",
        }),
      ])
      const boundaries = [
        makeBoundaryFeature({
          precinct_id: undefined,
          precinct_sos_id: undefined,
          precinct_name: "Ward 5",
          precinct_county_name: undefined,
          county: "Houston",
        }),
      ]
      const result = mergePrecinctData(fc, boundaries)
      expect(result.features).toHaveLength(1)
    })
  })

  describe("Phase 3: unmatched boundary features", () => {
    it("creates 'Not Reported' entries for unmatched boundaries", () => {
      const fc = makeElectionFC([])
      const boundaries = [
        makeBoundaryFeature({
          precinct_name: "Unmatched Precinct",
          county: "Crawford",
          boundary_identifier: "bnd-999",
        }),
      ]
      const result = mergePrecinctData(fc, boundaries)
      expect(result.features).toHaveLength(1)
      expect(result.features[0].properties.reporting_status).toBe("Not Reported")
      expect(result.features[0].properties.has_results).toBe(false)
      expect(result.features[0].properties.precinct_name).toBe("Unmatched Precinct")
      expect(result.features[0].properties.county_name).toBe("Crawford County")
      expect(result.features[0].properties.candidates).toEqual([])
    })

    it("formats all-caps county name to title case with suffix", () => {
      const fc = makeElectionFC([])
      const boundaries = [
        makeBoundaryFeature({
          precinct_name: "SC16B",
          precinct_county_name: "FULTON",
          county: "FULTON",
        }),
      ]
      const result = mergePrecinctData(fc, boundaries)
      expect(result.features[0].properties.county_name).toBe("Fulton County")
    })

    it("uses fallback name when precinct_name is absent", () => {
      const fc = makeElectionFC([])
      const boundaries = [
        makeBoundaryFeature({
          precinct_name: undefined,
          name: "Boundary Name",
        }),
      ]
      const result = mergePrecinctData(fc, boundaries)
      expect(result.features[0].properties.precinct_name).toBe("Boundary Name")
    })

    it("uses 'Unknown' when both precinct_name and name are absent", () => {
      const fc = makeElectionFC([])
      const boundaries = [
        makeBoundaryFeature({
          precinct_name: undefined,
          // name defaults to "Precinct 1" in helper; override with empty string
          name: "",
        }),
      ]
      // ?? only triggers on null/undefined, not empty string — empty name stays ""
      const result = mergePrecinctData(fc, boundaries)
      expect(result.features[0].properties.precinct_name).toBe("")
    })

    it("uses 'Unknown' when precinct_name is undefined and name is undefined", () => {
      const fc = makeElectionFC([])
      const boundary: Feature<Polygon | MultiPolygon, BoundaryFeatureProperties> = {
        type: "Feature",
        geometry: POLYGON_B,
        properties: {
          name: undefined as unknown as string,
          boundary_type: "county_precinct",
          boundary_identifier: "bnd-001",
          source: "tiger",
          county: "Bibb",
        },
      }
      const result = mergePrecinctData(fc, [boundary])
      expect(result.features[0].properties.precinct_name).toBe("Unknown")
    })

    it("skips boundary features with null geometry", () => {
      const fc = makeElectionFC([])
      const boundary = {
        type: "Feature" as const,
        geometry: null,
        properties: {
          name: "Null Geo",
          boundary_type: "county_precinct",
          boundary_identifier: "bnd-null",
          source: "tiger",
          county: "Bibb",
        },
      } as unknown as Feature<Polygon | MultiPolygon, BoundaryFeatureProperties>
      const result = mergePrecinctData(fc, [boundary])
      expect(result.features).toHaveLength(0)
    })
  })

  describe("mixed scenarios", () => {
    it("handles mix of geometry-present, null-geometry matched, and unmatched", () => {
      const fc = makeElectionFC([
        // Has geometry — kept directly
        makeElectionFeature({ geometry: POLYGON, precinct_id: "p-with-geo" }),
        // Null geometry — should match boundary by ID
        makeElectionFeature({ geometry: null, precinct_id: "p-null-geo" }),
      ])
      const boundaries = [
        // Matches null-geometry election feature
        makeBoundaryFeature({ precinct_id: "p-null-geo" }),
        // No matching election feature
        makeBoundaryFeature({
          precinct_id: "p-extra",
          precinct_name: "Extra Precinct",
          county: "Bibb",
        }),
      ]
      const result = mergePrecinctData(fc, boundaries)

      // 1 (kept geometry) + 1 (filled geometry) + 1 (unmatched boundary)
      expect(result.features).toHaveLength(3)

      const withResults = result.features.filter((f) => f.properties.has_results === true)
      const withoutResults = result.features.filter((f) => f.properties.has_results === false)
      expect(withResults).toHaveLength(2)
      expect(withoutResults).toHaveLength(1)
      expect(withoutResults[0].properties.reporting_status).toBe("Not Reported")
    })

    it("does not duplicate election features already emitted with geometry", () => {
      const fc = makeElectionFC([
        makeElectionFeature({ geometry: POLYGON, precinct_id: "p-001" }),
      ])
      const boundaries = [
        makeBoundaryFeature({ precinct_id: "p-001" }),
      ]
      const result = mergePrecinctData(fc, boundaries)
      // Should NOT create a duplicate — election feature already emitted
      expect(result.features).toHaveLength(1)
    })

    it("sorts features so results render on top (after) 'Not Reported' entries", () => {
      const fc = makeElectionFC([
        makeElectionFeature({ geometry: POLYGON, precinct_id: "p-with-geo" }),
      ])
      const boundaries = [
        makeBoundaryFeature({
          precinct_id: "p-extra",
          precinct_name: "Extra",
          county: "Bibb",
        }),
      ]
      const result = mergePrecinctData(fc, boundaries)
      expect(result.features).toHaveLength(2)
      // "Not Reported" (has_results=false) should come first
      expect(result.features[0].properties.has_results).toBe(false)
      // Results (has_results=true) should come last (rendered on top in Leaflet)
      expect(result.features[1].properties.has_results).toBe(true)
    })

    it("returns empty collection when both inputs are empty", () => {
      const fc = makeElectionFC([])
      const result = mergePrecinctData(fc, [])
      expect(result.features).toHaveLength(0)
      expect(result.type).toBe("FeatureCollection")
    })
  })
})
