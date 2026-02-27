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
import { BOUNDARY_TYPE_TO_REGISTERED_KEY } from "@/lib/district-comparison"
import type { BoundaryDetailResponse } from "@/types/boundary"

export const Route = createFileRoute("/voters/$voterId")({
  component: VoterDetailPage,
})

function normalizeForMatch(v: string): string {
  return v.replace(/^0+/, "").toLowerCase() || "0"
}

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

  const { data: overlayData } = useQuery({
    queryKey: ["boundaries", "batch", [...activeOverlayIds].sort()],
    queryFn: async () => {
      const entries = await Promise.all(
        [...activeOverlayIds].map(async (id) => {
          const data = await getBoundaryDetail(id)
          return [id, data] as const
        }),
      )
      return new Map<string, BoundaryDetailResponse>(entries)
    },
    enabled: activeOverlayIds.size > 0,
    staleTime: 1000 * 60 * 10,
  })

  const {
    data: providerResults,
    isLoading: providerResultsLoading,
    error: providerError,
    refetch: refetchProvider,
  } = useProviderBoundaryCheck(voterId, locations ?? [])

  const providerMatchStatus = useMemo(() => {
    if (!providerResults) return new Map<string, string>()
    const statusMap = new Map<string, string>()
    for (const result of providerResults.results) {
      const districtValues = Object.values(result.districts).filter((v) => v !== null)
      if (districtValues.length === 0) continue

      // Compare against official/determined values
      if (!verification) continue
      let anyMismatch = false
      let anyMatch = false

      for (const comparison of verification.comparisons) {
        const boundaryType = Object.entries(BOUNDARY_TYPE_TO_REGISTERED_KEY).find(
          ([, v]) => v === comparison.registeredKey,
        )?.[0]
        if (!boundaryType) continue
        const providerValue = result.districts[boundaryType]
        if (providerValue === null || providerValue === undefined) continue
        const officialValue = comparison.geographicValue
        if (officialValue === null) continue
        const match = normalizeForMatch(providerValue) === normalizeForMatch(officialValue)
        if (!match) {
          anyMismatch = true
        } else {
          anyMatch = true
        }
      }

      if (anyMismatch && anyMatch) {
        statusMap.set(result.provider, "mixed")
      } else if (anyMismatch) {
        statusMap.set(result.provider, "any-mismatch")
      } else if (anyMatch) {
        statusMap.set(result.provider, "all-match")
      }
    }
    return statusMap
  }, [providerResults, verification])

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
            voterId={voterId}
            activeOverlays={overlayData ?? new Map()}
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
