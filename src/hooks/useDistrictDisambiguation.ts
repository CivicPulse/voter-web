import { useQuery } from "@tanstack/react-query"
import { api } from "@/api/client"
import { fetchStaticGeoJSON } from "@/lib/static-geojson"
import { FIPS_TO_ABBREV } from "@/lib/states"
import { districtSlugPath, slugify } from "@/lib/slugs"
import type { BoundaryFeatureCollection } from "@/types/boundary"

export interface DisambiguationMatch {
  districtId: string
  name: string
  boundaryType: string
  county: string | null
  stateAbbrev: string
  fullyQualifiedUrl: string
}

interface UseDistrictDisambiguationResult {
  matches: DisambiguationMatch[]
  isLoading: boolean
  isSingleMatch: boolean
}

export function useDistrictDisambiguation(
  typeSlug: string,
  nameSlug: string,
): UseDistrictDisambiguationResult {
  const boundaryType = typeSlug.replaceAll("-", "_")
  const enabled = !!(typeSlug && nameSlug)

  const { data: boundaries, isLoading } = useQuery<BoundaryFeatureCollection>({
    queryKey: ["boundaries", boundaryType, "geojson"],
    queryFn: async () => {
      const cached =
        await fetchStaticGeoJSON<BoundaryFeatureCollection>(boundaryType)
      if (cached) return cached
      return api
        .get("boundaries/geojson", {
          searchParams: { boundary_type: boundaryType },
        })
        .json<BoundaryFeatureCollection>()
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
    enabled,
  })

  if (!enabled || isLoading || !boundaries) {
    return { matches: [], isLoading: isLoading && enabled, isSingleMatch: false }
  }

  const matches: DisambiguationMatch[] = []

  for (const feature of boundaries.features) {
    if (slugify(feature.properties.name) !== nameSlug) continue
    if (!feature.id) continue

    const stateFips = feature.properties.boundary_identifier.slice(0, 2)
    const stateAbbrev = FIPS_TO_ABBREV[stateFips]
    if (!stateAbbrev) continue

    matches.push({
      districtId: String(feature.id),
      name: feature.properties.name,
      boundaryType: feature.properties.boundary_type,
      county: feature.properties.county,
      stateAbbrev,
      fullyQualifiedUrl: districtSlugPath(
        feature.properties.name,
        feature.properties.boundary_type,
        stateAbbrev,
        feature.properties.county,
      ),
    })
  }

  return {
    matches,
    isLoading: false,
    isSingleMatch: matches.length === 1,
  }
}
