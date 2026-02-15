import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/admin/elections/$electionId")({
  component: AdminElectionDetailPage,
})

function AdminElectionDetailPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Election Detail</h1>
      <p className="text-muted-foreground mt-2">Loading...</p>
    </div>
  )
}
