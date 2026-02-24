import { useQuery } from "@tanstack/react-query"
import { HTTPError } from "ky"
import { getParticipationStats } from "@/lib/api/elections"

export function useParticipationStats(electionId: string) {
  return useQuery({
    queryKey: ["elections", electionId, "participation", "stats"],
    queryFn: () => getParticipationStats(electionId),
    enabled: !!electionId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: (failureCount, error) => {
      if (error instanceof HTTPError) {
        const status = error.response.status
        if (status === 401 || status === 403) return false
      }
      return failureCount < 1
    },
  })
}
