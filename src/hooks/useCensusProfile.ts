import { useQuery } from "@tanstack/react-query"
import { fetchCensusProfile } from "@/api/census"
import type { CensusProfile } from "@/types/census"

/**
 * Fetch Census ACS 5-Year Data Profile for a county.
 * Enabled only when both FIPS codes are provided.
 */
export function useCensusProfile(
  fipsState: string | undefined,
  fipsCounty: string | undefined,
) {
  return useQuery<CensusProfile>({
    queryKey: ["census", "profile", fipsState, fipsCounty],
    queryFn: () => fetchCensusProfile(fipsState!, fipsCounty!),
    enabled: !!fipsState && !!fipsCounty,
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 48,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  })
}
