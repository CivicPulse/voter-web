import { ParticipationStatsCard } from "@/components/elections/ParticipationStatsCard"

export function ParticipationTab({
  electionId,
}: Readonly<{
  electionId: string
}>) {
  return (
    <div className="space-y-6">
      <ParticipationStatsCard electionId={electionId} />
    </div>
  )
}
