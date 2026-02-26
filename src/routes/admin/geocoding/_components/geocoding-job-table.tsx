import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { BatchGeocodeJob } from "@/types/lookup"

interface GeocodingJobTableProps {
  jobs: BatchGeocodeJob[]
}

const statusVariant: Record<
  BatchGeocodeJob["status"],
  "outline" | "secondary" | "default" | "destructive"
> = {
  pending: "outline",
  running: "secondary",
  completed: "default",
  failed: "destructive",
}

function formatDateTime(dateString: string | null) {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleString()
}

function getProgressDisplay(job: BatchGeocodeJob) {
  if (job.total_records == null || job.processed == null) return "-"
  if (job.total_records === 0) return "0 / 0"
  const pct = Math.round((job.processed / job.total_records) * 100)
  return `${job.processed.toLocaleString()} / ${job.total_records.toLocaleString()} (${pct}%)`
}

export function GeocodingJobTable({ jobs }: Readonly<GeocodingJobTableProps>) {
  if (jobs.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        No geocoding jobs found.
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job ID</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>County</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Cache Hits</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Completed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell className="font-mono text-xs">
                {job.id.slice(0, 8)}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{job.provider}</Badge>
              </TableCell>
              <TableCell>{job.county ?? "All"}</TableCell>
              <TableCell>
                <Badge
                  variant={statusVariant[job.status]}
                  className="capitalize"
                >
                  {job.status}
                </Badge>
                {job.force_regeocode && (
                  <Badge variant="secondary" className="ml-1">
                    Re-geocode
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {getProgressDisplay(job)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {job.cache_hits?.toLocaleString() ?? "-"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDateTime(job.started_at)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDateTime(job.completed_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
