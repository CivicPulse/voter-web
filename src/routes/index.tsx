import { createFileRoute } from "@tanstack/react-router"
import { AlertCircle, Loader2 } from "lucide-react"
import { GeorgiaCountyMap } from "@/components/GeorgiaCountyMap"
import { useCountyBoundaries } from "@/hooks/useCountyBoundaries"
import { StateCensusProfileCard } from "@/components/StateCensusProfileCard"

export const Route = createFileRoute("/")({
  component: Index,
})

function Index() {
  const { data, isLoading, isError, error } = useCountyBoundaries()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Voter Web</h1>
        <p className="mt-1 text-muted-foreground">
          Georgia county boundaries
        </p>
      </div>

      <div className="h-[600px] w-full">
        {isLoading && (
          <div className="flex h-full items-center justify-center rounded-lg border bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading county boundaries…</span>
            </div>
          </div>
        )}

        {isError && (
          <div className="flex h-full items-center justify-center rounded-lg border bg-destructive/10">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>
                Failed to load county data
                {error instanceof Error ? `: ${error.message}` : ""}
              </span>
            </div>
          </div>
        )}

        {data && <GeorgiaCountyMap data={data} />}
      </div>

      <StateCensusProfileCard fipsState="13" stateName="Georgia" />
    </div>
  )
}
