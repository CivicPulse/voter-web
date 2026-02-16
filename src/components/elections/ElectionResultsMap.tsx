import { useCallback, useEffect, useMemo } from "react"
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet"
import type { Layer, PathOptions } from "leaflet"
import type { Feature, MultiPolygon, Polygon } from "geojson"
import { cn } from "@/lib/utils"
import { safeBbox } from "@/lib/geo"
import {
  getPartyColor,
  getReportingPercentage,
} from "@/types/elections"
import type {
  CountyResultFeatureCollection,
  CountyResultGeoProperties,
  MapDataLayer,
} from "@/types/elections"
import { DistrictOutlineLayer } from "@/components/elections/DistrictOutlineLayer"

interface ElectionResultsMapProps {
  geoJSON: CountyResultFeatureCollection
  activeLayer: MapDataLayer
  selectedCounty: string | null
  onCountyClick: (countyName: string) => void
  districtGeometry?: Polygon | MultiPolygon | null
  showDistrictOutline?: boolean
  className?: string
}

const HOVER_STYLE: PathOptions = {
  weight: 3,
  fillOpacity: 0.7,
}

/** Sequential blue scale for percentage-based layers */
function getSequentialColor(value: number, max: number): string {
  if (max === 0) return "#e5e7eb"
  const ratio = Math.min(value / max, 1)
  // Light gray → dark blue gradient
  const colors = ["#eff6ff", "#bfdbfe", "#60a5fa", "#2563eb", "#1e3a8a"]
  const index = Math.min(Math.floor(ratio * (colors.length - 1)), colors.length - 1)
  return colors[index]
}

function FitBoundsToGeoJSON({ geoJSON }: { geoJSON: CountyResultFeatureCollection }) {
  const map = useMap()

  useEffect(() => {
    const bounds = safeBbox(geoJSON)
    if (!bounds) return
    const [west, south, east, north] = bounds
    map.fitBounds(
      [
        [south, west],
        [north, east],
      ],
      { padding: [20, 20] },
    )
  }, [map, geoJSON])

  return null
}

function CountyLayer({
  geoJSON,
  activeLayer,
  selectedCounty,
  onCountyClick,
}: Omit<ElectionResultsMapProps, "className">) {
  const maxVotes = useMemo(() => {
    if (geoJSON.features.length === 0) return 0
    return Math.max(
      ...geoJSON.features.map((f) => f.properties.total_votes),
    )
  }, [geoJSON])

  const style = useCallback(
    (feature?: Feature<Polygon | MultiPolygon, CountyResultGeoProperties>) => {
      if (!feature) return {}
      const props = feature.properties
      const isSelected = props.county_name === selectedCounty

      let fillColor: string
      let fillOpacity = 0.6

      switch (activeLayer) {
        case "leading_candidate":
          fillColor = getPartyColor(props.leading_candidate_party).fill
          break
        case "precincts_reporting": {
          const pct = getReportingPercentage(
            props.precincts_reporting,
            props.precincts_participating,
          )
          fillColor = getSequentialColor(pct, 100)
          break
        }
        case "total_votes":
          fillColor = getSequentialColor(props.total_votes, maxVotes)
          break
      }

      if (isSelected) fillOpacity = 0.85

      return {
        color: isSelected ? "#000" : "#374151",
        weight: isSelected ? 2.5 : 1,
        fillColor,
        fillOpacity,
        opacity: 0.8,
      } satisfies PathOptions
    },
    [activeLayer, maxVotes, selectedCounty],
  )

  const onEachFeature = useCallback(
    (
      feature: Feature<Polygon | MultiPolygon, CountyResultGeoProperties>,
      layer: Layer,
    ) => {
      const props = feature.properties
      const reportingPct = getReportingPercentage(
        props.precincts_reporting,
        props.precincts_participating,
      ).toFixed(1)

      layer.bindTooltip(
        `<div class="text-sm">
          <div class="font-semibold">${props.county_name}</div>
          <div>${reportingPct}% reporting</div>
          <div>${props.leading_candidate_name} (${props.leading_candidate_party})</div>
        </div>`,
        { sticky: true },
      )

      layer.on({
        mouseover: (e) => {
          e.target.setStyle(HOVER_STYLE)
          e.target.bringToFront()
        },
        mouseout: (e) => {
          e.target.setStyle(
            style(feature as Feature<Polygon | MultiPolygon, CountyResultGeoProperties>),
          )
        },
        click: () => {
          onCountyClick(props.county_name)
        },
      })
    },
    [onCountyClick, style],
  )

  return (
    <GeoJSON
      key={`${activeLayer}-${selectedCounty}`}
      data={geoJSON}
      style={style as (feature?: Feature) => PathOptions}
      onEachFeature={
        onEachFeature as (feature: Feature, layer: Layer) => void
      }
    />
  )
}

// Default center: Georgia
const GA_CENTER: [number, number] = [32.6791, -83.6233]
const GA_ZOOM = 7

export function ElectionResultsMap({
  geoJSON,
  activeLayer,
  selectedCounty,
  onCountyClick,
  districtGeometry,
  showDistrictOutline = true,
  className,
}: ElectionResultsMapProps) {
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
      <FitBoundsToGeoJSON geoJSON={geoJSON} />
      <CountyLayer
        geoJSON={geoJSON}
        activeLayer={activeLayer}
        selectedCounty={selectedCounty}
        onCountyClick={onCountyClick}
      />
      {showDistrictOutline && districtGeometry && (
        <DistrictOutlineLayer geometry={districtGeometry} />
      )}
    </MapContainer>
  )
}
