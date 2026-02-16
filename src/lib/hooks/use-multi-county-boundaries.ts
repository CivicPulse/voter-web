import { useMemo } from "react"
import { useQueries } from "@tanstack/react-query"
import { api } from "@/api/client"
import type { Feature, MultiPolygon, Polygon } from "geojson"
import type {
  BoundaryFeatureCollection,
  BoundaryFeatureProperties,
} from "@/types/boundary"

/**
 * Fetch precinct boundary GeoJSON for multiple counties in parallel.
 * Reuses the same query key pattern and cache timing as useBoundaryTypeGeoJSON
 * so county pages and election pages share cached data.
 */
export function useMultiCountyPrecinctBoundaries(countyNames: string[]) {
  const queries = useQueries({
    queries: countyNames.map((county) => {
      // API expects bare county name (e.g. "Crawford") without " County" suffix
      const bareCounty = county.replace(/ County$/i, "")
      return {
        queryKey: ["boundaries", "county_precinct", "geojson", bareCounty],
        queryFn: () =>
          api
            .get("boundaries/geojson", {
              searchParams: {
                boundary_type: "county_precinct",
                county: bareCounty,
              },
            })
            .json<BoundaryFeatureCollection>(),
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60 * 2,
        enabled: countyNames.length > 0,
      }
    }),
  })

  const isLoading = queries.some((q) => q.isLoading)

  const allBoundaryFeatures = useMemo(
    () =>
      queries.flatMap(
        (q) =>
          (q.data?.features ?? []) as Feature<
            Polygon | MultiPolygon,
            BoundaryFeatureProperties
          >[],
      ),
    [queries],
  )

  return { isLoading, allBoundaryFeatures }
}
