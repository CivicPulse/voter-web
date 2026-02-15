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
import { Download } from "lucide-react"
import type { ExportJob } from "@/types/admin"
import { useDownloadExport } from "@/lib/hooks/use-export-jobs"

interface ExportJobTableProps {
  jobs: ExportJob[]
}

export function ExportJobTable({ jobs }: ExportJobTableProps) {
  const downloadMutation = useDownloadExport()

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

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job ID</TableHead>
            <TableHead>Export Type</TableHead>
            <TableHead>Status</TableHead>
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
              <TableCell>
                <Badge variant="outline">{job.export_type}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(job.status)}>
                  {job.status}
                </Badge>
              </TableCell>
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
                {job.status === "completed" && job.download_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadMutation.mutate(job.id)}
                    disabled={downloadMutation.isPending}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
