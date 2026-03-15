import { useQuery } from "@tanstack/react-query"
import { getFilterOptions } from "@/lib/api/elections"
import type { ElectionFilters, ElectionFeatureFlags } from "@/types/elections"

/**
 * TanStack Query hook for fetching election filter options.
 *
 * The query key includes `currentFilters` so TanStack Query automatically
 * re-fetches when any filter changes, keeping dropdown options scoped to
 * the current filter state.
 *
 * Only fires when `flags.filterOptions` is true — avoids unnecessary 404s
 * against backends that don't expose the filter-options endpoint.
 */
export function useFilterOptions(
  currentFilters: Partial<ElectionFilters>,
  flags: Pick<ElectionFeatureFlags, "filterOptions">,
) {
  return useQuery({
    queryKey: ["election-filter-options", currentFilters],
    queryFn: () => getFilterOptions(currentFilters),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    enabled: flags.filterOptions,
  })
}
