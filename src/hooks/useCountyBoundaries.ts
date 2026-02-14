import { useQuery } from "@tanstack/react-query"
import { api } from "@/api/client"
import { fetchStaticGeoJSON } from "@/lib/static-geojson"
import type { CountyFeatureCollection } from "@/types/boundaries"

export function useCountyBoundaries() {
  return useQuery<CountyFeatureCollection>({
    queryKey: ["boundaries", "county", "geojson"],
    queryFn: async () => {
      const cached = await fetchStaticGeoJSON<CountyFeatureCollection>("county")
      if (cached) return cached
      return api
        .get("boundaries/geojson", {
          searchParams: { boundary_type: "county" },
        })
        .json<CountyFeatureCollection>()
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
  })
}
