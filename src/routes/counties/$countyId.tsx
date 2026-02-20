import { useEffect } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { Loader2, AlertCircle } from "lucide-react"
import { CountyDetailContent } from "@/components/CountyDetailContent"
import { useCountyBoundary } from "@/hooks/useCountyBoundary"
import { fipsToAbbrev } from "@/lib/states"
import { slugify } from "@/lib/slugs"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const countySearchSchema = z.object({
  overlay: z.string().optional().catch(undefined),
})

export const Route = createFileRoute("/counties/$countyId")({
  component: CountyDetailPage,
  validateSearch: countySearchSchema,
})

function CountyDetailPage() {
  const { countyId } = Route.useParams()
  const { overlay } = Route.useSearch()
  const navigate = useNavigate()
  const isUUID = UUID_PATTERN.test(countyId)

  const { data: county, isLoading } = useCountyBoundary(isUUID ? countyId : "")

  useEffect(() => {
    if (!isUUID || !county) return
    const stateFips = county.boundary_identifier.slice(0, 2)
    const stateAbbrev = fipsToAbbrev(stateFips)
    if (!stateAbbrev) return
    navigate({
      to: "/counties/$state/$county",
      params: { state: stateAbbrev, county: slugify(county.name) },
      search: overlay ? { overlay } : {},
      replace: true,
    })
  }, [isUUID, county, overlay, navigate])

  if (isUUID) {
    if (isLoading || county) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Resolving county…</span>
          </div>
        </div>
      )
    }

    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>County not found</span>
        </div>
      </div>
    )
  }

  return <CountyDetailContent countyId={countyId} overlay={overlay} />
}
