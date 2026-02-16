import { Badge } from "@/components/ui/badge"
import { getReportingPercentage, getTotalVotes } from "@/types/elections"
import type { CountyResult } from "@/types/elections"
import type { CandidateColorMap } from "@/lib/candidate-colors"
import { CandidateResultRow } from "./CandidateResultRow"

interface CountyResultsPanelProps {
  countyResult: CountyResult
  candidateColorMap?: CandidateColorMap
}

export function CountyResultsPanel({ countyResult, candidateColorMap }: CountyResultsPanelProps) {
  const reportingPct = getReportingPercentage(
    countyResult.precincts_reporting,
    countyResult.precincts_participating,
  )
  const totalVotes = getTotalVotes(countyResult.candidates)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">{countyResult.county_name}</h3>
        <Badge variant="outline" className="text-xs">
          {reportingPct.toFixed(0)}% reporting
        </Badge>
      </div>

      <div className="text-sm text-muted-foreground mb-3">
        {countyResult.precincts_reporting} of{" "}
        {countyResult.precincts_participating} precincts reporting
      </div>

      <div className="divide-y">
        {countyResult.candidates
          .sort((a, b) => b.vote_count - a.vote_count)
          .map((candidate, index) => (
            <CandidateResultRow
              key={candidate.id}
              candidate={candidate}
              totalVotes={totalVotes}
              rank={index + 1}
              candidateColorMap={candidateColorMap}
            />
          ))}
      </div>
    </div>
  )
}
