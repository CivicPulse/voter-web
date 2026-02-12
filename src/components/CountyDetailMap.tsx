import { useCallback, useEffect, useMemo } from "react"
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet"
import type { Layer, LeafletMouseEvent, PathOptions } from "leaflet"
import type { Feature, MultiPolygon, Polygon } from "geojson"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { geometryToLeafletBounds } from "@/lib/geo"
import type {
  BoundaryFeatureCollection,
  BoundaryFeatureProperties,
} from "@/types/boundary"

const GA_CENTER: [number, number] = [32.6791, -83.6233]
const GA_ZOOM = 7

const COUNTY_STYLE: PathOptions = {
  color: "#1e40af",
  weight: 3,
  fillColor: "#3b82f6",
  fillOpacity: 0.08,
  opacity: 1,
}

const OVERLAY_STYLE: PathOptions = {
  color: "#6b7280",
  weight: 1.5,
  fillColor: "#ef4444",
  fillOpacity: 0.2,
  opacity: 0.9,
}

const OVERLAY_HOVER_STYLE: PathOptions = {
  weight: 3,
  fillOpacity: 0.4,
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

function OverlayLayer({
  data,
}: Readonly<{ data: BoundaryFeatureCollection }>) {
  const style = useCallback(() => ({ ...OVERLAY_STYLE }), [])

  const onEachFeature = useCallback(
    (
      feature: Feature<MultiPolygon | Polygon, BoundaryFeatureProperties>,
      layer: Layer,
    ) => {
      const props = feature.properties
      const displayName = props.name || props.boundary_identifier
      const typeName = props.boundary_type.replace(/_/g, " ")

      layer.bindPopup(
        `<div class="p-1">
          <p class="font-semibold text-sm">${displayName}</p>
          <p class="text-xs text-muted-foreground capitalize">${typeName}</p>
        </div>`,
      )

      const defaultStyle = { ...OVERLAY_STYLE }
      layer.on({
        mouseover: (e: LeafletMouseEvent) => {
          e.target.setStyle(OVERLAY_HOVER_STYLE)
          e.target.bringToFront()
        },
        mouseout: (e: LeafletMouseEvent) => {
          e.target.setStyle(defaultStyle)
        },
      })
    },
    [],
  )

  return (
    <GeoJSON
      key={`${data.features[0]?.properties?.boundary_type}-${data.features.length}`}
      data={data}
      style={style}
      onEachFeature={onEachFeature}
    />
  )
}

export function CountyDetailMap({
  countyGeometry,
  overlayData,
  isOverlayLoading,
  className,
}: Readonly<CountyDetailMapProps>) {
  return (
    <div className="relative">
      <MapContainer
        center={GA_CENTER}
        zoom={GA_ZOOM}
        scrollWheelZoom={true}
        className={cn("h-[500px] w-full rounded-lg border", className)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBoundsToCounty geometry={countyGeometry} />
        <CountyBoundaryLayer geometry={countyGeometry} />
        {overlayData && overlayData.features.length > 0 && (
          <OverlayLayer data={overlayData} />
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
