import { useCallback, useEffect, useMemo } from "react"
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet"
import type { PathOptions } from "leaflet"
import type { Feature, MultiPolygon, Polygon } from "geojson"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { geometryToLeafletBounds } from "@/lib/geo"
import type { CountyFeatureCollection, CountyProperties } from "@/types/boundaries"

const GA_CENTER: [number, number] = [32.6791, -83.6233]
const GA_ZOOM = 7

const DISTRICT_STYLE: PathOptions = {
  color: "#1e40af",
  weight: 3,
  fillColor: "#3b82f6",
  fillOpacity: 0.15,
  opacity: 1,
}

const COUNTY_OUTLINE_STYLE: PathOptions = {
  color: "#6b7280",
  weight: 2,
  fillColor: "#f3f4f6",
  fillOpacity: 0.05,
  opacity: 0.7,
  dashArray: "6 4",
}

interface DistrictDetailMapProps {
  districtGeometry?: Record<string, unknown> | null
  counties?: CountyFeatureCollection | null
  isDistrictLoading?: boolean
  isCountiesLoading?: boolean
  className?: string
}

function FitBoundsToDistrict({
  geometry,
}: Readonly<{ geometry: Record<string, unknown> }>) {
  const map = useMap()

  useEffect(() => {
    const bounds = geometryToLeafletBounds(geometry)
    map.fitBounds(bounds, { padding: [30, 30] })
  }, [map, geometry])

  return null
}

function DistrictBoundaryLayer({
  geometry,
}: Readonly<{ geometry: Record<string, unknown> }>) {
  const geoJsonData = useMemo(
    () => ({
      type: "Feature" as const,
      geometry: geometry as unknown as MultiPolygon | Polygon,
      properties: {},
    }),
    [geometry],
  )

  const style = useCallback(() => ({ ...DISTRICT_STYLE }), [])

  return <GeoJSON data={geoJsonData} style={style} />
}

function CountyOutlinesLayer({
  counties,
}: Readonly<{ counties: CountyFeatureCollection }>) {
  const style = useCallback(() => ({ ...COUNTY_OUTLINE_STYLE }), [])

  const onEachFeature = useCallback(
    (
      feature: Feature<MultiPolygon | Polygon, CountyProperties>,
      layer: import("leaflet").Layer,
    ) => {
      const name = feature.properties.name
      layer.bindPopup(
        `<div class="p-1"><p class="font-semibold text-sm">${name} County</p></div>`,
      )
    },
    [],
  )

  if (counties.features.length === 0) {
    return null
  }

  return (
    <GeoJSON
      key={counties.features.length}
      data={counties}
      style={style}
      onEachFeature={onEachFeature}
    />
  )
}

export function DistrictDetailMap({
  districtGeometry,
  counties,
  isDistrictLoading,
  isCountiesLoading,
  className,
}: Readonly<DistrictDetailMapProps>) {
  const isLoading = isDistrictLoading || isCountiesLoading

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={GA_CENTER}
        zoom={GA_ZOOM}
        scrollWheelZoom={true}
        className={cn("h-full w-full rounded-lg border", className)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {districtGeometry && (
          <FitBoundsToDistrict geometry={districtGeometry} />
        )}
        {counties && <CountyOutlinesLayer counties={counties} />}
        {districtGeometry && (
          <DistrictBoundaryLayer geometry={districtGeometry} />
        )}
      </MapContainer>
      {isLoading && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-[1000]">
          <div className="flex items-center gap-2 rounded-md bg-background/90 px-3 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isDistrictLoading
              ? "Loading district…"
              : "Loading county outlines…"}
          </div>
        </div>
      )}
    </div>
  )
}
