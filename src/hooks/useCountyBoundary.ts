import { useQuery } from "@tanstack/react-query"
import { api } from "@/api/client"
import type { BoundaryDetailResponse } from "@/types/boundary"

export function useCountyBoundary(boundaryId: string) {
  return useQuery<BoundaryDetailResponse>({
    queryKey: ["boundaries", boundaryId],
    queryFn: () =>
      api.get(`boundaries/${boundaryId}`).json<BoundaryDetailResponse>(),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
    enabled: !!boundaryId,
  })
}
