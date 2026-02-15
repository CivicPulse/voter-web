import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute(
  "/elections/$electionDate/$electionId",
)({
  component: RaceResultsPage,
})

function RaceResultsPage() {
  return (
    <div className="container mx-auto p-6">
      <p className="text-muted-foreground">Loading race results...</p>
    </div>
  )
}
