import { useCallback, useEffect } from "react"
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet"
import { useNavigate } from "@tanstack/react-router"
import type { Layer, LeafletMouseEvent, PathOptions, LeafletEvent } from "leaflet"
import type { Feature, MultiPolygon, Polygon } from "geojson"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { countySlugPath, slugify } from "@/lib/slugs"
import { fipsToAbbrev } from "@/lib/states"
import { OverlayLayer } from "@/components/OverlayLayer"
import type {
  CountyFeatureCollection,
  CountyProperties,
} from "@/types/boundaries"
import type { BoundaryFeatureCollection } from "@/types/boundary"

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
  overlayData?: BoundaryFeatureCollection | null
  isOverlayLoading?: boolean
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
        "[data-county-state]",
      ) as HTMLAnchorElement | null
      if (!link) return

      link.addEventListener("click", (event: MouseEvent) => {
        event.preventDefault()
        const state = link.dataset.countyState
        const county = link.dataset.countySlug
        if (state && county) {
          navigate({
            to: "/counties/$state/$county",
            params: { state, county },
          })
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
      const slugPath = countySlugPath(props.name, props.boundary_identifier)
      const stateAbbrev = fipsToAbbrev(props.boundary_identifier.slice(0, 2)) ?? ""
      const countySlug = slugify(props.name)

      const detailLink = slugPath
        ? `<a href="${slugPath}"
             data-county-state="${stateAbbrev}"
             data-county-slug="${countySlug}"
             class="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline">
            View Details &rarr;
          </a>`
        : ""

      layer.bindPopup(
        `<div class="p-1">
          <p class="font-semibold text-sm">${props.name} County</p>
          <p class="text-xs text-muted-foreground">ID: ${props.boundary_identifier}</p>
          ${detailLink}
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
        dblclick: () => {
          if (slugPath && stateAbbrev && countySlug) {
            navigate({
              to: "/counties/$state/$county",
              params: { state: stateAbbrev, county: countySlug },
            })
          }
        },
      })
    },
    [navigate],
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

export function GeorgiaCountyMap({
  data,
  overlayData,
  isOverlayLoading,
  className,
}: Readonly<GeorgiaCountyMapProps>) {
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
        <CountyGeoJSON data={data} />
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
