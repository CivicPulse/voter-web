import { useCallback, useMemo, useEffect } from "react"
import { MapContainer, TileLayer, GeoJSON, Pane, useMap } from "react-leaflet"
import type { Layer, PathOptions } from "leaflet"
import type { Feature, MultiPolygon, Polygon } from "geojson"
import { AlertCircle, Loader2 } from "lucide-react"
import { cn, escapeHtml, stripCountySuffix } from "@/lib/utils"
import { safeBbox, featuresWithGeometry } from "@/lib/geo"
import { getPartyColor, getLeadingCandidate, isReported } from "@/types/elections"
import type {
  PrecinctResultFeatureCollection,
  PrecinctResultGeoProperties,
} from "@/types/elections"
import type { CandidateColorMap } from "@/lib/candidate-colors"
import { useMergedPrecinctGeoJSON } from "@/lib/hooks/use-merged-precinct-geojson"
import { useCountyBoundaries } from "@/hooks/useCountyBoundaries"
import { useDistrictBoundary } from "@/hooks/useDistrictBoundary"
import { DistrictOutlineLayer } from "@/components/elections/DistrictOutlineLayer"
import { DISTRICT_COLORS } from "@/lib/colors"
import type { CountyFeatureCollection, CountyProperties } from "@/types/boundaries"
import { Progress } from "@/components/ui/progress"

interface PrecinctMapViewProps {
  electionId: string
  countyNames: string[]
  districtName: string
  candidateColorMap?: CandidateColorMap
  className?: string
  selectedCounty: string | undefined
  onCountySelect: (county: string | undefined) => void
  showCountyOverlay: boolean
  showDistrictOutline: boolean
}

const HOVER_STYLE: PathOptions = {
  weight: 3,
  fillOpacity: 0.7,
}

// Must stay below Leaflet's default overlayPane (z-index 400) so precincts remain interactive
const COUNTY_OVERLAY_Z_INDEX = 350

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

function CountyOverlayLayer({
  counties,
  countyNames,
  onCountyDblClick,
}: Readonly<{
  counties: CountyFeatureCollection
  countyNames: string[]
  onCountyDblClick?: (countyFullName: string) => void
}>) {
  const colorMap = useMemo(() => {
    const sorted = [...countyNames]
      .map((n) => stripCountySuffix(n))
      .sort((a, b) => a.localeCompare(b))
    const map = new Map<string, number>()
    sorted.forEach((name, i) => map.set(name.toLowerCase(), i))
    return map
  }, [countyNames])

  const style = useCallback(
    (feature?: Feature<Polygon | MultiPolygon, CountyProperties>) => {
      if (!feature) return {}
      const name = feature.properties.name
      const index = colorMap.get(name.toLowerCase()) ?? 0
      const palette = DISTRICT_COLORS[index % DISTRICT_COLORS.length]
      return {
        fillColor: palette.fill,
        fillOpacity: 0.18,
        color: "#9ca3af",
        weight: 1,
        opacity: 0.6,
      } satisfies PathOptions
    },
    [colorMap],
  )

  const onEachFeature = useCallback(
    (
      feature: Feature<Polygon | MultiPolygon, CountyProperties>,
      layer: Layer,
    ) => {
      layer.on({
        dblclick: () => {
          if (onCountyDblClick) {
            onCountyDblClick(`${feature.properties.name} County`)
          }
        },
      })
    },
    [onCountyDblClick],
  )

  return (
    <GeoJSON
      key={`county-overlay-${counties.features.length}`}
      data={counties}
      style={style as (feature?: Feature) => PathOptions}
      onEachFeature={
        onEachFeature as (feature: Feature, layer: Layer) => void
      }
    />
  )
}


function PrecinctLayer({
  geoJSON,
  dataUpdatedAt,
  candidateColorMap,
}: {
  geoJSON: PrecinctResultFeatureCollection
  dataUpdatedAt: number
  candidateColorMap?: CandidateColorMap
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

      if (isReported(props.reporting_status)) {
        const leader = getLeadingCandidate(props.candidates)
        const mapped = leader ? candidateColorMap?.get(leader.id) : undefined
        fillColor = mapped?.fill
          ?? (leader ? getPartyColor(leader.political_party).fill : "#9ca3af")
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
    [candidateColorMap],
  )

  const onEachFeature = useCallback(
    (
      feature: Feature<Polygon | MultiPolygon, PrecinctResultGeoProperties>,
      layer: Layer,
    ) => {
      const props = feature.properties
      const hasResults = isReported(props.reporting_status)

      let candidateLines: string
      if (hasResults) {
        candidateLines = props.candidates
          .slice()
          .sort((a, b) => b.vote_count - a.vote_count)
          .slice(0, 3)
          .map(
            (c) =>
              `<div>${escapeHtml(c.name)}: ${c.vote_count.toLocaleString()}</div>`,
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
  districtName,
  candidateColorMap,
  className,
  selectedCounty,
  onCountySelect,
  showCountyOverlay,
  showDistrictOutline,
}: PrecinctMapViewProps) {
  const {
    data: geoJSON,
    isLoading,
    isLoadingBoundaries,
    isBoundaryError,
    isElectionError,
    dataUpdatedAt,
    boundaryProgress,
  } = useMergedPrecinctGeoJSON(electionId, countyNames, selectedCounty)

  const { data: allCountyBoundaries } = useCountyBoundaries()
  const { geometry: districtGeometry } =
    useDistrictBoundary(districtName)

  const filteredCountyBoundaries = useMemo(() => {
    if (!allCountyBoundaries) return null
    const bareNames = new Set(
      countyNames.map((n) => stripCountySuffix(n).toLowerCase()),
    )
    const filtered = allCountyBoundaries.features.filter((f) =>
      bareNames.has(f.properties.name.toLowerCase()),
    )
    if (filtered.length === 0) return null
    return { ...allCountyBoundaries, features: filtered } as CountyFeatureCollection
  }, [allCountyBoundaries, countyNames])

  const handleCountyDblClick = useCallback(
    (countyFullName: string) => {
      onCountySelect(countyFullName)
    },
    [onCountySelect],
  )

  const hasRenderableFeatures = useMemo(
    () => geoJSON && featuresWithGeometry(geoJSON).features.length > 0,
    [geoJSON],
  )

  return (
    <div className={cn("relative z-0 h-[350px] sm:h-[500px] md:h-[600px] rounded-lg overflow-hidden", className)}>
        <MapContainer
          center={GA_CENTER}
          zoom={GA_ZOOM}
          scrollWheelZoom={true}
          doubleClickZoom={false}
          className="h-full w-full rounded-lg border"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hasRenderableFeatures && geoJSON ? (
            <>
              <FitBoundsToPrecincts geoJSON={geoJSON} />
              {showCountyOverlay && filteredCountyBoundaries && (
                <Pane name="county-overlay" style={{ zIndex: COUNTY_OVERLAY_Z_INDEX }}>
                  <CountyOverlayLayer
                    counties={filteredCountyBoundaries}
                    countyNames={countyNames}
                    onCountyDblClick={handleCountyDblClick}
                  />
                </Pane>
              )}
              <PrecinctLayer geoJSON={geoJSON} dataUpdatedAt={dataUpdatedAt} candidateColorMap={candidateColorMap} />
              {/* District outline renders above precincts for visibility;
                  interactive={false} lets mouse events pass through to precincts */}
              {showDistrictOutline && districtGeometry && (
                <DistrictOutlineLayer geometry={districtGeometry} />
              )}
            </>
          ) : null}
        </MapContainer>

        {/* Initial loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error / empty state overlay */}
        {!isLoading && isElectionError && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg">
            <p className="text-destructive text-sm flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" />
              Failed to load precinct results. Please try again.
            </p>
          </div>
        )}
        {!isLoading && !isElectionError && !hasRenderableFeatures && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg">
            <p className="text-muted-foreground text-sm">
              Precinct boundaries are not available for this election.
            </p>
          </div>
        )}

        {/* Boundary loading progress overlay */}
        {isLoadingBoundaries && boundaryProgress.total > 1 && (
          <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-1.5 rounded-lg bg-background/90 px-3 py-2 shadow-md border text-sm w-56">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Loading boundaries…</span>
              <span>
                {Math.round(
                  (boundaryProgress.loaded / boundaryProgress.total) * 100,
                )}
                %
              </span>
            </div>
            <Progress
              value={
                (boundaryProgress.loaded / boundaryProgress.total) * 100
              }
              className="h-2"
            />
            <span className="text-xs text-muted-foreground">
              {boundaryProgress.loaded} / {boundaryProgress.total} counties
            </span>
          </div>
        )}

        {/* Single-county boundary loading indicator */}
        {isLoadingBoundaries && !isLoading && boundaryProgress.total <= 1 && (
          <div className="absolute bottom-4 right-4 z-[1000] flex items-center gap-1.5 rounded-lg bg-background/90 px-3 py-2 shadow-md border text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading precinct boundaries&hellip;</span>
          </div>
        )}

        {/* Boundary error overlay */}
        {isBoundaryError && !isLoadingBoundaries && hasRenderableFeatures && (
          <div className="absolute top-4 right-4 z-[1000] flex items-center gap-1.5 rounded-lg bg-background/90 px-3 py-2 shadow-md border text-sm">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-destructive">Some boundary data unavailable</span>
          </div>
        )}
      </div>
  )
}
