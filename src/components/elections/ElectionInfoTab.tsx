import type { Election } from "@/types/elections"
import { CandidateList } from "@/components/elections/CandidateList"
import { ElectionEligibility } from "@/components/elections/ElectionEligibility"
import { ElectionGeographicArea } from "@/components/elections/ElectionGeographicArea"
import { ElectionKeyDates } from "@/components/elections/ElectionKeyDates"
import { ElectionMetadata } from "@/components/elections/ElectionMetadata"

interface ElectionInfoTabProps {
  election: Election
  electionId: string
  isAdmin?: boolean
}

export function ElectionInfoTab({
  election,
  electionId,
  isAdmin,
}: ElectionInfoTabProps) {
  return (
    <div className="space-y-6 py-4">
      <CandidateList electionId={electionId} isAdmin={isAdmin} />
      <ElectionEligibility election={election} />
      <ElectionGeographicArea election={election} />
      <ElectionKeyDates election={election} />
      <ElectionMetadata election={election} />
    </div>
  )
}
