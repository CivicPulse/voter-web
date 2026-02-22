import { useEffect } from "react"
import { z } from "zod"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Loader2, AlertCircle } from "lucide-react"
import { DisambiguationPage } from "@/components/DisambiguationPage"
import { useDistrictDisambiguation } from "@/hooks/useDistrictDisambiguation"

export const Route = createFileRoute("/districts/$type/$name")({
  validateSearch: z.object({ overlay: z.string().optional() }),
  component: LegacyDistrictSlugPage,
})

function LegacyDistrictSlugPage() {
  const { type, name } = Route.useParams()
  const { overlay } = Route.useSearch()
  const { matches, isLoading, isSingleMatch } = useDistrictDisambiguation(
    type,
    name,
  )
  const navigate = useNavigate()

  useEffect(() => {
    if (isSingleMatch && matches[0]) {
      navigate({
        to: matches[0].fullyQualifiedUrl,
        search: overlay ? { overlay } : undefined,
        replace: true,
      })
    }
  }, [isSingleMatch, matches, navigate, overlay])

  if (isLoading || isSingleMatch) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Resolving district…</span>
        </div>
      </div>
    )
  }

  if (matches.length === 0) {
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

  return <DisambiguationPage matches={matches} typeSlug={type} nameSlug={name} />
}
