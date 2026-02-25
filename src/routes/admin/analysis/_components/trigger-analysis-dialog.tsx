import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useTriggerAnalysis } from "@/lib/hooks/use-analysis-runs"

interface TriggerAnalysisDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TriggerAnalysisDialog({
  open,
  onOpenChange,
}: TriggerAnalysisDialogProps) {
  const [county, setCounty] = useState("")
  const [notes, setNotes] = useState("")
  const [showConfirmation, setShowConfirmation] = useState(false)
  const triggerMutation = useTriggerAnalysis()

  const handleSubmit = () => {
    if (!county.trim() && !showConfirmation) {
      setShowConfirmation(true)
      return
    }

    triggerMutation.mutate(
      {
        county: county.trim() || null,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          onOpenChange(false)
          setCounty("")
          setNotes("")
          setShowConfirmation(false)
        },
      }
    )
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setCounty("")
      setNotes("")
      setShowConfirmation(false)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Run District Mismatch Analysis</DialogTitle>
          <DialogDescription>
            Analyze voter district assignments to find mismatches between
            registered and determined boundaries.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="county">County (optional)</Label>
            <Input
              id="county"
              placeholder="e.g. bibb"
              value={county}
              onChange={(e) => {
                setCounty(e.target.value)
                setShowConfirmation(false)
              }}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to analyze all voters across all counties.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this analysis run..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {showConfirmation && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No county specified. This will analyze <strong>ALL voters</strong>{" "}
                across all counties, which may take a while. Click &quot;Run Analysis&quot;
                again to confirm.
              </AlertDescription>
            </Alert>
          )}

          {triggerMutation.isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to trigger analysis: {triggerMutation.error.message}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={triggerMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={triggerMutation.isPending}
          >
            {triggerMutation.isPending ? "Starting..." : "Run Analysis"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
