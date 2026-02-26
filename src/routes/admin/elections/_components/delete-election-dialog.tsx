import { useState } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { HTTPError } from "ky"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useDeleteElection } from "@/lib/hooks/use-admin-elections"

interface DeleteElectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  electionName: string
  electionId: string
  onDeleted?: () => void
}

export function DeleteElectionDialog({
  open,
  onOpenChange,
  electionName,
  electionId,
  onDeleted,
}: DeleteElectionDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const deleteMutation = useDeleteElection()

  const handleDelete = () => {
    setErrorMessage(null)
    deleteMutation.mutate(electionId, {
      onSuccess: () => {
        onDeleted?.()
        onOpenChange(false)
      },
      onError: async (error) => {
        if (error instanceof HTTPError && error.response.status === 409) {
          try {
            const body = await error.response.json() as { detail?: string }
            setErrorMessage(body.detail ?? "This election cannot be deleted.")
          } catch {
            setErrorMessage("This election cannot be deleted.")
          }
        } else if (!(error instanceof HTTPError) || error.response.status >= 500) {
          setErrorMessage(error.message || "An error occurred while deleting the election.")
        }
        // 401/403 handled by hook (toast) — close dialog
        if (error instanceof HTTPError && (error.response.status === 401 || error.response.status === 403)) {
          onOpenChange(false)
        }
      },
    })
  }

  const handleCancel = () => {
    setErrorMessage(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Election
          </DialogTitle>
          <DialogDescription>
            This action is permanent and cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-sm">
          <p>
            Are you sure you want to delete{" "}
            <span className="font-semibold">{electionName}</span>? All
            associated results and data will be permanently removed.
          </p>
        </div>
        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={deleteMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
