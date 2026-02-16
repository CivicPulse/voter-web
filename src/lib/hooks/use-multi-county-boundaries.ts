import { useMemo } from "react"
import { useQueries } from "@tanstack/react-query"
import { api } from "@/api/client"
import type { Feature, MultiPolygon, Polygon } from "geojson"
import type {
  BoundaryFeatureCollection,
  BoundaryFeatureProperties,
} from "@/types/boundary"
import { stripCountySuffix } from "@/lib/utils"

/**
 * Fetch precinct boundary GeoJSON for multiple counties in parallel.
 * Uses the same cache timing as useBoundaryTypeGeoJSON but different
 * query keys (bare county name vs full name).
 */
export function useMultiCountyPrecinctBoundaries(countyNames: string[]) {
  const queries = useQueries({
    queries: countyNames.map((county) => {
      const bareCounty = stripCountySuffix(county)
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
  const isError = queries.some((q) => q.isError)
  const loadedCount = queries.filter((q) => q.isSuccess).length
  const totalCount = queries.length

  const allBoundaryFeatures = useMemo(
    () =>
      queries.flatMap(
        (q) =>
          (q.data?.features ?? []) as Feature<
            Polygon | MultiPolygon,
            BoundaryFeatureProperties
          >[],
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- derived from query data identity
    [queries.map((q) => q.dataUpdatedAt).join(",")],
  )

  return { isLoading, isError, allBoundaryFeatures, loadedCount, totalCount }
}
