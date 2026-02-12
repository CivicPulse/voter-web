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

// Distinct, colorblind-friendly palette for district overlays
const DISTRICT_COLORS = [
  { fill: "#e6194b", border: "#a01235" }, // red
  { fill: "#3cb44b", border: "#2a7d34" }, // green
  { fill: "#4363d8", border: "#2e45a0" }, // blue
  { fill: "#f58231", border: "#b55f1e" }, // orange
  { fill: "#911eb4", border: "#6b1685" }, // purple
  { fill: "#42d4f4", border: "#2a9ab0" }, // cyan
  { fill: "#f032e6", border: "#a822a0" }, // magenta
  { fill: "#bfef45", border: "#8ab530" }, // lime
  { fill: "#fabed4", border: "#b58898" }, // pink
  { fill: "#dcbeff", border: "#9a85b5" }, // lavender
  { fill: "#ffe119", border: "#b5a012" }, // yellow
  { fill: "#aaffc3", border: "#78b58a" }, // mint
  { fill: "#808000", border: "#5a5a00" }, // olive
  { fill: "#ffd8b1", border: "#b5987c" }, // apricot
  { fill: "#000075", border: "#000050" }, // navy
  { fill: "#a9a9a9", border: "#757575" }, // grey
]

function getDistrictStyle(index: number): PathOptions {
  const palette = DISTRICT_COLORS[index % DISTRICT_COLORS.length]
  return {
    color: palette.border,
    weight: 1.5,
    fillColor: palette.fill,
    fillOpacity: 0.25,
    opacity: 0.9,
  }
}

const OVERLAY_HOVER_STYLE: PathOptions = {
  weight: 3,
  fillOpacity: 0.45,
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
  const featureIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    data.features.forEach((f, i) => {
      const key = f.properties?.boundary_identifier ?? String(i)
      map.set(key, i)
    })
    return map
  }, [data])

  const style = useCallback(
    (feature?: Feature) => {
      const key = feature?.properties?.boundary_identifier ?? ""
      const index = featureIndexMap.get(key) ?? 0
      return getDistrictStyle(index)
    },
    [featureIndexMap],
  )

  const onEachFeature = useCallback(
    (
      feature: Feature<MultiPolygon | Polygon, BoundaryFeatureProperties>,
      layer: Layer,
    ) => {
      const props = feature.properties
      const displayName = props.name || props.boundary_identifier
      const typeName = props.boundary_type.replaceAll("_", " ")
      const key = props.boundary_identifier ?? ""
      const index = featureIndexMap.get(key) ?? 0
      const defaultStyle = getDistrictStyle(index)

      layer.bindPopup(
        `<div class="p-1">
          <p class="font-semibold text-sm">${displayName}</p>
          <p class="text-xs text-muted-foreground capitalize">${typeName}</p>
        </div>`,
      )

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
    [featureIndexMap],
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
