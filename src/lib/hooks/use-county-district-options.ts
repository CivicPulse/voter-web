import { useQuery } from "@tanstack/react-query"
import { publicApi } from "@/api/client"
import { stripCountySuffix } from "@/lib/utils"
import type { BoundaryFeatureCollection } from "@/types/boundary"

export interface DistrictOption {
  value: string
  label: string
}

type CountyDistrictType =
  | "county_precinct"
  | "county_commission"
  | "school_board"

/**
 * Fetch boundary GeoJSON for a county-level district type and extract
 * unique district identifiers as dropdown options.
 */
export function useCountyDistrictOptions(
  districtType: CountyDistrictType,
  county: string | null,
) {
  const bareCounty = county ? stripCountySuffix(county) : ""

  return useQuery({
    queryKey: ["boundaries", districtType, "options", bareCounty],
    queryFn: async (): Promise<DistrictOption[]> => {
      const data = await publicApi
        .get("boundaries/geojson", {
          searchParams: {
            boundary_type: districtType,
            county: bareCounty,
          },
        })
        .json<BoundaryFeatureCollection>()

      const seen = new Map<string, string>()

      for (const feature of data.features) {
        const props = feature.properties
        if (districtType === "county_precinct") {
          const id = props.precinct_id
          if (id && !seen.has(id)) {
            seen.set(id, props.precinct_name ?? id)
          }
        } else {
          const id = props.boundary_identifier
          if (id && !seen.has(id)) {
            seen.set(id, props.name ?? id)
          }
        }
      }

      return Array.from(seen.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label))
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
    enabled: !!county,
  })
}
