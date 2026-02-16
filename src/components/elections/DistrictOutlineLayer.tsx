import { useCallback, useMemo } from "react"
import { GeoJSON } from "react-leaflet"
import type { PathOptions } from "leaflet"
import type { MultiPolygon, Polygon } from "geojson"

export function DistrictOutlineLayer({
  geometry,
}: Readonly<{
  geometry: Polygon | MultiPolygon
}>) {
  const geoJsonData = useMemo(
    () => ({
      type: "Feature" as const,
      geometry,
      properties: {},
    }),
    [geometry],
  )

  const style = useCallback(
    (): PathOptions => ({
      color: "#7c3aed",
      weight: 5,
      fillOpacity: 0,
      opacity: 0.9,
      dashArray: "12 6",
    }),
    [],
  )

  return <GeoJSON data={geoJsonData} style={style} interactive={false} />
}
