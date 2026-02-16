import { useQuery } from "@tanstack/react-query"
import { getElections } from "@/lib/api/elections"
import type { Election } from "@/types/elections"
import { toast } from "sonner"

/**
 * Hook to fetch all races for a specific election date.
 * Uses date_from/date_to filters with the same date to get all races on that day.
 */
export function useElectionDetail(electionDate: string) {
  return useQuery({
    queryKey: ["elections", "date", electionDate],
    queryFn: async () => {
      const response = await getElections({
        date_from: electionDate,
        date_to: electionDate,
        page_size: 100,
      })
      return response.elections as Election[]
    },
    enabled: !!electionDate,
    staleTime: 30 * 1000,
    retry: (failureCount) => {
      if (failureCount === 0) {
        toast.warning("Connection issue", {
          description: "Having trouble loading race list. Retrying...",
        })
      }
      return failureCount < 2
    },
  })
}
