import { useCallback, useEffect } from "react"
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet"
import type { Layer, PathOptions } from "leaflet"
import type { Feature, MultiPolygon, Polygon } from "geojson"
import { cn } from "@/lib/utils"
import { safeBbox } from "@/lib/geo"
import {
  getPartyColor,
  getLeadingCandidate,
  getReportingPercentage,
} from "@/types/elections"
import type {
  CountyResultFeatureCollection,
  CountyResultGeoProperties,
} from "@/types/elections"
import type { CandidateColorMap } from "@/lib/candidate-colors"
import { DistrictOutlineLayer } from "@/components/elections/DistrictOutlineLayer"

interface ElectionResultsMapProps {
  geoJSON: CountyResultFeatureCollection
  selectedCounty: string | null
  onCountyClick: (countyName: string) => void
  districtGeometry?: Polygon | MultiPolygon | null
  showDistrictOutline?: boolean
  candidateColorMap?: CandidateColorMap
  className?: string
}

const HOVER_STYLE: PathOptions = {
  weight: 3,
  fillOpacity: 0.7,
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
  selectedCounty,
  onCountyClick,
  candidateColorMap,
}: Omit<ElectionResultsMapProps, "className">) {
  const style = useCallback(
    (feature?: Feature<Polygon | MultiPolygon, CountyResultGeoProperties>) => {
      if (!feature) return {}
      const props = feature.properties
      const isSelected = props.county_name === selectedCounty

      const leader = getLeadingCandidate(props.candidates ?? [])
      const mapped = leader ? candidateColorMap?.get(leader.id) : undefined
      const fillColor = mapped?.fill
        ?? getPartyColor(props.leading_candidate_party).fill
      const fillOpacity = isSelected ? 0.85 : 0.6

      return {
        color: isSelected ? "#000" : "#374151",
        weight: isSelected ? 2.5 : 1,
        fillColor,
        fillOpacity,
        opacity: 0.8,
      } satisfies PathOptions
    },
    [candidateColorMap, selectedCounty],
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

      let leadingCandidate = "No votes reported"
      if (props.leading_candidate_name) {
        leadingCandidate = `${props.leading_candidate_name} (${props.leading_candidate_party})`
      } else if (props.candidates?.length) {
        const sorted = [...props.candidates].sort(
          (a, b) => b.vote_count - a.vote_count,
        )
        if (sorted[0].vote_count > 0) {
          leadingCandidate = `${sorted[0].name} (${sorted[0].political_party})`
        }
      }

      layer.bindTooltip(
        `<div class="text-sm">
          <div class="font-semibold">${props.county_name}</div>
          <div>${reportingPct}% reporting</div>
          <div>${leadingCandidate}</div>
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
      key={selectedCounty ?? "none"}
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
  selectedCounty,
  onCountyClick,
  districtGeometry,
  showDistrictOutline = true,
  candidateColorMap,
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
        selectedCounty={selectedCounty}
        onCountyClick={onCountyClick}
        candidateColorMap={candidateColorMap}
      />
      {showDistrictOutline && districtGeometry && (
        <DistrictOutlineLayer geometry={districtGeometry} />
      )}
    </MapContainer>
  )
}
