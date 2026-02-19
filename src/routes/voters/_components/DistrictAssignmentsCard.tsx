import { MapPinned } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { LookupDistrict } from "@/types/lookup"

const DISTRICT_TYPE_LABELS: Record<string, string> = {
  county: "County",
  county_precinct: "Precinct",
  congressional: "Congressional",
  state_senate: "State Senate",
  state_house: "State House",
  commission: "Commission",
  school_district: "School District",
}

const DISTRICT_TYPE_ORDER = [
  "county",
  "county_precinct",
  "congressional",
  "state_senate",
  "state_house",
  "commission",
  "school_district",
]

interface DistrictAssignmentsCardProps {
  districts: LookupDistrict[] | null
  hasOfficialLocation: boolean
}

export function DistrictAssignmentsCard({
  districts,
  hasOfficialLocation,
}: DistrictAssignmentsCardProps) {
  if (!hasOfficialLocation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPinned className="h-5 w-5" />
            District Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            District assignments cannot be determined until an official location
            is selected.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!districts || districts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPinned className="h-5 w-5" />
            District Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No matching districts were found for the official location.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Group districts by type and sort by defined order
  const grouped = DISTRICT_TYPE_ORDER.reduce<
    Record<string, LookupDistrict[]>
  >((acc, type) => {
    const matching = districts.filter((d) => d.boundary_type === type)
    if (matching.length > 0) acc[type] = matching
    return acc
  }, {})

  // Add any unrecognized types at the end
  districts.forEach((d) => {
    if (!DISTRICT_TYPE_ORDER.includes(d.boundary_type)) {
      if (!grouped[d.boundary_type]) grouped[d.boundary_type] = []
      grouped[d.boundary_type].push(d)
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPinned className="h-5 w-5" />
          District Assignments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(grouped).map(([type, dists]) => (
            <div key={type}>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                {DISTRICT_TYPE_LABELS[type] ?? type.replaceAll("_", " ")}
              </h4>
              <div className="flex flex-wrap gap-2">
                {dists.map((d) => (
                  <Badge key={d.boundary_id} variant="outline">
                    {d.name}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
