import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { useCreateElection } from "@/lib/hooks/use-admin-elections"
import type { ElectionFormValues } from "@/lib/schemas/election-form"
import { AdminErrorBoundary } from "@/components/admin-error-boundary"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { ElectionForm } from "./_components/election-form"
import { ElectionConfirmDialog } from "./_components/election-confirm-dialog"

export const Route = createFileRoute("/admin/elections/create")({
  component: () => (
    <AdminErrorBoundary>
      <AdminCreateElectionPage />
    </AdminErrorBoundary>
  ),
})

function AdminCreateElectionPage() {
  const navigate = useNavigate()
  const createMutation = useCreateElection()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingData, setPendingData] = useState<ElectionFormValues | null>(
    null,
  )

  const handleFormSubmit = (data: ElectionFormValues) => {
    setPendingData(data)
    setShowConfirmDialog(true)
  }

  const handleConfirm = () => {
    if (pendingData) {
      createMutation.mutate(pendingData, {
        onSuccess: () => {
          navigate({ to: "/admin/elections" })
        },
      })
      setShowConfirmDialog(false)
      setPendingData(null)
    }
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
        <h1 className="text-3xl font-bold mb-2">Create Election</h1>
        <p className="text-muted-foreground">
          Add a new election race for results tracking
        </p>
      </div>

      {createMutation.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to create election: {createMutation.error.message}
          </AlertDescription>
        </Alert>
      )}

      <ElectionForm
        onSubmit={handleFormSubmit}
        isPending={createMutation.isPending}
      />

      <ElectionConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        data={pendingData}
        onConfirm={handleConfirm}
        isPending={createMutation.isPending}
      />
    </div>
  )
}
