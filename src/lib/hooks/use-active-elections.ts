import { useQuery } from "@tanstack/react-query"
import { getElections } from "@/lib/api/elections"
import type { Election } from "@/types/elections"
import { categorizeRace } from "@/types/elections"

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
export function normalize(name: string): string {
  return name.toLowerCase().replace(/\s+-\s+/g, " ").trim()
}

/** Escape special regex characters in a string */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Test whether `haystack` contains `needle` as a whole-word substring.
 * Uses \b word boundaries to prevent "District 1" matching "District 11".
 */
function containsWholeWord(haystack: string, needle: string): boolean {
  return new RegExp(`\\b${escapeRegExp(needle)}\\b`).test(haystack)
}

/**
 * Case-insensitive check whether an election's district field matches
 * a boundary name. Normalizes dash separators so
 * "State Senate - District 18" matches "State Senate District 18".
 * Uses word boundaries to prevent partial matches like
 * "District 1" matching "District 11".
 */
export function electionsForDistrict(
  elections: Election[],
  boundaryName: string,
): Election[] {
  const normalized = normalize(boundaryName)
  return elections.filter((e) => {
    const district = normalize(e.district)
    return (
      district === normalized ||
      containsWholeWord(district, normalized) ||
      containsWholeWord(normalized, district)
    )
  })
}

/** Map race category → boundary type for overlay indicators */
const CATEGORY_TO_BOUNDARY_TYPE: Record<string, string> = {
  federal: "congressional",
  state_senate: "state_senate",
  state_house: "state_house",
}

/**
 * Derive the set of boundary types that have at least one active election.
 * Used to show indicator badges on the LayerBar overlay buttons.
 */
export function electionBoundaryTypes(elections: Election[]): Set<string> {
  const types = new Set<string>()
  for (const e of elections) {
    const category = categorizeRace(e.district)
    const boundaryType = CATEGORY_TO_BOUNDARY_TYPE[category]
    if (boundaryType) types.add(boundaryType)
  }
  return types
}
