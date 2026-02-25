import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useVoterDetail } from "@/hooks/useVoters"
import { useVoterGeocodedLocations } from "@/hooks/useAddressLookup"
import { VoterRegistrationCard } from "@/routes/voters/_components/VoterRegistrationCard"
import { GeocodedLocationsCard } from "@/routes/voters/_components/GeocodedLocationsCard"
import { GeocodedLocationMap } from "@/routes/voters/_components/GeocodedLocationMap"
import { DistrictAssignmentsCard } from "@/routes/voters/_components/DistrictAssignmentsCard"
import { VoterHistoryCard } from "@/routes/voters/_components/VoterHistoryCard"
import { useDistrictVerification } from "@/hooks/useDistrictVerification"

export const Route = createFileRoute("/voters/$voterId")({
  component: VoterDetailPage,
})

function VoterDetailPage() {
  const { voterId } = Route.useParams()
  const { data: voter, isLoading, error } = useVoterDetail(voterId)
  const { data: locations } = useVoterGeocodedLocations(voterId)
  const { verification, isLoading: verificationLoading } = useDistrictVerification({
    districts: voter,
    locations,
  })

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
        />
        {locations && locations.length > 0 && (
          <GeocodedLocationMap locations={locations} />
        )}
      </div>

      <DistrictAssignmentsCard
        districts={voter}
        verification={verification}
        verificationLoading={verificationLoading}
      />

      <VoterHistoryCard voterRegistrationNumber={voter.voter_id} />
    </div>
  )
}
