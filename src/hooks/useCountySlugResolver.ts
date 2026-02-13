import { useQuery } from "@tanstack/react-query"
import { api } from "@/api/client"
import { abbrevToFips } from "@/lib/states"
import { slugify } from "@/lib/slugs"
import type { CountyFeatureCollection } from "@/types/boundaries"

interface SlugResolution {
  countyId: string | undefined
  isLoading: boolean
  isNotFound: boolean
}

export function useCountySlugResolver(
  stateAbbrev: string,
  countySlug: string,
): SlugResolution {
  const enabled = !!(stateAbbrev && countySlug)

  const { data: boundaries, isLoading } = useQuery<CountyFeatureCollection>({
    queryKey: ["boundaries", "county", "geojson"],
    queryFn: () =>
      api
        .get("boundaries/geojson", {
          searchParams: { boundary_type: "county" },
        })
        .json<CountyFeatureCollection>(),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
    enabled,
  })

  if (!enabled) {
    return { countyId: undefined, isLoading: false, isNotFound: false }
  }

  if (isLoading || !boundaries) {
    return { countyId: undefined, isLoading: true, isNotFound: false }
  }

  const stateFips = abbrevToFips(stateAbbrev)
  if (!stateFips) {
    return { countyId: undefined, isLoading: false, isNotFound: true }
  }

  const match = boundaries.features.find((feature) => {
    const props = feature.properties
    const featureStateFips = props.boundary_identifier.slice(0, 2)
    return (
      featureStateFips === stateFips &&
      slugify(props.name) === countySlug.toLowerCase()
    )
  })

  if (!match?.id) {
    return { countyId: undefined, isLoading: false, isNotFound: true }
  }

  return { countyId: String(match.id), isLoading: false, isNotFound: false }
}
