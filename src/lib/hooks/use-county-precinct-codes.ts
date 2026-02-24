import { useQuery } from "@tanstack/react-query"
import { publicApi } from "@/api/client"
import { stripCountySuffix } from "@/lib/utils"
import type { BoundaryFeatureCollection } from "@/types/boundary"

/**
 * Fetch county_precinct boundary GeoJSON for a single county and extract
 * the set of precinct_id codes. Used to filter participation stats'
 * by_precinct data to a specific county.
 */
export function useCountyPrecinctCodes(county: string | null) {
  const bareCounty = county ? stripCountySuffix(county) : ""

  return useQuery({
    queryKey: ["boundaries", "county_precinct", "codes", bareCounty],
    queryFn: async () => {
      const data = await publicApi
        .get("boundaries/geojson", {
          searchParams: {
            boundary_type: "county_precinct",
            county: bareCounty,
          },
        })
        .json<BoundaryFeatureCollection>()

      const codes = new Set<string>()
      for (const feature of data.features) {
        const id = feature.properties.precinct_id
        if (id) codes.add(id)
      }
      return codes
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
    enabled: !!county,
  })
}
