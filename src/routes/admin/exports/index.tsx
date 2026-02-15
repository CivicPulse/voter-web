import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useExportJobs } from "@/lib/hooks/use-export-jobs"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { ExportJobTable } from "./_components/export-job-table"
import { ExportRequestDialog } from "./_components/export-request-dialog"
import { AdminErrorBoundary } from "@/components/admin-error-boundary"

export const Route = createFileRoute("/admin/exports/")({
  component: () => (
    <AdminErrorBoundary>
      <ExportsPage />
    </AdminErrorBoundary>
  ),
})

function ExportsPage() {
  const { data, isLoading, error } = useExportJobs()
  const [showRequestDialog, setShowRequestDialog] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Data Exports</h1>
          <p className="text-muted-foreground">
            Generate and download bulk data exports
          </p>
        </div>
        <div className="border border-destructive rounded-lg p-6 text-center">
          <p className="text-destructive">
            Failed to load exports: {error.message}
          </p>
        </div>
      </div>
    )
  }

  const jobs = data?.jobs ?? []
  const hasActiveJobs = jobs.some(
    (job) => job.status === "pending" || job.status === "processing"
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Data Exports</h1>
          <p className="text-muted-foreground">
            Generate and download bulk data exports
          </p>
        </div>
        <Button onClick={() => setShowRequestDialog(true)}>
          <Download className="h-4 w-4 mr-2" />
          Create Export
        </Button>
      </div>

      {hasActiveJobs && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <p className="text-sm text-blue-900">
              Export jobs are processing. The table will update automatically.
            </p>
          </div>
        </div>
      )}

      {jobs.length === 0 ? (
        <EmptyState
          icon={<Download className="h-12 w-12" />}
          title="No export jobs yet"
          description="Create a data export to generate downloadable files of voter data, boundaries, or the complete database."
          action={{
            label: "Create Export",
            onClick: () => setShowRequestDialog(true),
          }}
        />
      ) : (
        <ExportJobTable jobs={jobs} />
      )}

      <ExportRequestDialog
        open={showRequestDialog}
        onOpenChange={setShowRequestDialog}
      />
    </div>
  )
}
