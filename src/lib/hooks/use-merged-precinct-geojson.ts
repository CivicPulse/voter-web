import { useMemo } from "react"
import { usePrecinctResultsGeoJSON } from "@/lib/hooks/use-race-geojson"
import { useMultiCountyPrecinctBoundaries } from "@/lib/hooks/use-multi-county-boundaries"
import { mergePrecinctData } from "@/lib/merge-precinct-data"
import type { PrecinctResultFeatureCollection } from "@/types/elections"

/**
 * Fetches both election precinct results and boundary precinct data,
 * then merges them client-side for full map coverage.
 *
 * Progressive enhancement: shows election data immediately while
 * boundary data loads in the background.
 */
export function useMergedPrecinctGeoJSON(
  electionId: string,
  countyNames: string[],
  selectedCounty?: string,
): {
  data: PrecinctResultFeatureCollection | undefined
  isLoading: boolean
  isLoadingBoundaries: boolean
  dataUpdatedAt: number
} {
  const { data: electionGeoJSON, isLoading: isLoadingResults, dataUpdatedAt } =
    usePrecinctResultsGeoJSON(electionId, selectedCounty)

  const countiesToFetch = useMemo(
    () => (selectedCounty ? [selectedCounty] : countyNames),
    [selectedCounty, countyNames],
  )

  const { isLoading: isLoadingBoundaries, allBoundaryFeatures } =
    useMultiCountyPrecinctBoundaries(countiesToFetch)

  const merged = useMemo(() => {
    if (!electionGeoJSON) return undefined

    // Show election-only data while boundaries load
    if (allBoundaryFeatures.length === 0 && isLoadingBoundaries) {
      return electionGeoJSON
    }

    return mergePrecinctData(electionGeoJSON, allBoundaryFeatures)
  }, [electionGeoJSON, allBoundaryFeatures, isLoadingBoundaries])

  return {
    data: merged,
    isLoading: isLoadingResults,
    isLoadingBoundaries,
    dataUpdatedAt,
  }
}
