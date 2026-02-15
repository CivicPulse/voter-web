import bbox from "@turf/bbox"
import { feature as turfFeature } from "@turf/helpers"
import type { FeatureCollection, GeoJsonProperties, Geometry, MultiPolygon, Polygon } from "geojson"
import type { LatLngBoundsExpression } from "leaflet"

/**
 * Compute Leaflet LatLngBounds from a GeoJSON geometry.
 * Returns [[south, west], [north, east]] suitable for map.fitBounds().
 */
export function geometryToLeafletBounds(
  geometry: Record<string, unknown>,
): LatLngBoundsExpression {
  const [west, south, east, north] = bbox(
    turfFeature(geometry as unknown as MultiPolygon | Polygon),
  )
  return [
    [south, west],
    [north, east],
  ]
}

/**
 * Filter a FeatureCollection to only features with non-null geometries.
 */
export function featuresWithGeometry<
  G extends Geometry,
  P extends GeoJsonProperties,
>(fc: FeatureCollection<G, P>): FeatureCollection<G, P> {
  return {
    ...fc,
    features: fc.features.filter((f) => f.geometry !== null),
  }
}

/**
 * Compute bbox from a FeatureCollection, returning null if no valid
 * geometries exist. Prevents NaN/Infinity from reaching map.fitBounds().
 */
export function safeBbox(
  fc: FeatureCollection,
): [number, number, number, number] | null {
  const withGeom = featuresWithGeometry(fc)
  if (withGeom.features.length === 0) return null
  const [west, south, east, north] = bbox(withGeom)
  if (!Number.isFinite(west) || !Number.isFinite(south) || !Number.isFinite(east) || !Number.isFinite(north)) {
    return null
  }
  return [west, south, east, north]
}
