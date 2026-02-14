import { ChevronRight } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { LookupDistrict } from "@/types/lookup"

const boundaryTypeLabels: Record<string, string> = {
  precinct: "Voting Precinct",
  county_precinct: "Voting Precinct",
  county: "County",
  commission_district: "Commission District",
  county_commission: "County Commission District",
  congressional: "Congressional District",
  congressional_district: "Congressional District",
  state_senate: "State Senate District",
  state_house: "State House District",
  school_district: "School District",
  school_board: "School Board District",
  psc: "Public Service Commission District",
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
          <Badge variant="secondary" className="shrink-0">
            {label}
          </Badge>
          <CardTitle className="text-base text-right">{district.name}</CardTitle>
        </div>
      </CardHeader>
      {metadataEntries.length > 0 && (
        <CardContent className="pt-0">
          <Collapsible defaultOpen={false}>
            <CollapsibleTrigger className="flex w-full items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors [&[data-state=open]>svg]:rotate-90">
              <ChevronRight className="h-3 w-3 shrink-0 transition-transform" />
              <span>Details</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <dl className="mt-2 space-y-1 text-sm">
                {metadataEntries.map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{formatMetadataKey(key)}</dt>
                    <dd className="font-mono text-right">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </CollapsibleContent>
          </Collapsible>
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
