import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useImportJobs } from "@/lib/hooks/use-import-jobs"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Upload, Loader2 } from "lucide-react"
import { ImportJobTable } from "./_components/import-job-table"
import { ImportUploadDialog } from "./_components/import-upload-dialog"

export const Route = createFileRoute("/admin/imports/")({
  component: ImportsPage,
})

function ImportsPage() {
  const { data, isLoading, error } = useImportJobs()
  const [showUploadDialog, setShowUploadDialog] = useState(false)

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
          <h1 className="text-3xl font-bold mb-2">Data Imports</h1>
          <p className="text-muted-foreground">
            Upload and manage voter and boundary data imports
          </p>
        </div>
        <div className="border border-destructive rounded-lg p-6 text-center">
          <p className="text-destructive">
            Failed to load imports: {error.message}
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
          <h1 className="text-3xl font-bold mb-2">Data Imports</h1>
          <p className="text-muted-foreground">
            Upload and manage voter and boundary data imports
          </p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Import
        </Button>
      </div>

      {hasActiveJobs && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <p className="text-sm text-blue-900">
              Import jobs are processing. The table will update automatically.
            </p>
          </div>
        </div>
      )}

      {jobs.length === 0 ? (
        <EmptyState
          icon={<Upload className="h-12 w-12" />}
          title="No import jobs yet"
          description="Upload voter or boundary data to get started. Files will be processed in the background and you can monitor progress here."
          action={{
            label: "Upload Import",
            onClick: () => setShowUploadDialog(true),
          }}
        />
      ) : (
        <ImportJobTable jobs={jobs} />
      )}

      <ImportUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
      />
    </div>
  )
}
