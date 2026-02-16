import { useState, useCallback, useMemo, useEffect } from "react"
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet"
import type { Layer, PathOptions } from "leaflet"
import type { Feature, MultiPolygon, Polygon } from "geojson"
import { Loader2 } from "lucide-react"
import { cn, escapeHtml } from "@/lib/utils"
import { safeBbox, featuresWithGeometry } from "@/lib/geo"
import { getPartyColor, getLeadingCandidate } from "@/types/elections"
import type {
  PrecinctResultFeatureCollection,
  PrecinctResultGeoProperties,
} from "@/types/elections"
import { useMergedPrecinctGeoJSON } from "@/lib/hooks/use-merged-precinct-geojson"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PrecinctMapViewProps {
  electionId: string
  countyNames: string[]
  className?: string
}

const HOVER_STYLE: PathOptions = {
  weight: 3,
  fillOpacity: 0.7,
}

// Default center: Georgia
const GA_CENTER: [number, number] = [32.6791, -83.6233]
const GA_ZOOM = 7

function FitBoundsToPrecincts({
  geoJSON,
}: {
  geoJSON: PrecinctResultFeatureCollection
}) {
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

function PrecinctLayer({
  geoJSON,
  dataUpdatedAt,
}: {
  geoJSON: PrecinctResultFeatureCollection
  dataUpdatedAt: number
}) {
  const filteredGeoJSON = useMemo(
    () => featuresWithGeometry(geoJSON),
    [geoJSON],
  )

  const style = useCallback(
    (feature?: Feature<Polygon | MultiPolygon, PrecinctResultGeoProperties>) => {
      if (!feature) return {}
      const props = feature.properties

      let fillColor: string
      let fillOpacity = 0.6

      if (props.reporting_status === "Reported") {
        const leader = getLeadingCandidate(props.candidates)
        fillColor = leader
          ? getPartyColor(leader.political_party).fill
          : "#9ca3af"
      } else if (props.has_results === false) {
        // Boundary-only precinct with no election results
        fillColor = "#e5e7eb"
        fillOpacity = 0.3
      } else {
        fillColor = "#e5e7eb"
      }

      return {
        color: "#374151",
        weight: 0.5,
        fillColor,
        fillOpacity,
        opacity: 0.8,
      } satisfies PathOptions
    },
    [],
  )

  const onEachFeature = useCallback(
    (
      feature: Feature<Polygon | MultiPolygon, PrecinctResultGeoProperties>,
      layer: Layer,
    ) => {
      const props = feature.properties
      const isReported = props.reporting_status === "Reported"

      let candidateLines: string
      if (isReported) {
        candidateLines = props.candidates
          .slice()
          .sort((a, b) => b.vote_count - a.vote_count)
          .slice(0, 3)
          .map(
            (c) =>
              `<div>${escapeHtml(c.name)} (${escapeHtml(c.political_party)}): ${c.vote_count.toLocaleString()}</div>`,
          )
          .join("")
      } else if (props.has_results === false) {
        candidateLines =
          '<div class="text-muted-foreground italic">No results available</div>'
      } else {
        candidateLines = "<div>Not yet reported</div>"
      }

      layer.bindTooltip(
        `<div class="text-sm">
          <div class="font-semibold">${escapeHtml(props.precinct_name)}</div>
          <div class="text-muted-foreground">${escapeHtml(props.county_name)}</div>
          ${candidateLines}
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
            style(
              feature as Feature<
                Polygon | MultiPolygon,
                PrecinctResultGeoProperties
              >,
            ),
          )
        },
      })
    },
    [style],
  )

  // React-Leaflet GeoJSON doesn't re-render on data prop changes;
  // key forces a remount when feature data changes
  const dataKey = useMemo(() => {
    const features = filteredGeoJSON.features
    return `precincts-${features.length}-${dataUpdatedAt}`
  }, [filteredGeoJSON, dataUpdatedAt])

  return (
    <GeoJSON
      key={dataKey}
      data={filteredGeoJSON}
      style={style as (feature?: Feature) => PathOptions}
      onEachFeature={
        onEachFeature as (feature: Feature, layer: Layer) => void
      }
    />
  )
}

export function PrecinctMapView({
  electionId,
  countyNames,
  className,
}: PrecinctMapViewProps) {
  const [selectedCounty, setSelectedCounty] = useState<string | undefined>(
    undefined,
  )

  const {
    data: geoJSON,
    isLoading,
    isLoadingBoundaries,
    dataUpdatedAt,
  } = useMergedPrecinctGeoJSON(electionId, countyNames, selectedCounty)

  const sortedCounties = useMemo(
    () => [...countyNames].sort((a, b) => a.localeCompare(b)),
    [countyNames],
  )

  const hasRenderableFeatures = useMemo(
    () => geoJSON && featuresWithGeometry(geoJSON).features.length > 0,
    [geoJSON],
  )

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* County filter */}
      <div className="flex items-center gap-2">
        <Select
          value={selectedCounty ?? "all"}
          onValueChange={(v) =>
            setSelectedCounty(v === "all" ? undefined : v)
          }
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filter by county" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All counties</SelectItem>
            {sortedCounties.map((county) => (
              <SelectItem key={county} value={county}>
                {county}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {isLoadingBoundaries && !isLoading && (
          <span className="text-xs text-muted-foreground">
            Loading precinct boundaries…
          </span>
        )}
      </div>

      {/* Map — z-0 creates a stacking context so Leaflet's internal
           z-indices (400+) don't compete with the county dropdown portal */}
      <div className="relative z-0 h-[350px] sm:h-[500px] md:h-[600px] rounded-lg overflow-hidden">
        <MapContainer
          center={GA_CENTER}
          zoom={GA_ZOOM}
          scrollWheelZoom={true}
          className="h-full w-full rounded-lg border"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hasRenderableFeatures && geoJSON ? (
            <>
              <FitBoundsToPrecincts geoJSON={geoJSON} />
              <PrecinctLayer geoJSON={geoJSON} dataUpdatedAt={dataUpdatedAt} />
            </>
          ) : null}
        </MapContainer>

        {/* Empty state overlay */}
        {!isLoading && !hasRenderableFeatures && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg">
            <p className="text-muted-foreground text-sm">
              Precinct boundaries are not available for this election.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
