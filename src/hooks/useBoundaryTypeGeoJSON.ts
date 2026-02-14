import { useQuery } from "@tanstack/react-query"
import { api } from "@/api/client"
import { fetchStaticGeoJSON } from "@/lib/static-geojson"
import type { BoundaryFeatureCollection } from "@/types/boundary"

export function useBoundaryTypeGeoJSON(
  boundaryType: string | null,
  countyName: string | null,
) {
  return useQuery<BoundaryFeatureCollection>({
    queryKey: ["boundaries", boundaryType, "geojson", countyName],
    queryFn: async () => {
      // Use static data only for statewide queries (no county filter)
      if (!countyName) {
        const cached =
          await fetchStaticGeoJSON<BoundaryFeatureCollection>(boundaryType!)
        if (cached) return cached
      }
      return api
        .get("boundaries/geojson", {
          searchParams: {
            boundary_type: boundaryType!,
            ...(countyName && { county: countyName }),
          },
        })
        .json<BoundaryFeatureCollection>()
    },
    enabled: !!boundaryType,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
  })
}
