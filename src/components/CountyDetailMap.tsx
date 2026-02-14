import { useCallback, useEffect, useMemo } from "react"
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet"
import { useNavigate } from "@tanstack/react-router"
import type { PathOptions } from "leaflet"
import type { MultiPolygon, Polygon } from "geojson"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { geometryToLeafletBounds } from "@/lib/geo"
import { districtSlugPath } from "@/lib/slugs"
import { OverlayLayer } from "@/components/OverlayLayer"
import type { BoundaryFeatureCollection } from "@/types/boundary"

const GA_CENTER: [number, number] = [32.6791, -83.6233]
const GA_ZOOM = 7

const COUNTY_STYLE: PathOptions = {
  color: "#1e40af",
  weight: 3,
  fillColor: "#3b82f6",
  fillOpacity: 0.08,
  opacity: 1,
}

interface CountyDetailMapProps {
  countyGeometry: Record<string, unknown>
  overlayData?: BoundaryFeatureCollection | null
  isOverlayLoading?: boolean
  className?: string
}

function FitBoundsToCounty({
  geometry,
}: Readonly<{ geometry: Record<string, unknown> }>) {
  const map = useMap()

  useEffect(() => {
    const bounds = geometryToLeafletBounds(geometry)
    map.fitBounds(bounds, { padding: [20, 20] })
  }, [map, geometry])

  return null
}

function CountyBoundaryLayer({
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

  const style = useCallback(() => ({ ...COUNTY_STYLE }), [])

  return <GeoJSON data={geoJsonData} style={style} />
}

export function CountyDetailMap({
  countyGeometry,
  overlayData,
  isOverlayLoading,
  className,
}: Readonly<CountyDetailMapProps>) {
  const navigate = useNavigate()

  const handleDistrictDblClick = useCallback(
    (_featureId: string, boundaryType: string, name: string) => {
      const slugPath = districtSlugPath(name, boundaryType)
      navigate({
        to: "/districts/$type/$name",
        params: {
          type: slugPath.split("/")[2],
          name: slugPath.split("/")[3],
        },
      })
    },
    [navigate],
  )

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={GA_CENTER}
        zoom={GA_ZOOM}
        scrollWheelZoom={true}
        doubleClickZoom={false}
        className={cn("h-full w-full rounded-lg border", className)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBoundsToCounty geometry={countyGeometry} />
        <CountyBoundaryLayer geometry={countyGeometry} />
        {overlayData && overlayData.features.length > 0 && (
          <OverlayLayer
            data={overlayData}
            onDistrictDblClick={handleDistrictDblClick}
          />
        )}
      </MapContainer>
      {isOverlayLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/50">
          <div className="flex items-center gap-2 rounded-md bg-background px-3 py-2 text-sm text-muted-foreground shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading districts…
          </div>
        </div>
      )}
    </div>
  )
}
