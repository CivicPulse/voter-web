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
 * Case-insensitive check whether an election's district field matches
 * a boundary name. Handles common naming variations:
 * - Exact match (case-insensitive)
 * - Election district contains the boundary name
 * - Boundary name contains the election district
 */
export function electionsForDistrict(
  elections: Election[],
  boundaryName: string,
): Election[] {
  const normalized = boundaryName.toLowerCase().trim()
  return elections.filter((e) => {
    const district = e.district.toLowerCase().trim()
    return district === normalized || district.includes(normalized) || normalized.includes(district)
  })
}
