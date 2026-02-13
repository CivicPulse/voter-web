import { useQuery } from "@tanstack/react-query"
import { api } from "@/api/client"
import type { BoundaryFeatureCollection } from "@/types/boundary"

export function useBoundaryTypeGeoJSON(
  boundaryType: string | null,
  countyName: string | null,
) {
  return useQuery<BoundaryFeatureCollection>({
    queryKey: ["boundaries", boundaryType, "geojson", countyName],
    queryFn: () =>
      api
        .get("boundaries/geojson", {
          searchParams: {
            boundary_type: boundaryType!,
            ...(countyName && { county: countyName }),
          },
        })
        .json<BoundaryFeatureCollection>(),
    enabled: !!boundaryType,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
  })
}
