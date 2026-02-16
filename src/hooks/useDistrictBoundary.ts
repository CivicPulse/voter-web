import { useMemo } from "react"
import { useBoundaryTypeGeoJSON } from "@/hooks/useBoundaryTypeGeoJSON"
import { categorizeRace } from "@/types/elections"

/** Map race category → boundary type for fetching district geometry */
const CATEGORY_TO_BOUNDARY_TYPE: Record<string, string> = {
  federal: "congressional",
  state_senate: "state_senate",
  state_house: "state_house",
}

/**
 * Extract the district number from a district name string.
 * e.g. "State Senate District 18" → "018", "US Congressional District 5" → "005"
 * Boundary feature names are zero-padded 3-digit numbers (e.g. "018").
 */
function extractDistrictNumber(districtName: string): string | null {
  const result = /(\d+)\s*$/.exec(districtName)
  if (!result) return null
  return result[1].padStart(3, "0")
}

/**
 * Fetch the boundary geometry for the election's district.
 * Returns null geometry for local races (no boundary type mapping).
 */
export function useDistrictBoundary(districtName: string) {
  const category = categorizeRace(districtName)
  const boundaryType = CATEGORY_TO_BOUNDARY_TYPE[category] ?? null

  const { data, isLoading } = useBoundaryTypeGeoJSON(boundaryType, null)

  const geometry = useMemo(() => {
    if (!data || !boundaryType) return null

    const districtNumber = extractDistrictNumber(districtName)
    if (!districtNumber) return null

    const match = data.features.find(
      (f) => f.properties?.name === districtNumber,
    )

    return (match?.geometry as unknown as Record<string, unknown>) ?? null
  }, [data, boundaryType, districtName])

  return { geometry, isLoading: boundaryType ? isLoading : false, boundaryType }
}
