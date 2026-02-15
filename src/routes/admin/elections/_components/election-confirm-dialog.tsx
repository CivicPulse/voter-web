import type { ElectionFormValues } from "@/lib/schemas/election-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ElectionConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: ElectionFormValues | null
  onConfirm: () => void
  isPending: boolean
}

export function ElectionConfirmDialog({
  open,
  onOpenChange,
  data,
  onConfirm,
  isPending,
}: ElectionConfirmDialogProps) {
  if (!data) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Election Creation</DialogTitle>
          <DialogDescription>
            Please review the election details before creating.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{data.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium">{data.election_date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type</span>
            <span className="font-medium capitalize">{data.election_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">District</span>
            <span className="font-medium">{data.district}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Refresh Interval</span>
            <span className="font-medium">
              {data.refresh_interval_seconds}s
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? "Creating..." : "Create Election"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
