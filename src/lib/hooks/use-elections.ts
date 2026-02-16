import { useQuery } from "@tanstack/react-query"
import { getElections } from "@/lib/api/elections"
import { groupElectionsByDate } from "@/types/elections"
import type { ElectionFilters } from "@/types/elections"
import { AuthenticationError, PermissionError } from "@/types/admin"
import { toast } from "sonner"

/**
 * Hook to fetch paginated elections and group them by date into ElectionEvents.
 */
export function useElections(
  filters?: Partial<ElectionFilters>,
  page = 1,
  pageSize = 20,
) {
  return useQuery({
    queryKey: ["elections", "list", filters, page, pageSize],
    queryFn: async () => {
      const response = await getElections({
        ...filters,
        page,
        page_size: pageSize,
      })
      return {
        ...response,
        events: groupElectionsByDate(response.elections),
      }
    },
    staleTime: 30 * 1000,
    retry: (failureCount, error) => {
      if (
        error instanceof AuthenticationError ||
        error instanceof PermissionError
      ) {
        return false
      }
      if (failureCount === 0) {
        toast.warning("Connection issue", {
          description: "Having trouble loading elections. Retrying...",
        })
      }
      return failureCount < 2
    },
  })
}
