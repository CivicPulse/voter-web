import { useMemo, useState } from "react"
import { Link } from "@tanstack/react-router"
import { ChevronRight, Loader2, Map, Grid3X3, Volume2 } from "lucide-react"
import { useRaceResults } from "@/lib/hooks/use-race-results"
import { useResultsNotification } from "@/lib/hooks/use-results-notification"
import { useResultsNotifications } from "@/lib/hooks/use-results-notifications"
import { useCountyResultsGeoJSON } from "@/lib/hooks/use-race-geojson"
import { useDistrictBoundary } from "@/hooks/useDistrictBoundary"
import { useCountyBoundaries } from "@/hooks/useCountyBoundaries"
import { ElectionResultsMap } from "@/components/elections/ElectionResultsMap"
import { ElectionResultsSection } from "@/components/elections/ElectionResultsSection"
import { PrecinctMapView } from "@/components/elections/PrecinctMapView"
import { CertificationBadge } from "@/components/elections/CertificationBadge"
import { LiveStatusIndicator } from "@/components/elections/LiveStatusIndicator"
import { NotificationToggle } from "@/components/elections/NotificationToggle"
import { ParticipationTab } from "@/components/elections/ParticipationTab"
import { ElectionInfoTab } from "@/components/elections/ElectionInfoTab"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { buildCandidateColorMap } from "@/lib/candidate-colors"

type MapView = "county" | "precinct"

interface ElectionDetailPageProps {
  electionId: string
  tab?: "info" | "results" | "participation"
  onTabChange: (tab: "info" | "results" | "participation") => void
}

export function ElectionDetailPage({
  electionId,
  tab,
  onTabChange,
}: ElectionDetailPageProps) {
  const {
    data: raceData,
    isLoading: raceLoading,
    error: raceError,
    dataUpdatedAt,
  } = useRaceResults(electionId)

  const hasResults = (raceData?.results.candidates.length ?? 0) > 0
  const defaultTab = !raceLoading && hasResults ? "results" : "info"
  const activeTab = tab ?? defaultTab

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
  const [precinctCountyFilter, setPrecinctCountyFilter] = useState<
    string | undefined
  >(undefined)
  const [showCountyOverlay, setShowCountyOverlay] = useState(true)

  const districtName = raceData?.election.district ?? ""
  const { geometry: districtGeometry, boundaryType } =
    useDistrictBoundary(districtName)
  const { isError: isCountyBoundaryError } = useCountyBoundaries()

  const countyNames = useMemo(
    () =>
      raceData?.results.county_results.map((c) => c.county_name) ?? [],
    [raceData?.results.county_results],
  )

  const sortedCounties = useMemo(
    () => [...countyNames].sort((a, b) => a.localeCompare(b)),
    [countyNames],
  )

  const candidateColorMap = useMemo(
    () => buildCandidateColorMap(raceData?.results.candidates ?? []),
    [raceData],
  )

  const isLoading = raceLoading

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
        <p>Failed to load election details. Please try again.</p>
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
        <span className="text-foreground truncate">{election.name}</span>
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

      {/* Tabbed content */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          onTabChange(value as "info" | "results" | "participation")
        }}
      >
        <TabsList>
          <TabsTrigger value="info">Election Information</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="participation">Participation</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <ElectionInfoTab
            election={election}
            electionId={electionId}
          />
        </TabsContent>

        <TabsContent value="results">
          {/* Inline results */}
          <div className="mb-4">
            <ElectionResultsSection
              results={results}
              selectedCounty={selectedCounty}
              onClearCounty={() => setSelectedCounty(null)}
              candidateColorMap={candidateColorMap}
            />
          </div>

          {/* Controls row: view toggle + county filter + layer toggles */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
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

            {mapView === "precinct" && (
              <Select
                value={precinctCountyFilter ?? "all"}
                onValueChange={(v) =>
                  setPrecinctCountyFilter(v === "all" ? undefined : v)
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
            )}

            <div className="flex items-center gap-4 ml-auto">
              {mapView === "precinct" && (
                <div className="flex items-center gap-1.5">
                  <Checkbox
                    id="county-overlay"
                    checked={showCountyOverlay}
                    disabled={isCountyBoundaryError}
                    onCheckedChange={(checked) =>
                      setShowCountyOverlay(checked === true)
                    }
                  />
                  <Label
                    htmlFor="county-overlay"
                    className="text-sm cursor-pointer"
                  >
                    Counties
                  </Label>
                </div>
              )}
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

          {/* Map views */}
          {mapView === "precinct" && (
            <PrecinctMapView
              electionId={electionId}
              countyNames={countyNames}
              districtName={election.district}
              candidateColorMap={candidateColorMap}
              selectedCounty={precinctCountyFilter}
              onCountySelect={setPrecinctCountyFilter}
              showCountyOverlay={showCountyOverlay}
              showDistrictOutline={showDistrictOutline}
            />
          )}

          {mapView === "county" && geoLoading && (
            <div className="h-[350px] sm:h-[500px] md:h-[600px] rounded-lg border flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {mapView === "county" && !geoLoading && hasCountyGeoJSON && (
            <div className="h-[350px] sm:h-[500px] md:h-[600px] rounded-lg overflow-hidden">
              <ElectionResultsMap
                geoJSON={geoJSON}
                selectedCounty={selectedCounty}
                onCountyClick={handleCountyClick}
                districtGeometry={districtGeometry}
                showDistrictOutline={showDistrictOutline}
              />
            </div>
          )}

          {mapView === "county" && !geoLoading && !hasCountyGeoJSON && (
            <div className="h-[400px] flex items-center justify-center border rounded-lg bg-muted/30">
              <p className="text-muted-foreground">
                No geographic data available for this race.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="participation">
          {activeTab === "participation" && (
            <ParticipationTab electionId={electionId} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
