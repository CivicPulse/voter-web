import { useMemo, useState } from "react"
import { createFileRoute, useParams } from "@tanstack/react-router"
import { Loader2, Map, Grid3X3 } from "lucide-react"
import { useRaceResults } from "@/lib/hooks/use-race-results"
import { useCountyResultsGeoJSON } from "@/lib/hooks/use-race-geojson"
import { ElectionResultsMap } from "@/components/elections/ElectionResultsMap"
import { ElectionResultsDrawer } from "@/components/elections/ElectionResultsDrawer"
import { PrecinctMapView } from "@/components/elections/PrecinctMapView"
import { MapLayerSelector } from "@/components/elections/MapLayerSelector"
import { CertificationBadge } from "@/components/elections/CertificationBadge"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import type { MapDataLayer } from "@/types/elections"

type MapView = "county" | "precinct"

export const Route = createFileRoute(
  "/elections/$electionDate/$electionId",
)({
  component: RaceResultsPage,
})

function RaceResultsPage() {
  const { electionId } = useParams({
    from: "/elections/$electionDate/$electionId",
  })

  const {
    data: raceData,
    isLoading: raceLoading,
    error: raceError,
  } = useRaceResults(electionId)

  const {
    data: geoJSON,
    isLoading: geoLoading,
  } = useCountyResultsGeoJSON(electionId)

  const [activeLayer, setActiveLayer] = useState<MapDataLayer>("leading_candidate")
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mapView, setMapView] = useState<MapView>("county")

  const countyNames = useMemo(
    () =>
      raceData?.results.county_results.map((c) => c.county_name) ?? [],
    [raceData?.results.county_results],
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
    setDrawerOpen(true)
  }

  const hasCountyGeoJSON = geoJSON && geoJSON.features.length > 0

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">{election.name}</h1>
            <p className="text-sm text-muted-foreground">{election.district}</p>
          </div>
          <CertificationBadge status={election.status} />
        </div>
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
          <MapLayerSelector
            activeLayer={activeLayer}
            onLayerChange={setActiveLayer}
          />
        )}
      </div>

      {/* Map views */}
      {mapView === "precinct" && (
        <PrecinctMapView
          electionId={electionId}
          countyNames={countyNames}
        />
      )}

      {mapView === "county" && hasCountyGeoJSON && (
        <div className="relative h-[500px] md:h-[600px] rounded-lg overflow-hidden">
          <div className="relative z-0 h-full w-full">
            <ElectionResultsMap
              geoJSON={geoJSON}
              activeLayer={activeLayer}
              selectedCounty={selectedCounty}
              onCountyClick={handleCountyClick}
            />
          </div>

          <ElectionResultsDrawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            results={results}
            selectedCounty={selectedCounty}
            onClearCounty={() => setSelectedCounty(null)}
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
