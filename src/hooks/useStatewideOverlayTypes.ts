import { useBoundaryTypes } from "@/hooks/useBoundaryTypes"

/** Boundary types that represent statewide districts. */
const STATEWIDE_TYPES = new Set([
  "congressional",
  "psc",
  "state_house",
  "state_senate",
])

export function useStatewideOverlayTypes() {
  const query = useBoundaryTypes()
  return {
    ...query,
    data: query.data?.filter((t) => STATEWIDE_TYPES.has(t)),
  }
}
