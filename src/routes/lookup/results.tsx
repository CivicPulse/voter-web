import { createFileRoute, Link } from "@tanstack/react-router"
import { z } from "zod"
import { Loader2, AlertCircle, ArrowLeft, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DistrictCard } from "@/components/DistrictCard"
import { useAddressLookup } from "@/hooks/useAddressLookup"
import { requireAuth } from "@/lib/auth-guards"
import type { LookupDistrict } from "@/types/lookup"

const resultsSearchSchema = z.object({
  address: z.string().optional().catch(undefined),
  lat: z.coerce.number().optional().catch(undefined),
  lng: z.coerce.number().optional().catch(undefined),
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
  county: 1,
  commission_district: 2,
  congressional_district: 3,
  state_senate: 4,
  state_house: 5,
  school_district: 6,
}

function sortDistricts(districts: LookupDistrict[]): LookupDistrict[] {
  return [...districts].sort((a, b) => {
    const orderA = districtSortOrder[a.boundary_type] ?? 99
    const orderB = districtSortOrder[b.boundary_type] ?? 99
    return orderA - orderB
  })
}

function LookupResultsPage() {
  const { address, lat, lng } = Route.useSearch()
  const { data, isLoading, isError, error } = useAddressLookup({
    address,
    lat,
    lng,
  })

  const hasParams = !!address || (lat !== undefined && lng !== undefined)

  if (!hasParams) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
        <p className="text-muted-foreground">
          No address or location provided.
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
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {error instanceof Error
              ? error.message
              : "Failed to look up districts. Please try again."}
          </span>
        </div>
        <Button variant="outline" asChild>
          <Link to="/lookup">
            <ArrowLeft className="h-4 w-4" />
            Search Again
          </Link>
        </Button>
      </div>
    )
  }

  const sortedDistricts = sortDistricts(data?.districts ?? [])

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          {data?.geocoded_address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{data.geocoded_address.formatted_address}</span>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {sortedDistricts.length}{" "}
            {sortedDistricts.length === 1 ? "district" : "districts"} found
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/lookup">
            <ArrowLeft className="h-4 w-4" />
            Search Again
          </Link>
        </Button>
      </div>

      {sortedDistricts.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          No districts found for this location.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedDistricts.map((district) => (
            <DistrictCard
              key={district.boundary_id}
              district={district}
            />
          ))}
        </div>
      )}
    </div>
  )
}
