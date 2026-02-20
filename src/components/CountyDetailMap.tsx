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
import type { Election } from "@/types/elections"

const DEFAULT_CENTER: [number, number] = [39.8283, -98.5795]
const DEFAULT_ZOOM = 4

const COUNTY_STYLE: PathOptions = {
  color: "#1e40af",
  weight: 3,
  fillColor: "#3b82f6",
  fillOpacity: 0.08,
  opacity: 1,
}

interface CountyDetailMapProps {
  countyGeometry?: Record<string, unknown> | null
  overlayData?: BoundaryFeatureCollection | null
  activeElections?: Election[]
  stateAbbrev?: string
  isCountyLoading?: boolean
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
  activeElections,
  stateAbbrev: stateAbbrevProp,
  isCountyLoading,
  isOverlayLoading,
  className,
}: Readonly<CountyDetailMapProps>) {
  const navigate = useNavigate()

  const handleDistrictDblClick = useCallback(
    (
      _featureId: string,
      boundaryType: string,
      name: string,
      county: string | null,
    ) => {
      if (!stateAbbrevProp) return
      const slugPath = districtSlugPath(name, boundaryType, stateAbbrevProp, county)
      if (county) {
        navigate({
          to: "/districts/$state/$county/$type/$name",
          params: {
            state: slugPath.split("/")[2],
            county: slugPath.split("/")[3],
            type: slugPath.split("/")[4],
            name: slugPath.split("/")[5],
          },
        })
      } else {
        navigate({
          to: "/districts/$state/$type/$name",
          params: {
            state: slugPath.split("/")[2],
            type: slugPath.split("/")[3],
            name: slugPath.split("/")[4],
          },
        })
      }
    },
    [navigate, stateAbbrevProp],
  )

  const isLoading = isCountyLoading || isOverlayLoading

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        doubleClickZoom={false}
        className={cn("h-full w-full rounded-lg border", className)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {countyGeometry && <FitBoundsToCounty geometry={countyGeometry} />}
        {countyGeometry && <CountyBoundaryLayer geometry={countyGeometry} />}
        {overlayData && overlayData.features.length > 0 && (
          <OverlayLayer
            data={overlayData}
            activeElections={activeElections}
            onDistrictDblClick={handleDistrictDblClick}
          />
        )}
      </MapContainer>
      {isLoading && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-[1000] -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-md bg-background/90 px-3 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isCountyLoading ? "Loading county…" : "Loading districts…"}
          </div>
        </div>
      )}
    </div>
  )
}
