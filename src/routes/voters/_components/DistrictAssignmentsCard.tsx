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
  judicial_district: string | null
  county_commission_district: string | null
  school_board_district: string | null
  city_council_district: string | null
  municipal_school_board_district: string | null
  county_precinct: string | null
  county_precinct_description: string | null
  municipal_precinct: string | null
  municipal_precinct_description: string | null
}

const DISTRICT_FIELDS: {
  key: keyof VoterFileDistricts
  label: string
  descriptionKey?: keyof VoterFileDistricts
}[] = [
  { key: "congressional_district", label: "Congressional" },
  { key: "state_senate_district", label: "State Senate" },
  { key: "state_house_district", label: "State House" },
  { key: "judicial_district", label: "Judicial" },
  { key: "county_commission_district", label: "County Commission" },
  { key: "school_board_district", label: "School Board" },
  { key: "city_council_district", label: "City Council" },
  { key: "municipal_school_board_district", label: "Municipal School Board" },
  {
    key: "county_precinct",
    label: "County Precinct",
    descriptionKey: "county_precinct_description",
  },
  {
    key: "municipal_precinct",
    label: "Municipal Precinct",
    descriptionKey: "municipal_precinct_description",
  },
]

export function DistrictAssignmentsCard(props: VoterFileDistricts) {
  const assignments = DISTRICT_FIELDS.filter(
    ({ key }) => props[key] !== null,
  ).map(({ key, label, descriptionKey }) => ({
    label,
    value: props[key] as string,
    description: descriptionKey ? (props[descriptionKey] as string | null) : null,
  }))

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
            {assignments.map(({ label, value, description }) => (
              <div key={`${label}-${value}`}>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  {label}
                </h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{value}</Badge>
                  {description && (
                    <span className="text-sm text-muted-foreground">
                      {description}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
