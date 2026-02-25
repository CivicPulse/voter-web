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
import { Eye } from "lucide-react"
import { Link } from "@tanstack/react-router"
import type { AnalysisRun, AnalysisRunStatus } from "@/types/analysis"

interface AnalysisRunTableProps {
  runs: AnalysisRun[]
}

const statusBadgeVariant: Record<
  AnalysisRunStatus,
  "default" | "destructive" | "secondary" | "outline"
> = {
  completed: "default",
  failed: "destructive",
  processing: "secondary",
  running: "secondary",
  pending: "outline",
}

function formatDateTime(dateString: string | null | undefined) {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleString()
}

function formatCount(value: number | null | undefined) {
  if (value == null) return "-"
  return value.toLocaleString()
}

export function AnalysisRunTable({ runs }: AnalysisRunTableProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Run ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>County</TableHead>
            <TableHead className="text-right">Analyzed</TableHead>
            <TableHead className="text-right">Matches</TableHead>
            <TableHead className="text-right">Mismatches</TableHead>
            <TableHead className="text-right">Unable</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => (
            <TableRow key={run.id}>
              <TableCell className="font-mono text-xs">
                {run.id.slice(0, 8)}
              </TableCell>
              <TableCell>
                <Badge variant={statusBadgeVariant[run.status]}>
                  {run.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                {run.notes?.match(/county:\s*([^\n,;]+)/i)?.[1]?.trim() ?? "All"}
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {formatCount(run.total_voters_analyzed)}
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {formatCount(run.match_count)}
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {formatCount(run.mismatch_count)}
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {formatCount(run.unable_to_analyze_count)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDateTime(run.created_at)}
              </TableCell>
              <TableCell>
                {run.status === "completed" && (
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/admin/analysis/$runId" params={{ runId: run.id }}>
                      <Eye className="h-3 w-3 mr-1" />
                      View Results
                    </Link>
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
