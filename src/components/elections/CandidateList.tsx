import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCandidates } from "@/lib/hooks/use-candidates"
import { useRaceResults } from "@/lib/hooks/use-race-results"
import { sortCandidates } from "@/types/candidates"
import { CandidateCard } from "@/components/elections/CandidateCard"
import type { CandidateSummary } from "@/types/candidates"

interface CandidateListProps {
  electionId: string
  isAdmin?: boolean
}

export function CandidateList({ electionId, isAdmin }: CandidateListProps) {
  const {
    data: candidatesData,
    isLoading,
    error,
    refetch,
  } = useCandidates(electionId, { page_size: 100 })

  const { data: raceData } = useRaceResults(electionId)

  // Determine candidates to display
  const apiCandidates = candidatesData?.items ?? []
  let displayCandidates: CandidateSummary[]

  if (apiCandidates.length > 0) {
    displayCandidates = sortCandidates(apiCandidates)
  } else if (raceData?.results.candidates && raceData.results.candidates.length > 0) {
    // Fallback to results candidates
    displayCandidates = raceData.results.candidates.map((rc) => ({
      id: rc.id,
      election_id: electionId,
      full_name: rc.name,
      party: rc.political_party,
      photo_url: null,
      ballot_order: rc.ballot_order ?? null,
      filing_status: "qualified" as const,
      is_incumbent: false,
      created_at: "",
    }))
    displayCandidates = sortCandidates(displayCandidates)
  } else {
    displayCandidates = []
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg border border-destructive/50 bg-destructive/5">
        <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
        <p className="text-sm text-destructive">Failed to load candidates.</p>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Candidates</h3>
        {isAdmin && (
          <div data-testid="admin-controls-placeholder" />
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && displayCandidates.length === 0 && (
        <p className="text-sm text-muted-foreground py-4">
          Candidates not yet announced.
        </p>
      )}

      {!isLoading && displayCandidates.length > 0 && (
        <div className="space-y-2">
          {displayCandidates.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </div>
      )}
    </div>
  )
}
