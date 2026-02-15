import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useImportJobs } from "@/lib/hooks/use-import-jobs"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Upload, Loader2 } from "lucide-react"
import { ImportJobTable } from "./_components/import-job-table"
import { ImportUploadDialog } from "./_components/import-upload-dialog"
import { AdminErrorBoundary } from "@/components/admin-error-boundary"
import { Skeleton } from "@/components/ui/skeleton"

export const Route = createFileRoute("/admin/imports/")({
  component: () => (
    <AdminErrorBoundary>
      <ImportsPage />
    </AdminErrorBoundary>
  ),
})

function ImportsPage() {
  const { data, isLoading, error } = useImportJobs()
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="border rounded-lg p-6">
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        </div>
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
