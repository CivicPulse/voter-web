import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/elections/")({
  component: ElectionsListPage,
})

function ElectionsListPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold">Elections</h1>
      <p className="text-muted-foreground mt-2">Loading elections...</p>
    </div>
  )
}
