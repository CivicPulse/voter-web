import { useQueries } from "@tanstack/react-query"
import { pointLookup } from "@/api/lookup"
import type { BatchBoundaryCheckResponse } from "@/types/voter"
import type { PointLookupResponse } from "@/types/lookup"
import { BOUNDARY_TYPE_TO_REGISTERED_KEY } from "@/lib/district-comparison"

/**
 * For each provider in the batch boundary check response, perform a point-lookup
 * at that provider's geocoded coordinates to determine the actual district
 * the location falls in (not just whether it's inside a specific boundary).
 *
 * Returns a Map<source_type, Map<boundary_type, boundary_identifier>> so callers
 * can look up "for census, what is the actual county_commission district?"
 */
export function useProviderPointLookups(
  providerResults: BatchBoundaryCheckResponse | null | undefined,
): Map<string, Map<string, string>> {
  const providers = providerResults?.provider_summary ?? []

  const results = useQueries({
    queries: providers.map((provider) => ({
      queryKey: ["point-lookup", provider.latitude, provider.longitude],
      queryFn: () => pointLookup({ lat: provider.latitude, lng: provider.longitude }),
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 30,
      enabled: true,
    })),
  })

  const lookupMap = new Map<string, Map<string, string>>()
  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i]
    const data: PointLookupResponse | undefined = results[i].data
    if (!data) continue

    const districtMap = new Map<string, string>()
    for (const district of data.districts) {
      if (district.boundary_type in BOUNDARY_TYPE_TO_REGISTERED_KEY) {
        // Strip leading zeros for display consistency
        const identifier = district.boundary_identifier.replace(/^0+/, "") || district.boundary_identifier
        districtMap.set(district.boundary_type, identifier)
      }
    }
    lookupMap.set(provider.source_type, districtMap)
  }

  return lookupMap
}
