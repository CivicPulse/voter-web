import { createFileRoute, useParams } from "@tanstack/react-router"
import { Loader2, Vote } from "lucide-react"
import { useElectionDetail } from "@/lib/hooks/use-election-detail"
import { RaceList } from "./_components/race-list"

export const Route = createFileRoute("/elections/$electionDate/")({
  component: RaceListPage,
})

function RaceListPage() {
  const { electionDate } = useParams({
    from: "/elections/$electionDate/",
  })

  const { data: races, isLoading, error } = useElectionDetail(electionDate)

  const formattedDate = new Date(electionDate + "T00:00:00").toLocaleDateString(
    "en-US",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" },
  )

  return (
    <div className="container mx-auto px-4 py-4 sm:p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <Vote className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{formattedDate}</h1>
      </div>
      {races && (
        <p className="text-sm text-muted-foreground mb-6">
          {races.length} {races.length === 1 ? "race" : "races"}
        </p>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-destructive">
          <p>Failed to load races. Please try again.</p>
        </div>
      )}

      {races && <RaceList races={races} electionDate={electionDate} />}
    </div>
  )
}
