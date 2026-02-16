import { Badge } from "@/components/ui/badge"
import {
  getReportingPercentage,
  getTotalVotes,
  resolvePrecinctCounts,
} from "@/types/elections"
import type { ElectionResultsResponse } from "@/types/elections"
import { CandidateResultRow } from "./CandidateResultRow"

interface RaceWideSummaryProps {
  results: ElectionResultsResponse
}

export function RaceWideSummary({ results }: RaceWideSummaryProps) {
  const totalVotes = getTotalVotes(results.candidates)
  const { participating, reporting } = resolvePrecinctCounts(results)
  const reportingPct = getReportingPercentage(reporting, participating)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Race-Wide Results</h3>
        <Badge variant="outline" className="text-xs">
          {reportingPct.toFixed(0)}% reporting
        </Badge>
      </div>
      <div className="text-sm text-muted-foreground mb-3">
        {reporting} of{" "}
        {participating} precincts reporting
        {" · "}
        {totalVotes.toLocaleString()} total votes
      </div>
      <div className="divide-y">
        {results.candidates
          .sort((a, b) => b.vote_count - a.vote_count)
          .map((candidate, index) => (
            <CandidateResultRow
              key={candidate.id}
              candidate={candidate}
              totalVotes={totalVotes}
              rank={index + 1}
            />
          ))}
      </div>
    </div>
  )
}
