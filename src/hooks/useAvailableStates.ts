import { useMemo } from "react"
import { useCountyBoundaries } from "@/hooks/useCountyBoundaries"
import { FIPS_TO_ABBREV } from "@/lib/states"

export interface StateInfo {
  abbreviation: string
  fipsCode: string
  countyCount: number
}

interface UseAvailableStatesResult {
  states: StateInfo[]
  isLoading: boolean
  isSingleState: boolean
  defaultState: StateInfo | undefined
}

export function useAvailableStates(): UseAvailableStatesResult {
  const { data: boundaries, isLoading } = useCountyBoundaries()

  const states = useMemo(() => {
    if (!boundaries) return []

    const countsByFips = new Map<string, number>()
    for (const feature of boundaries.features) {
      const stateFips = feature.properties.boundary_identifier.slice(0, 2)
      countsByFips.set(stateFips, (countsByFips.get(stateFips) ?? 0) + 1)
    }

    const result: StateInfo[] = []
    for (const [fipsCode, countyCount] of countsByFips) {
      const abbreviation = FIPS_TO_ABBREV[fipsCode]
      if (abbreviation) {
        result.push({ abbreviation, fipsCode, countyCount })
      }
    }

    return result.sort((a, b) => a.abbreviation.localeCompare(b.abbreviation))
  }, [boundaries])

  return {
    states,
    isLoading,
    isSingleState: states.length === 1,
    defaultState: states.length === 1 ? states[0] : undefined,
  }
}
