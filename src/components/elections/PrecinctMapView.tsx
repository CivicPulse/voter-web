import { useState, useCallback, useMemo, useEffect } from "react"
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet"
import type { Layer, PathOptions } from "leaflet"
import type { Feature, MultiPolygon, Polygon } from "geojson"
import { AlertCircle, Loader2 } from "lucide-react"
import { cn, escapeHtml, stripCountySuffix } from "@/lib/utils"
import { safeBbox, featuresWithGeometry } from "@/lib/geo"
import { getPartyColor, getLeadingCandidate } from "@/types/elections"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface PrecinctMapViewProps {
  electionId: string
  countyNames: string[]
  districtName: string
  candidateColorMap?: CandidateColorMap
  className?: string
}

function isReported(status: string): boolean {
  return status === "Reported" || status === "Fully Reported"
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
}: PrecinctMapViewProps) {
  const [selectedCounty, setSelectedCounty] = useState<string | undefined>(
    undefined,
  )
  const [showCountyOverlay, setShowCountyOverlay] = useState(true)
  const [showDistrictOutline, setShowDistrictOutline] = useState(true)

  const {
    data: geoJSON,
    isLoading,
    isLoadingBoundaries,
    isBoundaryError,
    isElectionError,
    dataUpdatedAt,
  } = useMergedPrecinctGeoJSON(electionId, countyNames, selectedCounty)

  const { data: allCountyBoundaries, isError: isCountyBoundaryError } = useCountyBoundaries()
  const { geometry: districtGeometry, boundaryType } =
    useDistrictBoundary(districtName)

  const sortedCounties = useMemo(
    () => [...countyNames].sort((a, b) => a.localeCompare(b)),
    [countyNames],
  )

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
      setSelectedCounty(countyFullName)
    },
    [],
  )

  const hasRenderableFeatures = useMemo(
    () => geoJSON && featuresWithGeometry(geoJSON).features.length > 0,
    [geoJSON],
  )

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Controls row: county filter + layer toggles */}
      <div className="flex items-center gap-2 flex-wrap">
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
        {isBoundaryError && !isLoadingBoundaries && (
          <span className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Some boundary data unavailable
          </span>
        )}

        {/* Layer toggles */}
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-1.5">
            <Checkbox
              id="county-overlay"
              checked={showCountyOverlay}
              disabled={isCountyBoundaryError}
              onCheckedChange={(checked) =>
                setShowCountyOverlay(checked === true)
              }
            />
            <Label htmlFor="county-overlay" className="text-sm cursor-pointer">
              Counties
            </Label>
          </div>
          {boundaryType && (
            <div className="flex items-center gap-1.5">
              <Checkbox
                id="district-outline"
                checked={showDistrictOutline}
                onCheckedChange={(checked) =>
                  setShowDistrictOutline(checked === true)
                }
              />
              <Label
                htmlFor="district-outline"
                className="text-sm cursor-pointer"
              >
                District outline
              </Label>
            </div>
          )}
        </div>
      </div>

      {/* Map — z-0 creates a stacking context so Leaflet's internal
           z-indices (400+) don't compete with the county dropdown portal */}
      <div className="relative z-0 h-[350px] sm:h-[500px] md:h-[600px] rounded-lg overflow-hidden">
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
                <CountyOverlayLayer
                  counties={filteredCountyBoundaries}
                  countyNames={countyNames}
                  onCountyDblClick={handleCountyDblClick}
                />
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
      </div>
    </div>
  )
}
