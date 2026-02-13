import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { Loader2, AlertCircle } from "lucide-react"
import { CountyDetailContent } from "@/components/CountyDetailContent"
import { useCountySlugResolver } from "@/hooks/useCountySlugResolver"

const countySearchSchema = z.object({
  overlay: z.string().optional().catch(undefined),
})

export const Route = createFileRoute("/counties/$state/$county")({
  component: CountySlugPage,
  validateSearch: countySearchSchema,
})

function CountySlugPage() {
  const { state, county } = Route.useParams()
  const { overlay } = Route.useSearch()
  const { countyId, isLoading, isNotFound } = useCountySlugResolver(
    state,
    county,
  )

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Resolving county…</span>
        </div>
      </div>
    )
  }

  if (isNotFound || !countyId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>
            County not found: {state}/{county}
          </span>
        </div>
      </div>
    )
  }

  return <CountyDetailContent countyId={countyId} overlay={overlay} />
}
