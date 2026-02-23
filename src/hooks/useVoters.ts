import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  searchVoters,
  getVoterDetail,
  getVoterFilters,
  triggerVoterGeocode,
  deleteGeocodedLocation,
  getVoterHistory,
} from "@/api/voters"
import type { VoterSearchParams } from "@/types/voter"

export function useVoterSearch(params: VoterSearchParams) {
  return useQuery({
    queryKey: ["voters", "search", params],
    queryFn: () => searchVoters(params),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    retry: 1,
  })
}

export function useVoterDetail(voterId: string | null) {
  return useQuery({
    queryKey: ["voters", voterId],
    queryFn: () => getVoterDetail(voterId!),
    enabled: !!voterId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  })
}

export function useVoterFilters() {
  return useQuery({
    queryKey: ["voters", "filters"],
    queryFn: getVoterFilters,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  })
}

export function useTriggerVoterGeocode(voterId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => triggerVoterGeocode(voterId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["voters", voterId, "geocoded-locations"],
      })
    },
  })
}

export function useDeleteGeocodedLocation(voterId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (locationId: string) =>
      deleteGeocodedLocation(voterId, locationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["voters", voterId, "geocoded-locations"],
      })
    },
  })
}

export function useVoterHistory(voterRegistrationNumber: string | null) {
  return useQuery({
    queryKey: ["voters", voterRegistrationNumber, "history"],
    queryFn: () => getVoterHistory(voterRegistrationNumber!),
    enabled: !!voterRegistrationNumber,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  })
}
