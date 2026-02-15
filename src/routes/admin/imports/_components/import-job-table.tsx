import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RotateCcw } from "lucide-react"
import type { ImportJob } from "@/types/admin"
import { ImportRetryDialog } from "./import-retry-dialog"
import { getImportProgress } from "@/types/admin"

interface ImportJobTableProps {
  jobs: ImportJob[]
}

export function ImportJobTable({ jobs }: ImportJobTableProps) {
  const [retryJob, setRetryJob] = useState<ImportJob | null>(null)

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "failed":
        return "destructive"
      case "processing":
        return "secondary"
      case "pending":
        return "outline"
      default:
        return "outline"
    }
  }

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getProgressDisplay = (job: ImportJob) => {
    const progress = getImportProgress(job)
    if (progress === null) return null

    if (job.status === "processing") {
      return (
        <span className="text-xs text-muted-foreground">
          {job.processed_records} / {job.total_records} ({Math.round(progress)}%)
        </span>
      )
    }

    if (job.status === "completed") {
      return (
        <span className="text-xs text-muted-foreground">
          {job.processed_records} records
          {job.failed_records > 0 && ` (${job.failed_records} failed)`}
        </span>
      )
    }

    return null
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job ID</TableHead>
              <TableHead>Filename</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-mono text-xs">
                  {job.id.slice(0, 8)}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {job.filename}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{job.import_type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(job.status)}>
                    {job.status}
                  </Badge>
                </TableCell>
                <TableCell>{getProgressDisplay(job)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTime(job.started_at)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTime(job.completed_at)}
                </TableCell>
                <TableCell className="max-w-[200px]">
                  {job.status === "failed" && job.error_message && (
                    <span className="text-xs text-destructive line-clamp-2">
                      {job.error_message}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {job.status === "failed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRetryJob(job)}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {retryJob && (
        <ImportRetryDialog
          job={retryJob}
          open={!!retryJob}
          onOpenChange={(open) => !open && setRetryJob(null)}
        />
      )}
    </>
  )
}
