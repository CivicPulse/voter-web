import { useQuery } from "@tanstack/react-query"
import { getFilterOptions } from "@/lib/api/elections"
import type { ElectionFilters } from "@/types/elections"

/**
 * TanStack Query hook for fetching election filter options.
 *
 * The query key includes `currentFilters` so TanStack Query automatically
 * re-fetches when any filter changes, keeping dropdown options scoped to
 * the current filter state.
 */
export function useFilterOptions(currentFilters: Partial<ElectionFilters>) {
  return useQuery({
    queryKey: ["election-filter-options", currentFilters],
    queryFn: () => getFilterOptions(currentFilters),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}
