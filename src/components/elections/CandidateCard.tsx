import { Link } from "@tanstack/react-router"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getCandidateInitials } from "@/types/candidates"
import type { CandidateSummary } from "@/types/candidates"
import { cn } from "@/lib/utils"

interface CandidateCardProps {
  candidate: CandidateSummary
  showDetailLink?: boolean
}

const FILING_STATUS_LABELS: Record<string, string> = {
  withdrawn: "Withdrawn",
  disqualified: "Disqualified",
  write_in: "Write-In",
}

export function CandidateCard({ candidate, showDetailLink = true }: CandidateCardProps) {
  const isInactive =
    candidate.filing_status === "withdrawn" ||
    candidate.filing_status === "disqualified"

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3",
        isInactive && "opacity-60",
      )}
    >
      <Avatar>
        {candidate.photo_url && (
          <AvatarImage src={candidate.photo_url} alt={candidate.full_name} />
        )}
        <AvatarFallback>
          {getCandidateInitials(candidate.full_name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-1">
        {showDetailLink ? (
          <Link
            to="/candidates/$candidateId"
            params={{ candidateId: candidate.id }}
            className="text-sm font-medium hover:underline"
          >
            {candidate.full_name}
          </Link>
        ) : (
          <span className="text-sm font-medium">{candidate.full_name}</span>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          {candidate.party && (
            <Badge variant="secondary">{candidate.party}</Badge>
          )}
          {candidate.is_incumbent && (
            <Badge variant="outline">Incumbent</Badge>
          )}
          {candidate.filing_status !== "qualified" &&
            FILING_STATUS_LABELS[candidate.filing_status] && (
              <Badge variant="destructive">
                {FILING_STATUS_LABELS[candidate.filing_status]}
              </Badge>
            )}
        </div>
      </div>
    </div>
  )
}
