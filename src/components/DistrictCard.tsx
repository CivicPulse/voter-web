import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { LookupDistrict } from "@/types/lookup"

const boundaryTypeLabels: Record<string, string> = {
  precinct: "Voting Precinct",
  county: "County",
  commission_district: "Commission District",
  congressional_district: "Congressional District",
  state_senate: "State Senate District",
  state_house: "State House District",
  school_district: "School District",
}

interface DistrictCardProps {
  district: LookupDistrict
}

export function DistrictCard({ district }: DistrictCardProps) {
  const label =
    boundaryTypeLabels[district.boundary_type] ?? district.boundary_type

  const metadataEntries = Object.entries(district.metadata).filter(
    ([, value]) => value !== null && value !== "",
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{district.name}</CardTitle>
          <Badge variant="secondary" className="shrink-0">
            {label}
          </Badge>
        </div>
      </CardHeader>
      {metadataEntries.length > 0 && (
        <CardContent>
          <dl className="space-y-1 text-sm">
            {metadataEntries.map(([key, value]) => (
              <div key={key} className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{formatMetadataKey(key)}</dt>
                <dd className="font-mono text-right">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      )}
    </Card>
  )
}

function formatMetadataKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
