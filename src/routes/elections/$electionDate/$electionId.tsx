import { useState } from "react"
import { createFileRoute, useParams } from "@tanstack/react-router"
import { Loader2 } from "lucide-react"
import { useRaceResults } from "@/lib/hooks/use-race-results"
import { useCountyResultsGeoJSON } from "@/lib/hooks/use-race-geojson"
import { ElectionResultsMap } from "@/components/elections/ElectionResultsMap"
import { MapLayerSelector } from "@/components/elections/MapLayerSelector"
import { CertificationBadge } from "@/components/elections/CertificationBadge"
import type { MapDataLayer } from "@/types/elections"

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

  const { election } = raceData

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

      {/* Layer selector */}
      <div className="flex justify-end mb-3">
        <MapLayerSelector
          activeLayer={activeLayer}
          onLayerChange={setActiveLayer}
        />
      </div>

      {/* Map */}
      {geoJSON && geoJSON.features.length > 0 ? (
        <div className="h-[500px] md:h-[600px] rounded-lg overflow-hidden">
          <ElectionResultsMap
            geoJSON={geoJSON}
            activeLayer={activeLayer}
            selectedCounty={selectedCounty}
            onCountyClick={setSelectedCounty}
          />
        </div>
      ) : (
        <div className="h-[400px] flex items-center justify-center border rounded-lg bg-muted/30">
          <p className="text-muted-foreground">
            No geographic data available for this race.
          </p>
        </div>
      )}
    </div>
  )
}
