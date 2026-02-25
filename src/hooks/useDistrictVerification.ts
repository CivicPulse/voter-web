import { useMemo } from "react"
import type { RegisteredDistricts } from "@/types/voter"
import type { VoterGeocodedLocation } from "@/types/lookup"
import { usePointLookup } from "@/hooks/useAddressLookup"
import { compareDistricts } from "@/lib/district-comparison"
import type { DistrictVerificationResult } from "@/lib/district-comparison"

interface UseDistrictVerificationParams {
  districts: RegisteredDistricts
  locations: VoterGeocodedLocation[] | undefined
}

export function useDistrictVerification({
  districts,
  locations,
}: UseDistrictVerificationParams) {
  const primaryLocation = useMemo(
    () => locations?.find((loc) => loc.is_primary) ?? null,
    [locations],
  )

  const lookupParams = useMemo(
    () =>
      primaryLocation
        ? {
            lat: primaryLocation.latitude,
            lng: primaryLocation.longitude,
            accuracy: undefined,
          }
        : null,
    [primaryLocation],
  )

  const { data: pointLookupData, isLoading: pointLookupLoading } =
    usePointLookup(lookupParams)

  const verification: DistrictVerificationResult | null = useMemo(() => {
    if (!pointLookupData || !primaryLocation) return null
    return compareDistricts(
      districts,
      pointLookupData,
      primaryLocation.confidence_score,
    )
  }, [districts, pointLookupData, primaryLocation])

  return {
    verification,
    isLoading: primaryLocation !== null && pointLookupLoading,
    primaryLocation,
  }
}
