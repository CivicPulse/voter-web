import type { Feature, MultiPolygon, Polygon } from "geojson"
import type {
  PrecinctResultFeatureCollection,
  PrecinctResultGeoProperties,
} from "@/types/elections"
import type { BoundaryFeatureProperties } from "@/types/boundary"
import { stripCountySuffix } from "@/lib/utils"

function normalizeKey(value: string | undefined | null): string {
  return (value ?? "").toLowerCase().trim()
}

function compositeKey(precinctName: string, countyName: string): string {
  return `${normalizeKey(precinctName)}::${normalizeKey(stripCountySuffix(countyName || ""))}`
}

/** Convert "FULTON" → "Fulton County" to match election data format */
function formatCountyName(raw: string): string {
  if (!raw) return ""
  const bare = stripCountySuffix(raw).trim()
  const titled = bare.charAt(0).toUpperCase() + bare.slice(1).toLowerCase()
  return `${titled} County`
}

/**
 * Merge election result features with boundary features to produce
 * a unified feature collection with full geometry coverage.
 *
 * Strategy:
 * 1. Keep election features that already have geometry
 * 2. For null-geometry election features, find matching boundary and use its geometry
 * 3. For unmatched boundary features, create "Not Reported" entries
 *
 * Matching is attempted in order: precinct_id, precinct_sos_id, name+county composite.
 */
export function mergePrecinctData(
  electionFC: PrecinctResultFeatureCollection,
  boundaryFeatures: Feature<Polygon | MultiPolygon, BoundaryFeatureProperties>[],
): PrecinctResultFeatureCollection {
  // Phase 1: Build lookup indices from election results
  const resultsByComposite = new Map<string, number>()
  const resultsById = new Map<string, number>()

  for (let i = 0; i < electionFC.features.length; i++) {
    const props = electionFC.features[i].properties

    const ck = compositeKey(props.precinct_name, props.county_name)
    resultsByComposite.set(ck, i)

    if (props.precinct_id) {
      resultsById.set(normalizeKey(props.precinct_id), i)
    }
  }

  // Phase 2: Keep election features that already have geometry
  const mergedFeatures: Feature<
    Polygon | MultiPolygon,
    PrecinctResultGeoProperties
  >[] = []
  const emittedElectionIndices = new Set<number>()

  for (let i = 0; i < electionFC.features.length; i++) {
    const f = electionFC.features[i]
    if (f.geometry !== null) {
      mergedFeatures.push({
        ...f,
        properties: { ...f.properties, has_results: true },
      })
      emittedElectionIndices.add(i)
    }
  }

  // Phase 3: Process boundary features
  for (const boundaryFeature of boundaryFeatures) {
    if (!boundaryFeature.geometry) continue

    const bp = boundaryFeature.properties
    let matchedIdx: number | undefined

    // Strategy A: Match by precinct_id
    if (bp.precinct_id) {
      matchedIdx = resultsById.get(normalizeKey(bp.precinct_id))
    }

    // Strategy B: Match by precinct_sos_id against election precinct_id
    if (matchedIdx === undefined && bp.precinct_sos_id) {
      matchedIdx = resultsById.get(normalizeKey(bp.precinct_sos_id))
    }

    // Strategy C: Match by composite name+county
    if (matchedIdx === undefined && bp.precinct_name) {
      const countyName = bp.precinct_county_name ?? bp.county ?? ""
      matchedIdx = resultsByComposite.get(
        compositeKey(bp.precinct_name, countyName),
      )
    }

    if (matchedIdx !== undefined && !emittedElectionIndices.has(matchedIdx)) {
      // Fill in geometry for a null-geometry election feature
      const electionFeature = electionFC.features[matchedIdx]
      mergedFeatures.push({
        type: "Feature",
        geometry: boundaryFeature.geometry,
        properties: { ...electionFeature.properties, has_results: true },
      })
      emittedElectionIndices.add(matchedIdx)
    } else if (matchedIdx === undefined) {
      // Boundary precinct with no election results
      mergedFeatures.push({
        type: "Feature",
        geometry: boundaryFeature.geometry,
        properties: {
          precinct_id: bp.precinct_id ?? bp.boundary_identifier ?? "",
          precinct_name: bp.precinct_name ?? bp.name ?? "Unknown",
          county_name: formatCountyName(bp.precinct_county_name ?? bp.county ?? ""),
          reporting_status: "Not Reported",
          candidates: [],
          has_results: false,
        },
      })
    }
  }

  // Sort so "Not Reported" boundary features render first (behind)
  // and features with results render last (on top) in Leaflet
  mergedFeatures.sort((a, b) => {
    const aHas = a.properties.has_results ? 1 : 0
    const bHas = b.properties.has_results ? 1 : 0
    return aHas - bHas
  })

  return {
    type: "FeatureCollection",
    features: mergedFeatures,
  } as PrecinctResultFeatureCollection
}
