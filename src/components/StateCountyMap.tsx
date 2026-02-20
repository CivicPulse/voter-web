import { useCallback, useEffect } from "react"
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet"
import { useNavigate } from "@tanstack/react-router"
import type { Layer, LeafletMouseEvent, PathOptions, LeafletEvent } from "leaflet"
import type { Feature, MultiPolygon, Polygon } from "geojson"
import { bbox } from "@turf/bbox"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { countySlugPath, districtSlugPath, slugify } from "@/lib/slugs"
import { fipsToAbbrev } from "@/lib/states"
import { OverlayLayer } from "@/components/OverlayLayer"
import type {
  CountyFeatureCollection,
  CountyProperties,
} from "@/types/boundaries"
import type { BoundaryFeatureCollection } from "@/types/boundary"
import type { Election } from "@/types/elections"
import type { ElectedOfficialSummaryResponse } from "@/types/elected-officials"

const US_CENTER: [number, number] = [39.8283, -98.5795]
const US_ZOOM = 4

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

interface StateCountyMapProps {
  data?: CountyFeatureCollection | null
  overlayData?: BoundaryFeatureCollection | null
  activeElections?: Election[]
  electedOfficials?: Map<string, ElectedOfficialSummaryResponse[]>
  isCountiesLoading?: boolean
  isOverlayLoading?: boolean
  className?: string
}

function FitBoundsToData({ data }: Readonly<{ data: CountyFeatureCollection }>) {
  const map = useMap()

  useEffect(() => {
    if (data.features.length === 0) return
    const [minLng, minLat, maxLng, maxLat] = bbox(data)
    map.fitBounds(
      [
        [minLat, minLng],
        [maxLat, maxLng],
      ],
      { padding: [20, 20] },
    )
  }, [map, data])

  return null
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

export function StateCountyMap({
  data,
  overlayData,
  activeElections,
  electedOfficials,
  isCountiesLoading,
  isOverlayLoading,
  className,
}: Readonly<StateCountyMapProps>) {
  const navigate = useNavigate()

  const handleDistrictDblClick = useCallback(
    (
      _featureId: string,
      boundaryType: string,
      name: string,
      county: string | null,
      boundaryIdentifier: string,
    ) => {
      const stateAbbrev = fipsToAbbrev(boundaryIdentifier.slice(0, 2))
      if (!stateAbbrev) return
      const slugPath = districtSlugPath(name, boundaryType, stateAbbrev, county)
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
    [navigate],
  )

  const isLoading = isCountiesLoading || isOverlayLoading

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={US_CENTER}
        zoom={US_ZOOM}
        scrollWheelZoom={true}
        doubleClickZoom={false}
        className={cn("h-full w-full rounded-lg border", className)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {data && <FitBoundsToData data={data} />}
        {data && <CountyGeoJSON data={data} />}
        {overlayData && overlayData.features.length > 0 && (
          <OverlayLayer
            data={overlayData}
            activeElections={activeElections}
            electedOfficials={electedOfficials}
            onDistrictDblClick={handleDistrictDblClick}
          />
        )}
      </MapContainer>
      {isLoading && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-[1000] -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-md bg-background/90 px-3 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isCountiesLoading
              ? "Loading county boundaries…"
              : "Loading districts…"}
          </div>
        </div>
      )}
    </div>
  )
}
