import { createFileRoute } from "@tanstack/react-router"
import { Loader2, AlertCircle } from "lucide-react"
import { DistrictDetailContent } from "@/components/DistrictDetailContent"
import { useDistrictSlugResolver } from "@/hooks/useDistrictSlugResolver"

export const Route = createFileRoute("/districts/$type/$name")({
  component: DistrictSlugPage,
})

function DistrictSlugPage() {
  const { type, name } = Route.useParams()
  const { districtId, isLoading, isNotFound } = useDistrictSlugResolver(
    type,
    name,
  )

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
            District not found: {type}/{name}
          </span>
        </div>
      </div>
    )
  }

  return <DistrictDetailContent districtId={districtId} />
}
