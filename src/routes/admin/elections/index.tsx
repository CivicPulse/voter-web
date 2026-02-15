import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/admin/elections/")({
  component: AdminElectionsPage,
})

function AdminElectionsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Election Management</h1>
      <p className="text-muted-foreground mt-2">Loading...</p>
    </div>
  )
}
