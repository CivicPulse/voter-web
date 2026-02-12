import { useCallback } from "react"
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet"
import type { Layer, LeafletMouseEvent, PathOptions } from "leaflet"
import type { Feature, MultiPolygon, Polygon } from "geojson"
import { cn } from "@/lib/utils"
import type {
  CountyFeatureCollection,
  CountyProperties,
} from "@/types/boundaries"

const GA_CENTER: [number, number] = [32.6791, -83.6233]
const GA_ZOOM = 7

const DEFAULT_STYLE: PathOptions = {
  color: "#6b7280",
  weight: 1,
  fillColor: "#3b82f6",
  fillOpacity: 0.15,
  opacity: 0.8,
}

const HOVER_STYLE: PathOptions = {
  weight: 2,
  fillColor: "#2563eb",
  fillOpacity: 0.4,
  opacity: 1,
}

interface GeorgiaCountyMapProps {
  data: CountyFeatureCollection
  className?: string
}

export function GeorgiaCountyMap({ data, className }: GeorgiaCountyMapProps) {
  const style = useCallback(
    () => ({ ...DEFAULT_STYLE }),
    [],
  )

  const onEachFeature = useCallback(
    (
      feature: Feature<MultiPolygon | Polygon, CountyProperties>,
      layer: Layer,
    ) => {
      const props = feature.properties
      layer.bindPopup(
        `<div class="p-1">
          <p class="font-semibold text-sm">${props.name} County</p>
          <p class="text-xs text-muted-foreground">ID: ${props.boundary_identifier}</p>
        </div>`,
      )

      layer.on({
        mouseover: (e: LeafletMouseEvent) => {
          const target = e.target
          target.setStyle(HOVER_STYLE)
          target.bringToFront()
        },
        mouseout: (e: LeafletMouseEvent) => {
          const target = e.target
          target.setStyle(DEFAULT_STYLE)
        },
      })
    },
    [],
  )

  return (
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
      <GeoJSON
        key={data.features.length}
        data={data}
        style={style}
        onEachFeature={onEachFeature}
      />
    </MapContainer>
  )
}
