import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { getDistrictCheck } from "@/api/voters"
import type { DistrictCheckResponse, DistrictCheckComparison } from "@/types/voter"
import type {
  DistrictVerificationResult,
  DistrictComparisonResult,
  DistrictMatchStatus,
} from "@/lib/district-comparison"
import {
  BOUNDARY_TYPE_TO_REGISTERED_KEY,
  REGISTERED_KEY_LABELS,
} from "@/lib/district-comparison"

/**
 * Maps API comparison status to the existing client-side DistrictMatchStatus.
 */
function mapComparisonStatus(
  apiStatus: DistrictCheckComparison["status"],
): DistrictMatchStatus {
  switch (apiStatus) {
    case "match":
      return "match"
    case "mismatch":
      return "mismatch"
    case "registered-only":
      return "no_geographic_data"
    case "determined-only":
      return "no_registered_data"
    default:
      throw new Error(`Unknown comparison status: ${apiStatus}`)
  }
}

/**
 * Adapts a server-side DistrictCheckResponse into the existing
 * DistrictVerificationResult shape so the UI card needs no changes.
 */
export function adaptDistrictCheck(
  response: DistrictCheckResponse,
): DistrictVerificationResult {
  const comparisons: DistrictComparisonResult[] = response.comparisons
    .filter((c) => {
      if (!(c.boundary_type in BOUNDARY_TYPE_TO_REGISTERED_KEY)) {
        console.warn(
          `Unknown boundary_type "${c.boundary_type}" in district check — skipping`,
        )
        return false
      }
      return true
    })
    .map((c) => {
      const registeredKey = BOUNDARY_TYPE_TO_REGISTERED_KEY[c.boundary_type]
      const label = REGISTERED_KEY_LABELS[registeredKey] ?? c.boundary_type

      return {
        registeredKey,
        label,
        registeredValue: c.registered_value,
        geographicValue: c.determined_value,
        status: mapComparisonStatus(c.status),
      }
    })

  const mismatchCount = comparisons.filter((c) => c.status === "mismatch").length
  const matchCount = comparisons.filter((c) => c.status === "match").length

  return {
    comparisons,
    mismatchCount,
    matchCount,
    lowConfidence: false,
  }
}

export function useDistrictCheck(voterId: string | null) {
  const { data: districtCheck, isLoading, error } = useQuery({
    queryKey: ["voters", voterId, "district-check"],
    queryFn: () => getDistrictCheck(voterId!),
    enabled: !!voterId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  })

  const verification: DistrictVerificationResult | null = useMemo(
    () => (districtCheck ? adaptDistrictCheck(districtCheck) : null),
    [districtCheck],
  )

  return {
    districtCheck,
    verification,
    isLoading,
    error,
  }
}
