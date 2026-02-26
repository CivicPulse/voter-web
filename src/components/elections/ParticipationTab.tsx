import { useNavigate } from "@tanstack/react-router"
import { Route } from "@/routes/elections/$electionDate"
import { ParticipationStatsCard } from "@/components/elections/ParticipationStatsCard"
import { ElectionParticipantList } from "@/components/elections/ElectionParticipantList"
import { useUserRole } from "@/lib/hooks/use-user-role"
import type { ParticipantUrlParams } from "@/types/elections"

export function ParticipationTab({
  electionId,
}: Readonly<{
  electionId: string
}>) {
  const { data: userProfile } = useUserRole()
  const isAdmin =
    userProfile?.role === "admin" || userProfile?.role === "analyst"

  const params = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const onUpdate = (updates: Partial<ParticipantUrlParams>) => {
    navigate({
      search: (prev) => ({ ...prev, ...updates }),
      replace: true,
    })
  }

  const participantParams: ParticipantUrlParams = {
    p_q: params.p_q,
    p_county: params.p_county,
    p_voter_status: params.p_voter_status,
    p_mismatch: params.p_mismatch,
    p_precinct: params.p_precinct,
    p_ballot_style: params.p_ballot_style,
    p_congressional: params.p_congressional,
    p_senate: params.p_senate,
    p_house: params.p_house,
    p_page: params.p_page,
  }

  return (
    <div className="space-y-6">
      <ParticipationStatsCard electionId={electionId} />
      {isAdmin && (
        <ElectionParticipantList
          electionId={electionId}
          params={participantParams}
          onUpdate={onUpdate}
        />
      )}
    </div>
  )
}
