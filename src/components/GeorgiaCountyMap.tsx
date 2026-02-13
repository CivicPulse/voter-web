import { useCallback, useEffect } from "react"
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet"
import { useNavigate } from "@tanstack/react-router"
import type { Layer, LeafletMouseEvent, PathOptions, LeafletEvent } from "leaflet"
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

function CountyGeoJSON({ data }: Readonly<{ data: CountyFeatureCollection }>) {
  const map = useMap()
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: LeafletEvent) => {
      const popup = (
        e as LeafletEvent & {
          popup: { getElement: () => HTMLElement | undefined }
        }
      ).popup
      const container = popup?.getElement()
      if (!container) return

      const link = container.querySelector(
        "[data-county-id]",
      ) as HTMLAnchorElement | null
      if (!link) return

      link.addEventListener("click", (event: MouseEvent) => {
        event.preventDefault()
        const countyId = link.dataset.countyId
        if (countyId) {
          navigate({ to: "/counties/$countyId", params: { countyId } })
        }
      })
    }

    map.on("popupopen", handler)
    return () => {
      map.off("popupopen", handler)
    }
  }, [map, navigate])

  const style = useCallback(() => ({ ...DEFAULT_STYLE }), [])

  const onEachFeature = useCallback(
    (
      feature: Feature<MultiPolygon | Polygon, CountyProperties>,
      layer: Layer,
    ) => {
      const props = feature.properties
      const featureId = feature.id ?? ""

      layer.bindPopup(
        `<div class="p-1">
          <p class="font-semibold text-sm">${props.name} County</p>
          <p class="text-xs text-muted-foreground">ID: ${props.boundary_identifier}</p>
          <a href="/counties/${featureId}"
             data-county-id="${featureId}"
             class="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline">
            View Details &rarr;
          </a>
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
    <GeoJSON
      key={data.features.length}
      data={data}
      style={style}
      onEachFeature={onEachFeature}
    />
  )
}

export function GeorgiaCountyMap({ data, className }: Readonly<GeorgiaCountyMapProps>) {
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
      <CountyGeoJSON data={data} />
    </MapContainer>
  )
}
