import { createFileRoute } from "@tanstack/react-router"
import { Upload } from "lucide-react"

export const Route = createFileRoute("/admin/imports/")({
  component: ImportsPage,
})

function ImportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Data Imports</h1>
        <p className="text-muted-foreground">
          Upload and manage voter and boundary data imports
        </p>
      </div>

      <div className="border rounded-lg p-12 text-center">
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
        <p className="text-sm text-muted-foreground">
          Import interface will be implemented in Phase 4
        </p>
      </div>
    </div>
  )
}
