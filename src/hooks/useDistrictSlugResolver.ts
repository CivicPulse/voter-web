import { useQuery } from "@tanstack/react-query"
import { api } from "@/api/client"
import { fetchStaticGeoJSON } from "@/lib/static-geojson"
import { slugify } from "@/lib/slugs"
import type { BoundaryFeatureCollection } from "@/types/boundary"

interface SlugResolution {
  districtId: string | undefined
  isLoading: boolean
  isNotFound: boolean
}

export function useDistrictSlugResolver(
  typeSlug: string,
  nameSlug: string,
): SlugResolution {
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

  if (!enabled) {
    return { districtId: undefined, isLoading: false, isNotFound: false }
  }

  if (isLoading || !boundaries) {
    return { districtId: undefined, isLoading: true, isNotFound: false }
  }

  const match = boundaries.features.find(
    (feature) => slugify(feature.properties.name) === nameSlug,
  )

  if (!match?.id) {
    return { districtId: undefined, isLoading: false, isNotFound: true }
  }

  return { districtId: String(match.id), isLoading: false, isNotFound: false }
}
