import { useQuery } from "@tanstack/react-query"
import {
  getElectionDetail,
  getElectionResults,
} from "@/lib/api/elections"
import type { Election, ElectionResultsResponse } from "@/types/elections"
import { toast } from "sonner"

export interface RaceResultsData {
  election: Election
  results: ElectionResultsResponse
}

/**
 * Hook to fetch both election detail and results for a specific race.
 * Combines two API calls into a single query for the race results page.
 */
export function useRaceResults(electionId: string) {
  return useQuery({
    queryKey: ["elections", "results", electionId],
    queryFn: async (): Promise<RaceResultsData> => {
      const [election, results] = await Promise.all([
        getElectionDetail(electionId),
        getElectionResults(electionId),
      ])
      return { election, results }
    },
    enabled: !!electionId,
    staleTime: 30 * 1000,
    retry: (failureCount) => {
      if (failureCount === 0) {
        toast.warning("Connection issue", {
          description: "Having trouble loading race results. Retrying...",
        })
      }
      return failureCount < 2
    },
  })
}
