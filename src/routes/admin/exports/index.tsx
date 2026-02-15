import { createFileRoute } from "@tanstack/react-router"
import { Download } from "lucide-react"

export const Route = createFileRoute("/admin/exports/")({
  component: ExportsPage,
})

function ExportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Data Exports</h1>
        <p className="text-muted-foreground">
          Generate and download bulk data exports
        </p>
      </div>

      <div className="border rounded-lg p-12 text-center">
        <Download className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
        <p className="text-sm text-muted-foreground">
          Export interface will be implemented in Phase 4
        </p>
      </div>
    </div>
  )
}
