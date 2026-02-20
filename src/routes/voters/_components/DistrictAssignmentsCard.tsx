import { Loader2, MapPinned } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { usePointLookup } from "@/hooks/useAddressLookup"
import type { VoterGeocodedLocation } from "@/types/lookup"

interface VoterFileDistricts {
  congressional_district: string | null
  state_senate_district: string | null
  state_house_district: string | null
  county_precinct: string | null
  precinct: string | null
}

interface DistrictAssignmentsCardProps extends VoterFileDistricts {
  locations?: VoterGeocodedLocation[]
}

const DISTRICT_FIELDS: {
  key: keyof VoterFileDistricts
  label: string
}[] = [
  { key: "congressional_district", label: "Congressional" },
  { key: "state_senate_district", label: "State Senate" },
  { key: "state_house_district", label: "State House" },
  { key: "county_precinct", label: "County Precinct" },
  { key: "precinct", label: "Precinct" },
]

const boundaryTypeLabels: Record<string, string> = {
  precinct: "Precinct",
  county_precinct: "County Precinct",
  county: "County",
  commission_district: "Commission District",
  county_commission: "County Commission",
  congressional: "Congressional",
  congressional_district: "Congressional",
  state_senate: "State Senate",
  state_house: "State House",
  school_district: "School District",
  school_board: "School Board",
  psc: "Public Service Commission",
}

export function DistrictAssignmentsCard({
  locations,
  ...props
}: DistrictAssignmentsCardProps) {
  const fileAssignments = DISTRICT_FIELDS.filter(
    ({ key }) => props[key] !== null,
  ).map(({ key, label }) => ({ label, value: props[key] as string }))

  const hasFileAssignments = fileAssignments.length > 0

  // Use point-lookup when voter file has no districts but geocoded locations exist
  const primaryLocation = locations?.find((l) => l.is_primary) ?? locations?.[0]
  const shouldLookup = !hasFileAssignments && !!primaryLocation

  const { data: pointLookupData, isLoading: isLookingUp } = usePointLookup(
    shouldLookup
      ? { lat: primaryLocation!.latitude, lng: primaryLocation!.longitude }
      : null,
  )

  const geocodedAssignments =
    pointLookupData?.districts.map((d) => ({
      label: boundaryTypeLabels[d.boundary_type] ?? d.boundary_type,
      value: d.name,
    })) ?? []

  const assignments = hasFileAssignments ? fileAssignments : geocodedAssignments
  const isFromGeocode = !hasFileAssignments && geocodedAssignments.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPinned className="h-5 w-5" />
          District Assignments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLookingUp ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Looking up districts from geocoded location...
          </div>
        ) : assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No district assignments found.
          </p>
        ) : (
          <div className="space-y-3">
            {isFromGeocode && (
              <p className="text-xs text-muted-foreground">
                Based on geocoded location (not in voter file)
              </p>
            )}
            {assignments.map(({ label, value }) => (
              <div key={`${label}-${value}`}>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  {label}
                </h4>
                <Badge variant="outline">{value}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
