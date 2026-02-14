import { createFileRoute, Link } from "@tanstack/react-router"
import { z } from "zod"
import { HTTPError } from "ky"
import { Loader2, AlertCircle, ArrowLeft, MapPin, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DistrictCard } from "@/components/DistrictCard"
import { usePointLookup } from "@/hooks/useAddressLookup"
import { requireAuth } from "@/lib/auth-guards"
import type { LookupDistrict } from "@/types/lookup"

const resultsSearchSchema = z.object({
  address: z.string().optional().catch(undefined),
  lat: z.coerce.number().optional().catch(undefined),
  lng: z.coerce.number().optional().catch(undefined),
  accuracy: z.coerce.number().optional().catch(undefined),
})

export const Route = createFileRoute("/lookup/results")({
  component: LookupResultsPage,
  validateSearch: resultsSearchSchema,
  beforeLoad: ({ location }) => {
    requireAuth(location.pathname)
  },
})

const districtSortOrder: Record<string, number> = {
  precinct: 0,
  county_precinct: 0,
  county: 1,
  commission_district: 2,
  county_commission: 2,
  congressional: 3,
  congressional_district: 3,
  state_senate: 4,
  state_house: 5,
  school_district: 6,
  school_board: 6,
  psc: 7,
}

const boundaryTypeLabels: Record<string, string> = {
  precinct: "Voting Precincts",
  county_precinct: "Voting Precincts",
  county: "Counties",
  commission_district: "Commission Districts",
  county_commission: "County Commission Districts",
  congressional: "Congressional Districts",
  congressional_district: "Congressional Districts",
  state_senate: "State Senate Districts",
  state_house: "State House Districts",
  school_district: "School Districts",
  school_board: "School Board Districts",
  psc: "Public Service Commission Districts",
}

interface DistrictGroup {
  boundaryType: string
  label: string
  districts: LookupDistrict[]
}

function groupDistricts(districts: LookupDistrict[]): DistrictGroup[] {
  const sorted = [...districts].sort((a, b) => {
    const orderA = districtSortOrder[a.boundary_type] ?? 99
    const orderB = districtSortOrder[b.boundary_type] ?? 99
    return orderA - orderB
  })

  const groups: DistrictGroup[] = []
  for (const district of sorted) {
    const last = groups.at(-1)
    if (last?.boundaryType === district.boundary_type) {
      last.districts.push(district)
    } else {
      groups.push({
        boundaryType: district.boundary_type,
        label:
          boundaryTypeLabels[district.boundary_type] ??
          district.boundary_type,
        districts: [district],
      })
    }
  }
  return groups
}

function isProviderUnavailable(error: Error | null): boolean {
  return error instanceof HTTPError && error.response.status === 502
}

function LookupResultsPage() {
  const { address, lat, lng, accuracy } = Route.useSearch()

  const lookupParams =
    lat !== undefined && lng !== undefined
      ? { lat, lng, accuracy }
      : null

  const { data, isLoading, isError, error, refetch, isRefetching } =
    usePointLookup(lookupParams)

  if (lookupParams === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
        <p className="text-muted-foreground">
          No location provided.
        </p>
        <Button variant="outline" asChild>
          <Link to="/lookup">
            <ArrowLeft className="h-4 w-4" />
            Go to Address Lookup
          </Link>
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Looking up districts...</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    const providerDown = isProviderUnavailable(error)

    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {providerDown
              ? "The geocoding service is temporarily unavailable. Please try again in a moment."
              : error instanceof Error
                ? error.message
                : "Failed to look up districts. Please try again."}
          </span>
        </div>
        <div className="flex gap-2">
          {providerDown && (
            <Button
              variant="default"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              {isRefetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Retry
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to="/lookup">
              <ArrowLeft className="h-4 w-4" />
              Search Again
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const groups = groupDistricts(data?.districts ?? [])
  const totalDistricts = groups.reduce((sum, g) => sum + g.districts.length, 0)

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          {address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{address}</span>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {totalDistricts}{" "}
            {totalDistricts === 1 ? "district" : "districts"} found
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/lookup">
            <ArrowLeft className="h-4 w-4" />
            Search Again
          </Link>
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          No districts found for this location.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.flatMap((group) =>
            group.districts.map((district) => (
              <DistrictCard
                key={district.boundary_id}
                district={district}
              />
            )),
          )}
        </div>
      )}
    </div>
  )
}
