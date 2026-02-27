import { useMemo } from "react"
import {
  MapPinned,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Info,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { RegisteredDistricts } from "@/types/voter"
import type {
  DistrictComparisonResult,
  DistrictVerificationResult,
} from "@/lib/district-comparison"

const DISTRICT_FIELDS: {
  key: keyof RegisteredDistricts
  label: string
  descriptionKey?: keyof RegisteredDistricts
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

interface DistrictAssignmentsCardProps {
  districts: RegisteredDistricts
  verification?: DistrictVerificationResult | null
  verificationLoading?: boolean
  matchStatus?: string
  checkedAt?: string
  activeOverlayIds?: Set<string>
  onToggleBoundary?: (boundaryId: string) => void
}

export function DistrictAssignmentsCard({
  districts,
  verification,
  verificationLoading,
  matchStatus,
  checkedAt,
  activeOverlayIds,
  onToggleBoundary,
}: Readonly<DistrictAssignmentsCardProps>) {
  const assignments = DISTRICT_FIELDS.filter(
    ({ key }) => districts[key] !== null,
  ).map(({ key, label, descriptionKey }) => ({
    key,
    label,
    value: districts[key]!,
    description: descriptionKey ? districts[descriptionKey] : null,
  }))

  // Build lookup from registeredKey → comparison result
  const comparisonMap = useMemo(
    () => new Map(verification?.comparisons.map((c) => [c.registeredKey, c]) ?? []),
    [verification],
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="flex items-center gap-2">
            <MapPinned className="h-5 w-5" />
            District Assignments
          </CardTitle>
          <MatchStatusBadge status={matchStatus} />
          <VerificationStatusBadge
            verification={verification}
            loading={verificationLoading}
          />
        </div>
        {checkedAt && (
          <p className="text-xs text-muted-foreground mt-1">
            Checked{" "}
            {new Date(checkedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        )}
        {verification?.lowConfidence && (
          <p className="text-xs text-muted-foreground mt-1">
            Geocode confidence is low — verification results may be inaccurate.
          </p>
        )}
        {(matchStatus === "not-geocoded" || matchStatus === "unable-to-analyze") && (
          <p className="text-xs text-muted-foreground mt-1">
            {matchStatus === "not-geocoded"
              ? "This voter has not been geocoded yet. Geocode the voter to enable district verification."
              : "Unable to analyze district assignments for this voter."}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No district assignments found.
          </p>
        ) : (
          <div className="space-y-3">
            {assignments.map(({ key, label, value, description }) => {
              const comparison = comparisonMap.get(key)
              const boundaryId = comparison?.boundaryId ?? null
              const isActive = boundaryId !== null && (activeOverlayIds?.has(boundaryId) ?? false)
              const isClickable = comparison !== undefined

              function handleClick() {
                if (boundaryId) {
                  onToggleBoundary?.(boundaryId)
                } else if (comparison) {
                  toast.info("Boundary data not available for this district")
                }
              }

              function handleKeyDown(e: React.KeyboardEvent) {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  handleClick()
                }
              }

              return (
                <div
                  key={`${label}-${value}`}
                  role={isClickable ? "button" : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  onClick={isClickable ? handleClick : undefined}
                  onKeyDown={isClickable ? handleKeyDown : undefined}
                  className={cn(
                    "rounded-md p-1 -mx-1 transition-colors",
                    isClickable && "cursor-pointer hover:bg-muted/50",
                    isActive && "bg-muted",
                  )}
                >
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
                    <ComparisonIndicator comparison={comparison} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function VerificationStatusBadge({
  verification,
  loading,
}: {
  verification?: DistrictVerificationResult | null
  loading?: boolean
}) {
  if (loading) {
    return (
      <span role="status" aria-live="polite" className="inline-flex items-center">
        <Loader2
          className="h-4 w-4 animate-spin text-muted-foreground"
          aria-hidden
        />
        <span className="sr-only">Verifying district assignments</span>
      </span>
    )
  }
  if (!verification) return null

  if (verification.mismatchCount > 0) {
    return (
      <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1">
        <AlertTriangle className="h-3 w-3" />
        {verification.mismatchCount} {verification.mismatchCount === 1 ? "mismatch" : "mismatches"}
      </Badge>
    )
  }

  if (verification.matchCount > 0) {
    const totalCheckable = verification.comparisons.filter(
      (c) => c.status !== "no_registered_data",
    ).length
    const allVerified = verification.matchCount === totalCheckable
    return (
      <Badge variant="outline" className="text-green-600 border-green-300 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        {allVerified
          ? "All verified"
          : `${verification.matchCount}/${totalCheckable} verified`}
      </Badge>
    )
  }

  return null
}

function MatchStatusBadge({ status }: { status?: string }) {
  if (!status) return null

  if (status === "match") {
    return (
      <Badge variant="outline" className="text-green-600 border-green-300 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Match
      </Badge>
    )
  }

  if (status.startsWith("mismatch")) {
    return (
      <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1">
        <AlertTriangle className="h-3 w-3" />
        Mismatch
      </Badge>
    )
  }

  // not-geocoded, unable-to-analyze
  return (
    <Badge variant="outline" className="text-muted-foreground gap-1">
      <Info className="h-3 w-3" />
      {status === "not-geocoded" ? "Not Geocoded" : "Unable to Analyze"}
    </Badge>
  )
}

function ComparisonIndicator({
  comparison,
}: {
  comparison?: DistrictComparisonResult
}) {
  if (!comparison) return null

  switch (comparison.status) {
    case "match":
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center"
              aria-label="Matches geographic district"
            >
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" aria-hidden />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            Matches geographic district
          </TooltipContent>
        </Tooltip>
      )

    case "mismatch":
      return (
        <span className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center"
                aria-label="Registered district mismatch"
              >
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              Registered district does not match the geographic district at this
              voter&apos;s geocoded location.
            </TooltipContent>
          </Tooltip>
          <Badge variant="destructive" className="text-xs">
            Geographic: {comparison.geographicValue}
          </Badge>
        </span>
      )

    case "no_geographic_data":
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center"
              aria-label="No geographic data available"
            >
              <Info className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            No geographic boundary data available for verification
          </TooltipContent>
        </Tooltip>
      )

    default:
      return null
  }
}
