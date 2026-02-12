import bbox from "@turf/bbox"
import { feature as turfFeature } from "@turf/helpers"
import type { MultiPolygon, Polygon } from "geojson"
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
