import { useQuery } from "@tanstack/react-query"
import { getBoundaryDetail } from "@/lib/api/boundaries"
import type { BoundaryDetailResponse } from "@/types/boundary"

export function useBoundaryDetail(id: string | null): {
  data: BoundaryDetailResponse | undefined
  isLoading: boolean
  error: Error | null
} {
  return useQuery({
    queryKey: ["boundaries", id],
    queryFn: () => getBoundaryDetail(id!),
    enabled: id !== null,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
  })
}
