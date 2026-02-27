import { createFileRoute, Link } from "@tanstack/react-router"
import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useVoterDetail } from "@/hooks/useVoters"
import { useVoterGeocodedLocations } from "@/hooks/useAddressLookup"
import { VoterRegistrationCard } from "@/routes/voters/_components/VoterRegistrationCard"
import { GeocodedLocationsCard } from "@/routes/voters/_components/GeocodedLocationsCard"
import { GeocodedLocationMap } from "@/routes/voters/_components/GeocodedLocationMap"
import { DistrictAssignmentsCard } from "@/routes/voters/_components/DistrictAssignmentsCard"
import { VoterHistoryCard } from "@/routes/voters/_components/VoterHistoryCard"
import { useDistrictCheck } from "@/hooks/useDistrictCheck"
import { useProviderBoundaryCheck } from "@/hooks/useProviderBoundaryCheck"
import { getBoundaryDetail } from "@/lib/api/boundaries"
import type { BoundaryDetailResponse } from "@/types/boundary"

export const Route = createFileRoute("/voters/$voterId")({
  component: VoterDetailPage,
})


function VoterDetailPage() {
  const { voterId } = Route.useParams()
  const { data: voter, isLoading, error } = useVoterDetail(voterId)
  const { data: locations } = useVoterGeocodedLocations(voterId)
  const { districtCheck, verification, isLoading: verificationLoading } = useDistrictCheck(voterId)

  const [activeOverlayIds, setActiveOverlayIds] = useState<Set<string>>(new Set())

  function handleToggleBoundary(id: string) {
    setActiveOverlayIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const overlayIds = useMemo(() => [...activeOverlayIds].sort((a, b) => a.localeCompare(b)), [activeOverlayIds])
  const { data: overlayData } = useQuery({
    queryKey: ["boundaries", "batch", overlayIds],
    queryFn: async () => {
      const settled = await Promise.allSettled(
        overlayIds.map(async (id) => [id, await getBoundaryDetail(id)] as const),
      )
      return new Map<string, BoundaryDetailResponse>(
        settled.flatMap((r) => (r.status === "fulfilled" ? [r.value] : [])),
      )
    },
    enabled: activeOverlayIds.size > 0,
    staleTime: 1000 * 60 * 10,
  })

  const {
    data: providerResults,
    isLoading: providerResultsLoading,
    error: providerError,
    refetch: refetchProvider,
  } = useProviderBoundaryCheck(voterId)

  const providerMatchStatus = useMemo(() => {
    if (!providerResults?.provider_summary) return new Map<string, string>()
    const statusMap = new Map<string, string>()
    for (const summary of providerResults.provider_summary) {
      const { source_type, districts_matched, districts_checked } = summary
      if (districts_checked === 0) continue
      if (districts_matched === districts_checked) {
        statusMap.set(source_type, "all-match")
      } else if (districts_matched === 0) {
        statusMap.set(source_type, "any-mismatch")
      } else {
        statusMap.set(source_type, "mixed")
      }
    }
    return statusMap
  }, [providerResults])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !voter) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Voter Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The voter you are looking for does not exist or could not be loaded.
          </p>
          <Button variant="outline" asChild>
            <Link to="/voters">
              <ArrowLeft className="h-4 w-4" />
              Back to Search
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/voters">
            <ArrowLeft className="h-4 w-4" />
            Back to Search
          </Link>
        </Button>
      </div>

      <VoterRegistrationCard voter={voter} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GeocodedLocationsCard
          locations={locations ?? []}
          voterId={voterId}
          officialLocation={voter.official_location}
        />
        {locations && locations.length > 0 && (
          <GeocodedLocationMap
            locations={locations}
            officialLocation={voter.official_location}
            voterId={voterId}
            activeOverlays={overlayData}
            providerMatchStatus={providerMatchStatus}
            onLocationSaved={() => {
              // district check will auto-invalidate from mutation
            }}
          />
        )}
      </div>

      <DistrictAssignmentsCard
        districts={voter}
        verification={verification}
        verificationLoading={verificationLoading}
        matchStatus={districtCheck?.match_status}
        checkedAt={districtCheck?.checked_at}
        activeOverlayIds={activeOverlayIds}
        onToggleBoundary={handleToggleBoundary}
        providerResults={providerResults ?? null}
        providerResultsLoading={providerResultsLoading}
        providerResultsError={!!providerError}
        onRetryProviderCheck={refetchProvider}
      />

      <VoterHistoryCard voterRegistrationNumber={voter.voter_id} />
    </div>
  )
}
