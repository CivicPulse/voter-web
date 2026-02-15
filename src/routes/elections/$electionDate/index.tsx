import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/elections/$electionDate/")({
  component: RaceListPage,
})

function RaceListPage() {
  return (
    <div className="container mx-auto p-6">
      <p className="text-muted-foreground">Loading races...</p>
    </div>
  )
}
