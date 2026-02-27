import { useQuery } from "@tanstack/react-query"
import { checkProviderBoundaries } from "@/api/voters"
import type { VoterGeocodedLocation } from "@/types/lookup"
import type { ProviderBoundaryCheckResponse } from "@/types/voter"

export function useProviderBoundaryCheck(
  voterId: string | null,
  locations: VoterGeocodedLocation[],
): {
  data: ProviderBoundaryCheckResponse | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
} {
  const nonPrimaryLocations = locations.filter((l) => !l.is_primary)
  return useQuery({
    queryKey: ["voters", voterId, "provider-boundary-check"],
    queryFn: () =>
      checkProviderBoundaries(voterId!, {
        locations: nonPrimaryLocations.map((l) => ({
          provider: l.source_type,
          latitude: l.latitude,
          longitude: l.longitude,
        })),
      }),
    enabled: !!voterId && nonPrimaryLocations.length > 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  })
}
