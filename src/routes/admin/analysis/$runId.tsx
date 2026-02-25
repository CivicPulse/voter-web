import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import {
  useAnalysisRun,
  useAnalysisResults,
} from "@/lib/hooks/use-analysis-runs"
import { AdminErrorBoundary } from "@/components/admin-error-boundary"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import { RunSummaryCards } from "./_components/run-summary-cards"
import { AnalysisResultTable } from "./_components/analysis-result-table"
import type { AnalysisRunStatus, MatchStatus } from "@/types/analysis"

export const Route = createFileRoute("/admin/analysis/$runId")({
  component: () => (
    <AdminErrorBoundary>
      <AnalysisRunDetailPage />
    </AdminErrorBoundary>
  ),
})

const statusBadgeVariant: Record<
  AnalysisRunStatus,
  "default" | "destructive" | "secondary" | "outline"
> = {
  completed: "default",
  failed: "destructive",
  processing: "secondary",
  running: "secondary",
  pending: "outline",
}

function AnalysisRunDetailPage() {
  const { runId } = Route.useParams()
  const { data: run, isLoading: runLoading, error: runError } = useAnalysisRun(runId)

  const [matchStatus, setMatchStatus] = useState<MatchStatus | "all">("all")
  const [county, setCounty] = useState("")
  const [page, setPage] = useState(1)

  const {
    data: resultsData,
    isLoading: resultsLoading,
  } = useAnalysisResults(
    run?.status === "completed" ? runId : null,
    {
      match_status: matchStatus === "all" ? undefined : matchStatus,
      county: county.trim() || undefined,
      page,
      page_size: 25,
    }
  )

  if (runLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (runError || !run) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/analysis">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Analysis Runs
          </Link>
        </Button>
        <div className="border border-destructive rounded-lg p-6 text-center">
          <p className="text-destructive">
            Failed to load analysis run: {runError?.message ?? "Not found"}
          </p>
        </div>
      </div>
    )
  }

  const results = resultsData?.items ?? []
  const pagination = resultsData?.pagination

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/admin/analysis">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Analysis Runs
        </Link>
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Analysis Run</h1>
            <Badge variant={statusBadgeVariant[run.status]}>
              {run.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground font-mono">
            {run.id}
          </p>
        </div>
      </div>

      {(run.started_at || run.completed_at || run.notes) && (
        <div className="text-sm text-muted-foreground space-y-1">
          {run.started_at && (
            <p>Started: {new Date(run.started_at).toLocaleString()}</p>
          )}
          {run.completed_at && (
            <p>Completed: {new Date(run.completed_at).toLocaleString()}</p>
          )}
          {run.notes && <p>Notes: {run.notes}</p>}
        </div>
      )}

      <RunSummaryCards run={run} />

      {run.status === "completed" && (
        <>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="matchStatusFilter">Match Status</Label>
              <Select
                value={matchStatus}
                onValueChange={(value) => {
                  setMatchStatus(value as MatchStatus | "all")
                  setPage(1)
                }}
              >
                <SelectTrigger id="matchStatusFilter" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="match">Match</SelectItem>
                  <SelectItem value="mismatch">Mismatch</SelectItem>
                  <SelectItem value="unable_to_analyze">Unable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="countyFilter">County</Label>
              <Input
                id="countyFilter"
                placeholder="Filter by county..."
                value={county}
                onChange={(e) => {
                  setCounty(e.target.value)
                  setPage(1)
                }}
                className="w-[200px]"
              />
            </div>
          </div>

          {resultsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : results.length === 0 ? (
            <div className="border rounded-lg p-6 text-center text-muted-foreground">
              No results found matching the current filters.
            </div>
          ) : (
            <>
              <AnalysisResultTable results={results} />

              {pagination && pagination.total_pages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing page {pagination.page} of {pagination.total_pages}{" "}
                    ({pagination.total.toLocaleString()} total results)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= pagination.total_pages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {run.status === "failed" && (
        <div className="border border-destructive rounded-lg p-6">
          <p className="text-destructive text-sm">
            This analysis run failed. No results are available.
          </p>
        </div>
      )}
    </div>
  )
}
