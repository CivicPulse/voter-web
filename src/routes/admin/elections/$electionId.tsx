import { useState } from "react"
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router"
import {
  useAdminElectionDetail,
  useUpdateElection,
  useRefreshElection,
} from "@/lib/hooks/use-admin-elections"
import type { ElectionFormValues } from "@/lib/schemas/election-form"
import { AdminErrorBoundary } from "@/components/admin-error-boundary"
import { ElectionForm } from "./_components/election-form"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from "lucide-react"

export const Route = createFileRoute("/admin/elections/$electionId")({
  component: () => (
    <AdminErrorBoundary>
      <AdminElectionDetailPage />
    </AdminErrorBoundary>
  ),
})

function AdminElectionDetailPage() {
  const navigate = useNavigate()
  const { electionId } = useParams({
    from: "/admin/elections/$electionId",
  })

  const { data: election, isLoading, error } = useAdminElectionDetail(electionId)
  const updateMutation = useUpdateElection()
  const refreshMutation = useRefreshElection()

  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false)

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96" />
        <div className="space-y-4">
          {["name", "date", "type", "district", "url"].map((field) => (
            <Skeleton key={field} className="h-10 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !election) {
    return (
      <div className="max-w-2xl space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/admin/elections" })}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Elections
        </Button>
        <div className="border border-destructive rounded-lg p-6 text-center">
          <p className="text-destructive">
            Failed to load election: {error?.message ?? "Not found"}
          </p>
        </div>
      </div>
    )
  }

  const isFinalized = election.status === "finalized"

  const handleFormSubmit = (data: ElectionFormValues) => {
    // If changing status to finalized, show confirmation
    if (!isFinalized && data.name !== election.name) {
      // Just a regular update — no status change through form
    }

    updateMutation.mutate(
      {
        electionId,
        data: {
          name: data.name,
          data_source_url: data.data_source_url,
          refresh_interval_seconds: data.refresh_interval_seconds,
        },
      },
      {
        onSuccess: () => {
          navigate({ to: "/admin/elections" })
        },
      },
    )
  }

  const handleFinalize = () => {
    updateMutation.mutate(
      {
        electionId,
        data: { status: "finalized" },
      },
      {
        onSuccess: () => {
          setShowFinalizeDialog(false)
        },
      },
    )
  }

  const handleRefresh = () => {
    refreshMutation.mutate(electionId)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/admin/elections" })}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Elections
        </Button>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">Edit Election</h1>
          <Badge variant={isFinalized ? "secondary" : "default"}>
            {election.status}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {election.district} · {election.election_date}
        </p>
      </div>

      {updateMutation.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to update election: {updateMutation.error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Refresh button */}
      <div className="flex items-center gap-3 border rounded-lg p-4">
        <div className="flex-1">
          <p className="font-medium">Manual Data Refresh</p>
          <p className="text-sm text-muted-foreground">
            {election.last_refreshed_at
              ? `Last refreshed: ${new Date(election.last_refreshed_at).toLocaleString()}`
              : "Never refreshed"}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isFinalized || refreshMutation.isPending}
        >
          {refreshMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {refreshMutation.isPending ? "Refreshing..." : "Refresh Now"}
        </Button>
      </div>

      {/* Finalize button */}
      {!isFinalized && (
        <div className="flex items-center gap-3 border border-amber-300 rounded-lg p-4 bg-amber-50 dark:bg-amber-950/20">
          <div className="flex-1">
            <p className="font-medium">Finalize Election</p>
            <p className="text-sm text-muted-foreground">
              Mark this election as official. Auto-refresh will stop.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFinalizeDialog(true)}
          >
            Finalize
          </Button>
        </div>
      )}

      {/* Edit form */}
      <ElectionForm
        defaultValues={{
          name: election.name,
          election_date: election.election_date,
          election_type: election.election_type,
          district: election.district,
          data_source_url: election.data_source_url,
          refresh_interval_seconds: election.refresh_interval_seconds,
        }}
        onSubmit={handleFormSubmit}
        isPending={updateMutation.isPending}
        submitLabel="Save Changes"
      />

      {/* Finalization confirmation dialog */}
      <Dialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Finalize Election
            </DialogTitle>
            <DialogDescription>
              This action will mark the election as official.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2 text-sm">
            <p>
              Finalizing <span className="font-semibold">{election.name}</span>{" "}
              will:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Stop all auto-refresh polling</li>
              <li>Display &quot;Official Results&quot; badge to users</li>
              <li>Disable manual refresh</li>
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFinalizeDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleFinalize} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Finalizing..." : "Confirm Finalize"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
