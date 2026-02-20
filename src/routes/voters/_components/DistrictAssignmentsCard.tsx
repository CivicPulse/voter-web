import { MapPinned } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface VoterFileDistricts {
  congressional_district: string | null
  state_senate_district: string | null
  state_house_district: string | null
  county_precinct: string | null
  precinct: string | null
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

export function DistrictAssignmentsCard(props: VoterFileDistricts) {
  const assignments = DISTRICT_FIELDS.filter(
    ({ key }) => props[key] !== null,
  ).map(({ key, label }) => ({ label, value: props[key] as string }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPinned className="h-5 w-5" />
          District Assignments
        </CardTitle>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No district assignments found.
          </p>
        ) : (
          <div className="space-y-3">
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
