import { useQuery } from "@tanstack/react-query"
import { getElections } from "@/lib/api/elections"
import type { Election } from "@/types/elections"

/**
 * Fetches all active elections (status = "active") for use as indicators
 * on district/county detail pages and map overlays.
 *
 * Returns the flat list plus a helper to find elections matching a district name.
 */
export function useActiveElections() {
  const query = useQuery({
    queryKey: ["elections", "active-indicators"],
    queryFn: async () => {
      const response = await getElections({
        status: "active",
        page_size: 100,
      })
      return response.elections
    },
    staleTime: 60 * 1000,
  })

  return query
}

/**
 * Normalize a district/boundary name for comparison by lowercasing,
 * collapsing ` - ` separators to a single space, and trimming.
 * This handles the API convention where election districts use
 * "State Senate - District 18" while boundaries use "State Senate District 18".
 */
function normalize(name: string): string {
  return name.toLowerCase().replace(/\s+-\s+/g, " ").trim()
}

/**
 * Case-insensitive check whether an election's district field matches
 * a boundary name. Normalizes dash separators so
 * "State Senate - District 18" matches "State Senate District 18".
 */
export function electionsForDistrict(
  elections: Election[],
  boundaryName: string,
): Election[] {
  const normalized = normalize(boundaryName)
  return elections.filter((e) => {
    const district = normalize(e.district)
    return district === normalized || district.includes(normalized) || normalized.includes(district)
  })
}
