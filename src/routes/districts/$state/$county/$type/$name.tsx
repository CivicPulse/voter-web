import { z } from "zod"
import { createFileRoute } from "@tanstack/react-router"
import { Loader2, AlertCircle } from "lucide-react"
import { DistrictDetailContent } from "@/components/DistrictDetailContent"
import { useDistrictSlugResolverScoped } from "@/hooks/useDistrictSlugResolverScoped"
import { ABBREV_TO_FIPS } from "@/lib/states"

export const Route = createFileRoute(
  "/districts/$state/$county/$type/$name",
)({
  validateSearch: z.object({ overlay: z.string().optional() }),
  component: CountyDistrictPage,
})

function CountyDistrictPage() {
  const { state, county, type, name } = Route.useParams()
  const { overlay } = Route.useSearch()
  const isValidState = !!ABBREV_TO_FIPS[state]

  const { districtId, isLoading, isNotFound } = useDistrictSlugResolverScoped(
    state,
    county,
    type,
    name,
  )

  if (!isValidState) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>Unknown state: {state}</span>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Resolving district…</span>
        </div>
      </div>
    )
  }

  if (isNotFound || !districtId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>
            District not found: {state}/{county}/{type}/{name}
          </span>
        </div>
      </div>
    )
  }

  return <DistrictDetailContent districtId={districtId} overlay={overlay} stateAbbrev={state} />
}
