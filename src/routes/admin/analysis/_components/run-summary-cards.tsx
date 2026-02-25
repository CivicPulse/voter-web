import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { AnalysisRun } from "@/types/analysis"

interface RunSummaryCardsProps {
  run: AnalysisRun
}

function formatStat(
  count: number | null | undefined,
  total: number | null | undefined
) {
  if (count == null) return { value: "\u2014", percentage: "" }
  const value = count.toLocaleString()
  if (total && total > 0) {
    const pct = ((count / total) * 100).toFixed(1)
    return { value, percentage: `${pct}%` }
  }
  return { value, percentage: "" }
}

export function RunSummaryCards({ run }: RunSummaryCardsProps) {
  const total = formatStat(
    run.total_voters_analyzed,
    run.total_voters_analyzed
  )
  const matches = formatStat(run.match_count, run.total_voters_analyzed)
  const mismatches = formatStat(
    run.mismatch_count,
    run.total_voters_analyzed
  )
  const unable = formatStat(
    run.unable_to_analyze_count,
    run.total_voters_analyzed
  )

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Analyzed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total.value}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {matches.value}
          </div>
          {matches.percentage && (
            <p className="text-xs text-muted-foreground">
              {matches.percentage} of total
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Mismatches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {mismatches.value}
          </div>
          {mismatches.percentage && (
            <p className="text-xs text-muted-foreground">
              {mismatches.percentage} of total
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Unable to Analyze
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            {unable.value}
          </div>
          {unable.percentage && (
            <p className="text-xs text-muted-foreground">
              {unable.percentage} of total
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
