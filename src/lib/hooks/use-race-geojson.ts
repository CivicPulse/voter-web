import { useQuery } from "@tanstack/react-query"
import {
  getElectionGeoJSON,
  getPrecinctGeoJSON,
} from "@/lib/api/elections"
import type {
  CountyResultFeatureCollection,
  PrecinctResultFeatureCollection,
} from "@/types/elections"

/**
 * Hook to fetch county-level GeoJSON for the choropleth map.
 */
export function useCountyResultsGeoJSON(electionId: string) {
  return useQuery<CountyResultFeatureCollection>({
    queryKey: ["elections", "geojson", "county", electionId],
    queryFn: () => getElectionGeoJSON(electionId),
    enabled: !!electionId,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch precinct-level GeoJSON with optional county filter.
 */
export function usePrecinctResultsGeoJSON(
  electionId: string,
  county?: string,
) {
  return useQuery<PrecinctResultFeatureCollection>({
    queryKey: ["elections", "geojson", "precinct", electionId, county],
    queryFn: () => getPrecinctGeoJSON(electionId, county),
    enabled: !!electionId,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}
