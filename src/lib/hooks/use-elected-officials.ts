import { useQuery } from "@tanstack/react-query"
import {
  getElectedOfficialsByDistrict,
  getElectedOfficialsByBoundaryType,
} from "@/lib/api/elected-officials"
import type { ElectedOfficialSummaryResponse } from "@/types/elected-officials"

/**
 * Fetch full elected-official detail for a single district.
 * Used by the district detail drawer.
 */
export function useElectedOfficialsByDistrict(
  boundaryType: string | null | undefined,
  districtIdentifier: string | null | undefined,
) {
  return useQuery({
    queryKey: ["elected-officials", "by-district", boundaryType, districtIdentifier],
    queryFn: () =>
      getElectedOfficialsByDistrict(boundaryType!, districtIdentifier!),
    staleTime: 10 * 60 * 1000,
    enabled: !!boundaryType && !!districtIdentifier,
  })
}

/**
 * Fetch all officials for a boundary type and return a lookup map
 * keyed by district_identifier.
 * Used by the map overlay popup.
 */
export function useElectedOfficialsByBoundaryType(
  boundaryType: string | null | undefined,
) {
  return useQuery({
    queryKey: ["elected-officials", "by-boundary-type", boundaryType],
    queryFn: async () => {
      const response = await getElectedOfficialsByBoundaryType(boundaryType!)
      const map = new Map<string, ElectedOfficialSummaryResponse[]>()
      for (const official of response.items) {
        const existing = map.get(official.district_identifier) ?? []
        existing.push(official)
        map.set(official.district_identifier, existing)
      }
      return map
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!boundaryType,
  })
}
