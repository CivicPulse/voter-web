import { useQuery } from "@tanstack/react-query"
import { getParticipationStats } from "@/lib/api/elections"

export function useParticipationStats(electionId: string) {
  return useQuery({
    queryKey: ["elections", electionId, "participation", "stats"],
    queryFn: () => getParticipationStats(electionId),
    enabled: !!electionId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  })
}
