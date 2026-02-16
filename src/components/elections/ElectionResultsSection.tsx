import { Card, CardContent } from "@/components/ui/card"
import type { ElectionResultsResponse, CountyResult } from "@/types/elections"
import type { CandidateColorMap } from "@/lib/candidate-colors"
import { RaceWideSummary } from "./RaceWideSummary"
import { CountyResultsPanel } from "./CountyResultsPanel"

interface ElectionResultsSectionProps {
  results: ElectionResultsResponse
  selectedCounty: string | null
  onClearCounty: () => void
  candidateColorMap?: CandidateColorMap
}

export function ElectionResultsSection({
  results,
  selectedCounty,
  onClearCounty,
  candidateColorMap,
}: ElectionResultsSectionProps) {
  const countyResult: CountyResult | undefined = selectedCounty
    ? results.county_results.find((c) => c.county_name === selectedCounty)
    : undefined

  return (
    <Card>
      <CardContent>
        {countyResult && (
          <button
            onClick={onClearCounty}
            className="text-xs text-primary hover:underline mb-3"
          >
            ← Back to race-wide results
          </button>
        )}
        {countyResult ? (
          <CountyResultsPanel countyResult={countyResult} candidateColorMap={candidateColorMap} />
        ) : (
          <RaceWideSummary results={results} candidateColorMap={candidateColorMap} />
        )}
      </CardContent>
    </Card>
  )
}
