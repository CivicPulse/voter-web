import { useQuery } from "@tanstack/react-query"
import { getElections } from "@/lib/api/elections"
import type { ElectionFilters } from "@/types/elections"
import { AuthenticationError, PermissionError } from "@/types/admin"
import { toast } from "sonner"

/**
 * Hook to fetch a flat, paginated election list.
 * Returns elections sorted by date (newest first).
 */
export function useElections(
  filters?: Partial<ElectionFilters>,
  page = 1,
  pageSize = 25,
) {
  return useQuery({
    queryKey: ["elections", "list", filters, page, pageSize],
    queryFn: async () => {
      const response = await getElections({
        ...filters,
        page,
        page_size: pageSize,
      })
      // Ensure date DESC, name ASC sort order
      const sorted = [...response.elections].sort(
        (a, b) =>
          b.election_date.localeCompare(a.election_date) ||
          a.name.localeCompare(b.name),
      )
      return {
        ...response,
        elections: sorted,
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
