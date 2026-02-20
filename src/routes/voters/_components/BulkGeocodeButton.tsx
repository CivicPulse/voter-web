import { useState } from "react"
import { Globe, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { useUserRole } from "@/lib/hooks/use-user-role"
import {
  useBatchGeocode,
  useBatchGeocodeStatus,
} from "@/hooks/useAddressLookup"

export function BulkGeocodeButton() {
  const { data: userProfile } = useUserRole()
  const canEdit =
    userProfile?.role === "admin" || userProfile?.role === "analyst"

  const [jobId, setJobId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const batchMutation = useBatchGeocode()
  const { data: jobStatus } = useBatchGeocodeStatus(jobId)

  if (!canEdit) return null

  const isRunning =
    jobStatus?.status === "pending" || jobStatus?.status === "running"
  const isCompleted = jobStatus?.status === "completed"
  const isFailed = jobStatus?.status === "failed"
  const progressPercent =
    jobStatus && jobStatus.total_records > 0
      ? Math.round((jobStatus.processed / jobStatus.total_records) * 100)
      : 0

  function handleStart() {
    batchMutation.mutate(
      {},
      {
        onSuccess: (job) => {
          setJobId(job.id)
          setDialogOpen(true)
        },
        onError: () => {
          toast.error("Failed to start batch geocoding.")
        },
      },
    )
  }

  function handleClose() {
    setDialogOpen(false)
    if (!isRunning) {
      setJobId(null)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleStart}
        disabled={batchMutation.isPending || isRunning}
      >
        {batchMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Globe className="h-4 w-4 mr-2" />
        )}
        Bulk Geocode
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Geocoding</DialogTitle>
            <DialogDescription>
              Geocoding all voters without locations.
            </DialogDescription>
          </DialogHeader>

          {!jobStatus ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Starting job...
            </div>
          ) : (
            <div className="space-y-4">
              <Progress value={progressPercent} />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Status</div>
                <div className="font-medium capitalize">{jobStatus.status}</div>
                <div className="text-muted-foreground">Total</div>
                <div className="font-medium">{jobStatus.total_records}</div>
                <div className="text-muted-foreground">Processed</div>
                <div className="font-medium">{jobStatus.processed}</div>
                <div className="text-muted-foreground">Succeeded</div>
                <div className="font-medium text-green-600">
                  {jobStatus.succeeded}
                </div>
                {jobStatus.failed > 0 && (
                  <>
                    <div className="text-muted-foreground">Failed</div>
                    <div className="font-medium text-destructive">
                      {jobStatus.failed}
                    </div>
                  </>
                )}
                {jobStatus.cache_hits > 0 && (
                  <>
                    <div className="text-muted-foreground">Cache Hits</div>
                    <div className="font-medium">{jobStatus.cache_hits}</div>
                  </>
                )}
              </div>

              {isRunning && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </div>
              )}

              {isCompleted && (
                <p className="text-sm text-green-600">
                  Batch geocoding completed successfully.
                </p>
              )}

              {isFailed && (
                <p className="text-sm text-destructive">
                  Batch geocoding failed. Some records may have been processed.
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {isRunning ? "Hide" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
