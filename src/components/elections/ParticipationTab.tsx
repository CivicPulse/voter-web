import { ParticipationStatsCard } from "@/components/elections/ParticipationStatsCard"
import { ElectionParticipantList } from "@/components/elections/ElectionParticipantList"
import { useUserRole } from "@/lib/hooks/use-user-role"

export function ParticipationTab({
  electionId,
}: Readonly<{
  electionId: string
}>) {
  const { data: userProfile } = useUserRole()
  const isAdmin =
    userProfile?.role === "admin" || userProfile?.role === "analyst"

  return (
    <div className="space-y-6">
      <ParticipationStatsCard electionId={electionId} />
      {isAdmin && <ElectionParticipantList electionId={electionId} />}
    </div>
  )
}
