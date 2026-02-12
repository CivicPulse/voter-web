import { useQuery } from "@tanstack/react-query"
import { fetchStateCensusProfile } from "@/api/census"
import type { CensusProfile } from "@/types/census"

/**
 * Fetch Census ACS 5-Year Data Profile for a state.
 * Enabled only when the state FIPS code is provided.
 */
export function useStateCensusProfile(fipsState: string | undefined) {
  return useQuery<CensusProfile>({
    queryKey: ["census", "profile", "state", fipsState],
    queryFn: () => fetchStateCensusProfile(fipsState!),
    enabled: !!fipsState,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 48,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  })
}
