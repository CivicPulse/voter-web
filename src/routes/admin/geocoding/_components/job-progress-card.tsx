import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { BatchGeocodeJob } from "@/types/lookup"

const statusVariant: Record<
  BatchGeocodeJob["status"],
  "outline" | "secondary" | "default" | "destructive"
> = {
  pending: "outline",
  running: "secondary",
  completed: "default",
  failed: "destructive",
}

interface JobProgressCardProps {
  job: BatchGeocodeJob
}

export function JobProgressCard({ job }: JobProgressCardProps) {
  const progressPercent =
    job.total_records > 0
      ? Math.round((job.processed / job.total_records) * 100)
      : 0

  const isRunning = job.status === "pending" || job.status === "running"
  const isCompleted = job.status === "completed"
  const isFailed = job.status === "failed"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Batch Geocoding Job</CardTitle>
          <Badge variant={statusVariant[job.status]} className="capitalize">
            {job.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progressPercent} />

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div className="text-muted-foreground">Total Records</div>
          <div className="font-medium">
            {job.total_records.toLocaleString()}
          </div>

          <div className="text-muted-foreground">Processed</div>
          <div className="font-medium">{job.processed.toLocaleString()}</div>

          <div className="text-muted-foreground">Succeeded</div>
          <div className="font-medium text-green-600">
            {job.succeeded.toLocaleString()}
          </div>

          <div className="text-muted-foreground">Failed</div>
          <div className="font-medium text-destructive">
            {job.failed.toLocaleString()}
          </div>

          <div className="text-muted-foreground">Cache Hits</div>
          <div className="font-medium">{job.cache_hits.toLocaleString()}</div>
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

        <div className="text-xs text-muted-foreground space-y-1">
          <div>Created: {new Date(job.created_at).toLocaleString()}</div>
          {job.started_at && (
            <div>Started: {new Date(job.started_at).toLocaleString()}</div>
          )}
          {job.completed_at && (
            <div>Completed: {new Date(job.completed_at).toLocaleString()}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
