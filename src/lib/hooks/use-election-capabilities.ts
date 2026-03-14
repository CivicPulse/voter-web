import { useQuery } from "@tanstack/react-query"
import { getElectionCapabilities } from "@/lib/api/elections"
import { mapCapabilitiesToFlags, EMPTY_FLAGS } from "@/lib/election-capabilities"
import type { ElectionFeatureFlags } from "@/types/elections"

/**
 * Fetch election API capabilities and return typed feature flags.
 *
 * When the capabilities endpoint returns 404 or any error, all flags
 * default to false — Phase 1 filters remain, new filters are hidden.
 *
 * Cached for 5 minutes (staleTime), garbage collected after 10 minutes (gcTime).
 * One retry on failure before treating as unavailable.
 */
export function useElectionCapabilities(): ElectionFeatureFlags & { isLoading: boolean } {
  const { data, isPending } = useQuery({
    queryKey: ["election-capabilities"],
    queryFn: async () => {
      const response = await getElectionCapabilities()
      return mapCapabilitiesToFlags(response)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1, // 1 retry, then treat as unavailable
  })

  return {
    ...(data ?? EMPTY_FLAGS),
    isLoading: isPending,
  }
}
