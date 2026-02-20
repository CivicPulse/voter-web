import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/api/client"
import { fetchStaticGeoJSON } from "@/lib/static-geojson"
import { FIPS_TO_ABBREV } from "@/lib/states"
import { districtSlugPath, slugify } from "@/lib/slugs"
import { useCountyBoundaries } from "@/hooks/useCountyBoundaries"
import { useAvailableStates } from "@/hooks/useAvailableStates"
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

  const { data: boundaries, isLoading: isBoundariesLoading } =
    useQuery<BoundaryFeatureCollection>({
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

  const { data: countyBoundaries, isLoading: isCountiesLoading } =
    useCountyBoundaries()
  const { defaultState, isLoading: isStatesLoading } = useAvailableStates()

  // Build county name → state abbreviation lookup from county boundaries
  const countyToState = useMemo(() => {
    const map = new Map<string, string>()
    if (!countyBoundaries) return map
    for (const feature of countyBoundaries.features) {
      const stateFips = feature.properties.boundary_identifier.slice(0, 2)
      const abbrev = FIPS_TO_ABBREV[stateFips]
      if (abbrev) {
        map.set(feature.properties.name.toLowerCase(), abbrev)
      }
    }
    return map
  }, [countyBoundaries])

  const isLoading = isBoundariesLoading || isCountiesLoading || isStatesLoading

  if (!enabled || isLoading || !boundaries) {
    return {
      matches: [],
      isLoading: isLoading && enabled,
      isSingleMatch: false,
    }
  }

  const matches: DisambiguationMatch[] = []

  for (const feature of boundaries.features) {
    if (slugify(feature.properties.name) !== nameSlug) continue
    if (!feature.id) continue

    let stateAbbrev: string | undefined

    if (feature.properties.county) {
      // County-scoped: look up state from county boundaries
      stateAbbrev = countyToState.get(
        feature.properties.county.toLowerCase(),
      )
    } else {
      // State-scoped: use the default state from available states
      stateAbbrev = defaultState?.abbreviation
    }

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
