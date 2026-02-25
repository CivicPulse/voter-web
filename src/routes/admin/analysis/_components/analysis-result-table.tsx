import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AnalysisResult, MatchStatus, VoterSummary } from "@/types/analysis"

interface AnalysisResultTableProps {
  results: AnalysisResult[]
}

const matchStatusVariant: Record<
  MatchStatus,
  "default" | "destructive" | "secondary"
> = {
  match: "default",
  mismatch: "destructive",
  unable_to_analyze: "secondary",
}

const matchStatusLabel: Record<MatchStatus, string> = {
  match: "Match",
  mismatch: "Mismatch",
  unable_to_analyze: "Unable",
}

function formatVoterName(summary: VoterSummary | null | undefined): string {
  if (!summary) return "-"
  const parts = [summary.last_name, summary.first_name, summary.middle_name]
    .filter(Boolean)
  return parts.length > 0 ? parts.join(", ") : "-"
}

function formatVoterCounty(summary: VoterSummary | null | undefined): string {
  return summary?.county ?? "-"
}

function formatRegistrationNumber(summary: VoterSummary | null | undefined): string {
  return summary?.voter_registration_number ?? "-"
}

export function AnalysisResultTable({ results }: AnalysisResultTableProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Voter Name</TableHead>
            <TableHead>Registration #</TableHead>
            <TableHead>County</TableHead>
            <TableHead>Match Status</TableHead>
            <TableHead>Mismatch Details</TableHead>
            <TableHead>Analyzed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => (
            <TableRow key={result.id}>
              <TableCell className="text-sm">
                {formatVoterName(result.voter_summary)}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {formatRegistrationNumber(result.voter_summary)}
              </TableCell>
              <TableCell className="text-sm">
                {formatVoterCounty(result.voter_summary)}
              </TableCell>
              <TableCell>
                <Badge variant={matchStatusVariant[result.match_status]}>
                  {matchStatusLabel[result.match_status]}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[300px]">
                {result.mismatch_details && result.mismatch_details.length > 0 ? (
                  <ul className="text-xs space-y-1">
                    {result.mismatch_details.map((detail, i) => (
                      <li key={i} className="text-muted-foreground">
                        <span className="font-medium">
                          {detail.boundary_type}:
                        </span>{" "}
                        {detail.registered} → {detail.determined}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(result.analyzed_at).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
