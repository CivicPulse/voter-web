import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/admin/elections/create")({
  component: AdminCreateElectionPage,
})

function AdminCreateElectionPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Create Election</h1>
      <p className="text-muted-foreground mt-2">Loading...</p>
    </div>
  )
}
