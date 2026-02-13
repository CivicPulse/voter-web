import { useQuery } from "@tanstack/react-query"
import { fetchAddressLookup } from "@/api/lookup"
import type { LookupResponse, LookupSearchParams } from "@/types/lookup"

export function useAddressLookup(params: LookupSearchParams) {
  const hasAddress = !!params.address
  const hasCoords = params.lat !== undefined && params.lng !== undefined

  return useQuery<LookupResponse>({
    queryKey: ["geocoding", "lookup", params.address, params.lat, params.lng],
    queryFn: () => fetchAddressLookup(params),
    enabled: hasAddress || hasCoords,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  })
}
