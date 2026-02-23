import { useCallback, useEffect, useMemo, useRef } from "react"
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet"
import { useNavigate } from "@tanstack/react-router"
import type { PathOptions } from "leaflet"
import type { Feature, MultiPolygon, Polygon } from "geojson"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { geometryToLeafletBounds } from "@/lib/geo"
import { slugify } from "@/lib/slugs"
import { OverlayLayer } from "@/components/OverlayLayer"
import type { BoundaryFeatureCollection } from "@/types/boundary"
import type { Election } from "@/types/elections"
import type { CountyFeatureCollection, CountyProperties } from "@/types/boundaries"

const DEFAULT_CENTER: [number, number] = [39.8283, -98.5795]
const DEFAULT_ZOOM = 4

const DISTRICT_STYLE: PathOptions = {
  color: "#1e40af",
  weight: 3,
  fillColor: "#3b82f6",
  fillOpacity: 0.15,
  opacity: 1,
}

const DISTRICT_OVERLAY_STYLE: PathOptions = {
  color: "#1e3a8a",
  weight: 5,
  fillColor: "transparent",
  fillOpacity: 0,
  opacity: 1,
}

const COUNTY_OUTLINE_STYLE: PathOptions = {
  color: "#6b7280",
  weight: 2,
  fillColor: "transparent",
  fillOpacity: 0,
  opacity: 0.7,
  dashArray: "6 4",
}

const COUNTY_SELECTED_STYLE: PathOptions = {
  color: "#7c3aed",
  weight: 2.5,
  fillColor: "#8b5cf6",
  fillOpacity: 0.25,
  opacity: 0.9,
  dashArray: undefined,
}

interface DistrictDetailMapProps {
  districtGeometry?: Record<string, unknown> | null
  counties?: CountyFeatureCollection | null
  overlayData?: BoundaryFeatureCollection | null
  activeElections?: Election[]
  stateAbbrev?: string
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
  overlayActive = false,
}: Readonly<{ geometry: Record<string, unknown>; overlayActive?: boolean }>) {
  const geoJsonData = useMemo(
    () => ({
      type: "Feature" as const,
      geometry: geometry as unknown as MultiPolygon | Polygon,
      properties: {},
    }),
    [geometry],
  )

  const style = useCallback(
    () => ({ ...(overlayActive ? DISTRICT_OVERLAY_STYLE : DISTRICT_STYLE) }),
    [overlayActive],
  )

  return <GeoJSON data={geoJsonData} style={style} interactive={false} />
}

function CountyOutlinesLayer({
  counties,
}: Readonly<{ counties: CountyFeatureCollection }>) {
  const selectedLayerRef = useRef<import("leaflet").Layer | null>(null)

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

      layer.on({
        click: () => {
          const path = layer as unknown as import("leaflet").Path
          // Deselect previous selection
          if (selectedLayerRef.current && selectedLayerRef.current !== layer) {
            const prev =
              selectedLayerRef.current as unknown as import("leaflet").Path
            prev.setStyle(COUNTY_OUTLINE_STYLE)
          }
          // Select this county
          path.setStyle(COUNTY_SELECTED_STYLE)
          selectedLayerRef.current = layer
        },
        popupclose: () => {
          if (selectedLayerRef.current === layer) {
            const path = layer as unknown as import("leaflet").Path
            path.setStyle(COUNTY_OUTLINE_STYLE)
            selectedLayerRef.current = null
          }
        },
      })
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
  overlayData,
  activeElections,
  stateAbbrev,
  isDistrictLoading,
  isCountiesLoading,
  className,
}: Readonly<DistrictDetailMapProps>) {
  const navigate = useNavigate()

  const handleDistrictDblClick = useCallback(
    (
      _featureId: string,
      boundaryType: string,
      name: string,
      county: string | null,
      _boundaryIdentifier: string,
    ) => {
      if (!stateAbbrev) {
        if (import.meta.env.DEV) {
          console.warn("[DistrictDetailMap] handleDistrictDblClick: stateAbbrev is undefined; navigation skipped")
        }
        return
      }
      const typeSlug = slugify(boundaryType)
      const nameSlug = slugify(name)
      if (county) {
        navigate({
          to: "/districts/$state/$county/$type/$name",
          params: {
            state: stateAbbrev,
            county: slugify(county),
            type: typeSlug,
            name: nameSlug,
          },
        })
      } else {
        navigate({
          to: "/districts/$state/$type/$name",
          params: {
            state: stateAbbrev,
            type: typeSlug,
            name: nameSlug,
          },
        })
      }
    },
    [navigate, stateAbbrev],
  )

  const isLoading = isDistrictLoading || isCountiesLoading
  const hasOverlay = !!(overlayData && overlayData.features.length > 0)

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
        {districtGeometry && (
          <FitBoundsToDistrict geometry={districtGeometry} />
        )}
        {districtGeometry && !hasOverlay && (
          <DistrictBoundaryLayer geometry={districtGeometry} />
        )}
        {counties && <CountyOutlinesLayer counties={counties} />}
        {hasOverlay && (
          <OverlayLayer
            data={overlayData!}
            activeElections={activeElections}
            onDistrictDblClick={handleDistrictDblClick}
          />
        )}
        {districtGeometry && hasOverlay && (
          <DistrictBoundaryLayer geometry={districtGeometry} overlayActive />
        )}
      </MapContainer>
      {isLoading && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-[1000] -translate-x-1/2">
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
