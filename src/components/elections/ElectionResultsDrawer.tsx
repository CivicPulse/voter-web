import { ChevronUp, ChevronDown } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Badge } from "@/components/ui/badge"
import {
  getReportingPercentage,
  getTotalVotes,
} from "@/types/elections"
import type { ElectionResultsResponse, CountyResult } from "@/types/elections"
import { CandidateResultRow } from "./CandidateResultRow"
import { CountyResultsPanel } from "./CountyResultsPanel"

interface ElectionResultsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  results: ElectionResultsResponse
  selectedCounty: string | null
  onClearCounty: () => void
}

function RaceWideSummary({ results }: { results: ElectionResultsResponse }) {
  const totalVotes = getTotalVotes(results.candidates)
  const reportingPct = getReportingPercentage(
    results.total_precincts_reporting,
    results.total_precincts_participating,
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Race-Wide Results</h3>
        <Badge variant="outline" className="text-xs">
          {reportingPct.toFixed(0)}% reporting
        </Badge>
      </div>
      <div className="text-sm text-muted-foreground mb-3">
        {results.total_precincts_reporting} of{" "}
        {results.total_precincts_participating} precincts reporting
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

export function ElectionResultsDrawer({
  open,
  onOpenChange,
  results,
  selectedCounty,
  onClearCounty,
}: ElectionResultsDrawerProps) {
  const countyResult: CountyResult | undefined = selectedCounty
    ? results.county_results.find((c) => c.county_name === selectedCounty)
    : undefined

  return (
    <>
      {/* Trigger button overlaid on map */}
      <button
        className="absolute bottom-0 left-0 right-0 z-[1000] flex items-center justify-center gap-2 rounded-t-lg bg-background/95 px-4 py-2 text-sm font-medium shadow-[0_-2px_10px_rgba(0,0,0,0.1)] backdrop-blur-sm transition-colors hover:bg-accent"
        onClick={() => onOpenChange(true)}
      >
        <ChevronUp className="h-4 w-4" />
        {selectedCounty ? `View ${selectedCounty} Results` : "View Results"}
      </button>

      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {countyResult ? countyResult.county_name : "Race Results"}
            </DrawerTitle>
            <DrawerDescription>
              {countyResult
                ? "County-specific results. Swipe down to close."
                : "Race-wide summary. Click a county on the map for details."}
            </DrawerDescription>
            {countyResult && (
              <button
                onClick={onClearCounty}
                className="text-xs text-primary hover:underline mt-1"
              >
                ← Back to race-wide results
              </button>
            )}
          </DrawerHeader>

          <div className="overflow-y-auto px-4 pb-6 max-h-[60vh] md:max-h-[70vh]">
            {countyResult ? (
              <CountyResultsPanel countyResult={countyResult} />
            ) : (
              <RaceWideSummary results={results} />
            )}
          </div>

          <button
            className="flex shrink-0 items-center justify-center gap-2 border-t bg-background/95 px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            onClick={() => onOpenChange(false)}
          >
            <ChevronDown className="h-4 w-4" />
            Hide Results
          </button>
        </DrawerContent>
      </Drawer>
    </>
  )
}
