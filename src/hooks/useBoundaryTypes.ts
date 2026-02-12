import { useQuery } from "@tanstack/react-query"
import { api } from "@/api/client"
import type { BoundaryTypesResponse } from "@/types/boundary"

export function useBoundaryTypes() {
  return useQuery<string[]>({
    queryKey: ["boundaries", "types"],
    queryFn: async () => {
      const data = await api
        .get("boundaries/types")
        .json<BoundaryTypesResponse>()
      return data.types.filter((t) => t !== "county").sort()
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
  })
}
