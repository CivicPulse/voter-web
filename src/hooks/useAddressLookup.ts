import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  verifyAddress,
  geocodeAddress,
  pointLookup,
  startBatchGeocode,
  getBatchGeocodeStatus,
  getCacheStats,
  getVoterGeocodedLocations,
  addManualLocation,
  setPrimaryLocation,
} from "@/api/lookup"
import type {
  BatchGeocodeRequest,
  ManualLocationRequest,
  PointLookupParams,
} from "@/types/lookup"

// --- Address verification & geocoding ---

export function useVerifyAddress(address: string | null) {
  return useQuery({
    queryKey: ["geocoding", "verify", address],
    queryFn: () => verifyAddress(address!),
    enabled: !!address,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  })
}

export function useGeocodeAddress(address: string | null) {
  return useQuery({
    queryKey: ["geocoding", "geocode", address],
    queryFn: () => geocodeAddress(address!),
    enabled: !!address,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  })
}

export function usePointLookup(params: PointLookupParams | null) {
  return useQuery({
    queryKey: ["geocoding", "point-lookup", params?.lat, params?.lng, params?.accuracy],
    queryFn: () => pointLookup(params!),
    enabled: params !== null,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  })
}

// --- Batch geocoding ---

export function useBatchGeocode() {
  return useMutation({
    mutationFn: (request: BatchGeocodeRequest) => startBatchGeocode(request),
  })
}

export function useBatchGeocodeStatus(jobId: string | null) {
  return useQuery({
    queryKey: ["geocoding", "status", jobId],
    queryFn: () => getBatchGeocodeStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === "completed" || status === "failed") return false
      return 3000
    },
    staleTime: 0,
    retry: 2,
  })
}

// --- Cache stats ---

export function useCacheStats() {
  return useQuery({
    queryKey: ["geocoding", "cache", "stats"],
    queryFn: getCacheStats,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })
}

// --- Voter geocoded locations ---

export function useVoterGeocodedLocations(voterId: string | null) {
  return useQuery({
    queryKey: ["voters", voterId, "geocoded-locations"],
    queryFn: () => getVoterGeocodedLocations(voterId!),
    enabled: !!voterId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })
}

export function useAddManualLocation(voterId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: ManualLocationRequest) =>
      addManualLocation(voterId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["voters", voterId, "geocoded-locations"],
      })
    },
  })
}

export function useSetPrimaryLocation(voterId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (locationId: string) =>
      setPrimaryLocation(voterId, locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["voters", voterId, "geocoded-locations"],
      })
    },
  })
}
