import { useQuery } from "@tanstack/react-query"
import { checkProviderBoundaries } from "@/api/voters"
import type { BatchBoundaryCheckResponse } from "@/types/voter"

export function useProviderBoundaryCheck(
  voterId: string | null,
): {
  data: BatchBoundaryCheckResponse | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
} {
  return useQuery({
    queryKey: ["voters", voterId, "provider-boundary-check"],
    queryFn: () => checkProviderBoundaries(voterId!),
    enabled: !!voterId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  })
}
