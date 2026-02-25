import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useAnalysisRuns } from "@/lib/hooks/use-analysis-runs"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { SearchCheck, Loader2 } from "lucide-react"
import { AnalysisRunTable } from "./_components/analysis-run-table"
import { TriggerAnalysisDialog } from "./_components/trigger-analysis-dialog"
import { AdminErrorBoundary } from "@/components/admin-error-boundary"
import { Skeleton } from "@/components/ui/skeleton"
import { isActiveAnalysisRun } from "@/types/analysis"

export const Route = createFileRoute("/admin/analysis/")({
  component: () => (
    <AdminErrorBoundary>
      <AnalysisPage />
    </AdminErrorBoundary>
  ),
})

function AnalysisPage() {
  const { data, isLoading, error } = useAnalysisRuns()
  const [showTriggerDialog, setShowTriggerDialog] = useState(false)

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
          <h1 className="text-3xl font-bold mb-2">
            District Mismatch Analysis
          </h1>
          <p className="text-muted-foreground">
            Analyze voter district assignments for mismatches
          </p>
        </div>
        <div className="border border-destructive rounded-lg p-6 text-center">
          <p className="text-destructive">
            Failed to load analysis runs: {error.message}
          </p>
        </div>
      </div>
    )
  }

  const runs = data?.items ?? []
  const hasActiveRuns = runs.some(isActiveAnalysisRun)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            District Mismatch Analysis
          </h1>
          <p className="text-muted-foreground">
            Analyze voter district assignments for mismatches
          </p>
        </div>
        <Button onClick={() => setShowTriggerDialog(true)}>
          <SearchCheck className="h-4 w-4 mr-2" />
          Run Analysis
        </Button>
      </div>

      {hasActiveRuns && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <p className="text-sm text-blue-900">
              Analysis is running. The table will update automatically.
            </p>
          </div>
        </div>
      )}

      {runs.length === 0 ? (
        <EmptyState
          icon={<SearchCheck className="h-12 w-12" />}
          title="No analysis runs yet"
          description="Run a district mismatch analysis to compare voter registrations against determined district boundaries."
          action={{
            label: "Run Analysis",
            onClick: () => setShowTriggerDialog(true),
          }}
        />
      ) : (
        <AnalysisRunTable runs={runs} />
      )}

      <TriggerAnalysisDialog
        open={showTriggerDialog}
        onOpenChange={setShowTriggerDialog}
      />
    </div>
  )
}
