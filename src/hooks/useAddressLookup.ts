import { useQuery } from "@tanstack/react-query"
import { verifyAddress, geocodeAddress, pointLookup } from "@/api/lookup"
import type {
  GeocodeResponse,
  PointLookupParams,
  PointLookupResponse,
  VerifyResponse,
} from "@/types/lookup"

export function useVerifyAddress(address: string | null) {
  return useQuery<VerifyResponse>({
    queryKey: ["geocoding", "verify", address],
    queryFn: () => verifyAddress(address!),
    enabled: !!address,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  })
}

export function useGeocodeAddress(address: string | null) {
  return useQuery<GeocodeResponse>({
    queryKey: ["geocoding", "geocode", address],
    queryFn: () => geocodeAddress(address!),
    enabled: !!address,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  })
}

export function usePointLookup(params: PointLookupParams | null) {
  return useQuery<PointLookupResponse>({
    queryKey: ["geocoding", "point-lookup", params?.lat, params?.lng, params?.accuracy],
    queryFn: () => pointLookup(params!),
    enabled: params !== null,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  })
}
