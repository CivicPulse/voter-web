import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { getPartyColor, getVotePercentage } from "@/types/elections"
import type { CandidateResult } from "@/types/elections"
import type { CandidateColorMap } from "@/lib/candidate-colors"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface CandidateResultRowProps {
  candidate: CandidateResult
  totalVotes: number
  rank: number
  candidateColorMap?: CandidateColorMap
}

export function CandidateResultRow({
  candidate,
  totalVotes,
  rank,
  candidateColorMap,
}: CandidateResultRowProps) {
  const [expanded, setExpanded] = useState(false)
  const partyColor = candidateColorMap?.get(candidate.id)
    ?? getPartyColor(candidate.political_party)
  const percentage = getVotePercentage(candidate.vote_count, totalVotes)
  const hasVoteMethods = candidate.group_results.length > 0

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="py-2">
        <CollapsibleTrigger
          className="flex items-center gap-3 w-full text-left"
          disabled={!hasVoteMethods}
        >
          <span className="text-sm text-muted-foreground w-5 text-right shrink-0">
            {rank}
          </span>
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: partyColor.fill }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium truncate">{candidate.name}</span>
              <span className="text-sm text-muted-foreground shrink-0">
                {candidate.vote_count.toLocaleString()} ({percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(percentage, 100)}%`,
                  backgroundColor: partyColor.fill,
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">
                {candidate.political_party}
              </span>
              {hasVoteMethods && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  {expanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  Vote methods
                </span>
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {hasVoteMethods && (
            <div className="ml-11 mt-2 space-y-1 border-l-2 pl-3">
              {candidate.group_results.map((method) => (
                <div
                  key={method.group_name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {method.group_name}
                  </span>
                  <span>{method.vote_count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
