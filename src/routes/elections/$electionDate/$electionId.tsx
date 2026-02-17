import { useMemo, useState } from "react"
import { createFileRoute, Link, useParams } from "@tanstack/react-router"
import { ChevronRight, Loader2, Map, Grid3X3, Volume2 } from "lucide-react"
import { useRaceResults } from "@/lib/hooks/use-race-results"
import { useResultsNotification } from "@/lib/hooks/use-results-notification"
import { useResultsNotifications } from "@/lib/hooks/use-results-notifications"
import { useCountyResultsGeoJSON } from "@/lib/hooks/use-race-geojson"
import { useDistrictBoundary } from "@/hooks/useDistrictBoundary"
import { ElectionResultsMap } from "@/components/elections/ElectionResultsMap"
import { ElectionResultsSection } from "@/components/elections/ElectionResultsSection"
import { PrecinctMapView } from "@/components/elections/PrecinctMapView"
import { CertificationBadge } from "@/components/elections/CertificationBadge"
import { LiveStatusIndicator } from "@/components/elections/LiveStatusIndicator"
import { NotificationToggle } from "@/components/elections/NotificationToggle"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { buildCandidateColorMap } from "@/lib/candidate-colors"

type MapView = "county" | "precinct"

export const Route = createFileRoute(
  "/elections/$electionDate/$electionId",
)({
  component: RaceResultsPage,
})

function RaceResultsPage() {
  const { electionId, electionDate } = useParams({
    from: "/elections/$electionDate/$electionId",
  })

  const formattedDate = new Date(electionDate + "T00:00:00").toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  )

  const {
    data: raceData,
    isLoading: raceLoading,
    error: raceError,
    dataUpdatedAt,
  } = useRaceResults(electionId)

  const [soundEnabled, setSoundEnabled] = useState(true)

  useResultsNotification(raceData?.results, soundEnabled)

  const {
    data: geoJSON,
    isLoading: geoLoading,
  } = useCountyResultsGeoJSON(electionId)

  const notifications = useResultsNotifications({
    electionName: raceData?.election.name ?? "",
    isActive: raceData?.election.status === "active",
    results: raceData?.results,
  })

  const [selectedCounty, setSelectedCounty] = useState<string | null>(null)
  const [mapView, setMapView] = useState<MapView>("county")
  const [showDistrictOutline, setShowDistrictOutline] = useState(true)

  const districtName = raceData?.election.district ?? ""
  const { geometry: districtGeometry, boundaryType } =
    useDistrictBoundary(districtName)

  const countyNames = useMemo(
    () =>
      raceData?.results.county_results.map((c) => c.county_name) ?? [],
    [raceData?.results.county_results],
  )

  const candidateColorMap = useMemo(
    () => buildCandidateColorMap(raceData?.results.candidates ?? []),
    [raceData],
  )

  const isLoading = raceLoading || geoLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (raceError || !raceData) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>Failed to load race results. Please try again.</p>
      </div>
    )
  }

  const { election, results } = raceData

  const handleCountyClick = (countyName: string) => {
    setSelectedCounty(countyName)
  }

  const hasCountyGeoJSON = geoJSON && geoJSON.features.length > 0

  return (
    <div className="container mx-auto px-4 py-4 sm:p-6 max-w-5xl">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
        <Link to="/elections" className="hover:text-foreground transition-colors">
          Elections
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          to="/elections/$electionDate"
          params={{ electionDate }}
          className="hover:text-foreground transition-colors"
        >
          {formattedDate}
        </Link>
      </nav>

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">{election.name}</h1>
            <p className="text-sm text-muted-foreground">{election.district}</p>
          </div>
          <div className="flex items-center gap-2">
            {election.status === "active" && (
              <NotificationToggle
                enabled={notifications.enabled}
                permission={notifications.permission}
                supported={notifications.supported}
                onToggle={notifications.toggle}
              />
            )}
            <CertificationBadge status={election.status} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <LiveStatusIndicator
            status={election.status}
            lastRefreshedAt={election.last_refreshed_at}
            refreshIntervalSeconds={election.refresh_interval_seconds ?? 20}
            dataUpdatedAt={dataUpdatedAt}
          />
          {election.status === "active" && (
            <div className="flex items-center gap-1.5">
              <Checkbox
                id="notification-sound"
                checked={soundEnabled}
                onCheckedChange={(checked) => setSoundEnabled(checked === true)}
              />
              <Label
                htmlFor="notification-sound"
                className="text-sm cursor-pointer flex items-center gap-1"
              >
                <Volume2 className="h-3.5 w-3.5" />
                Sound alerts
              </Label>
            </div>
          )}
        </div>
      </div>

      {/* Inline results */}
      <div className="mb-4">
        <ElectionResultsSection
          results={results}
          selectedCounty={selectedCounty}
          onClearCounty={() => setSelectedCounty(null)}
          candidateColorMap={candidateColorMap}
        />
      </div>

      {/* Controls row: view toggle + layer selector */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <ToggleGroup
          type="single"
          value={mapView}
          onValueChange={(v) => {
            if (v) setMapView(v as MapView)
          }}
        >
          <ToggleGroupItem value="county" aria-label="County view">
            <Map className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">County</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="precinct" aria-label="Precinct view">
            <Grid3X3 className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Precinct</span>
          </ToggleGroupItem>
        </ToggleGroup>

        {mapView === "county" && (
          <div className="flex items-center gap-4">
            {boundaryType && (
              <div className="flex items-center gap-1.5">
                <Checkbox
                  id="county-map-district-outline"
                  checked={showDistrictOutline}
                  onCheckedChange={(checked) =>
                    setShowDistrictOutline(checked === true)
                  }
                />
                <Label
                  htmlFor="county-map-district-outline"
                  className="text-sm cursor-pointer"
                >
                  District outline
                </Label>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map views */}
      {mapView === "precinct" && (
        <PrecinctMapView
          electionId={electionId}
          countyNames={countyNames}
          districtName={election.district}
          candidateColorMap={candidateColorMap}
        />
      )}

      {mapView === "county" && hasCountyGeoJSON && (
        <div className="h-[350px] sm:h-[500px] md:h-[600px] rounded-lg overflow-hidden">
          <ElectionResultsMap
            geoJSON={geoJSON}
            selectedCounty={selectedCounty}
            onCountyClick={handleCountyClick}
            districtGeometry={districtGeometry}
            showDistrictOutline={showDistrictOutline}
            candidateColorMap={candidateColorMap}
          />
        </div>
      )}

      {mapView === "county" && !hasCountyGeoJSON && (
        <div className="h-[400px] flex items-center justify-center border rounded-lg bg-muted/30">
          <p className="text-muted-foreground">
            No geographic data available for this race.
          </p>
        </div>
      )}
    </div>
  )
}
