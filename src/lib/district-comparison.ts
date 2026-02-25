import type { RegisteredDistricts } from "@/types/voter"
import type { PointLookupResponse, LookupDistrict } from "@/types/lookup"
import { extractDistrictNumber } from "@/hooks/useDistrictBoundary"

// --- Types ---

export type DistrictMatchStatus =
  | "match"
  | "mismatch"
  | "no_geographic_data"
  | "no_registered_data"

export interface DistrictComparisonResult {
  registeredKey: keyof RegisteredDistricts
  label: string
  registeredValue: string | null
  geographicValue: string | null
  status: DistrictMatchStatus
}

export interface DistrictVerificationResult {
  comparisons: DistrictComparisonResult[]
  mismatchCount: number
  matchCount: number
  lowConfidence: boolean
}

// --- Constants ---

const LOW_CONFIDENCE_THRESHOLD = 0.7

/**
 * Maps point-lookup boundary_type values to RegisteredDistricts keys.
 * boundary_types that have no corresponding voter registration field are omitted.
 */
export const BOUNDARY_TYPE_TO_REGISTERED_KEY: Record<string, keyof RegisteredDistricts> = {
  congressional: "congressional_district",
  congressional_district: "congressional_district",
  state_senate: "state_senate_district",
  state_house: "state_house_district",
  county_commission: "county_commission_district",
  commission_district: "county_commission_district",
  school_board: "school_board_district",
  school_district: "school_board_district",
  county_precinct: "county_precinct",
  precinct: "county_precinct",
}

export const REGISTERED_KEY_LABELS: Record<keyof RegisteredDistricts, string> = {
  congressional_district: "Congressional",
  state_senate_district: "State Senate",
  state_house_district: "State House",
  judicial_district: "Judicial",
  county_commission_district: "County Commission",
  school_board_district: "School Board",
  city_council_district: "City Council",
  municipal_school_board_district: "Municipal School Board",
  county_precinct: "County Precinct",
  county_precinct_description: "County Precinct Description",
  municipal_precinct: "Municipal Precinct",
  municipal_precinct_description: "Municipal Precinct Description",
}

/** Skipped boundary_types with no voter registration field */
const SKIPPED_BOUNDARY_TYPES = new Set(["county", "psc"])

// --- Helpers ---

/** Strip leading zeros and lowercase for comparison */
function normalizeDistrictValue(value: string): string {
  return value.replace(/^0+/, "").toLowerCase() || "0"
}

/**
 * Extract a comparable value from a point-lookup district.
 * Uses extractDistrictNumber to pull trailing number from names like "Congressional District 2",
 * then normalizes by stripping leading zeros.
 */
function extractGeographicValue(district: LookupDistrict): string | null {
  const num = extractDistrictNumber(district.name)
  if (num !== null) return num
  // If no trailing number, use the raw name (e.g., a precinct code like "MACO")
  return district.name || null
}

// --- Core comparison ---

/**
 * Compare a voter's registered districts against geographic point-lookup results.
 */
export function compareDistricts(
  registered: RegisteredDistricts,
  pointLookupResponse: PointLookupResponse,
  confidenceScore: number | null,
): DistrictVerificationResult {
  const lowConfidence = confidenceScore !== null && confidenceScore < LOW_CONFIDENCE_THRESHOLD

  // Build a map: registeredKey → geographic value(s) from point lookup
  const geoMap = new Map<keyof RegisteredDistricts, string>()
  for (const district of pointLookupResponse.districts) {
    if (SKIPPED_BOUNDARY_TYPES.has(district.boundary_type)) continue
    const regKey = BOUNDARY_TYPE_TO_REGISTERED_KEY[district.boundary_type]
    if (!regKey) continue
    const geoValue = extractGeographicValue(district)
    if (geoValue !== null) {
      geoMap.set(regKey, geoValue)
    }
  }

  // Compare each registered district that has a value
  const comparisons: DistrictComparisonResult[] = []
  const verifiableKeys = new Set(Object.values(BOUNDARY_TYPE_TO_REGISTERED_KEY))

  for (const key of verifiableKeys) {
    const registeredValue = registered[key]
    const geographicValue = geoMap.get(key) ?? null
    const label = REGISTERED_KEY_LABELS[key] ?? key

    if (registeredValue == null) {
      // No registered value — skip unless we have geographic data
      if (geographicValue !== null) {
        comparisons.push({
          registeredKey: key,
          label,
          registeredValue: null,
          geographicValue,
          status: "no_registered_data",
        })
      }
      continue
    }

    if (geographicValue === null) {
      comparisons.push({
        registeredKey: key,
        label,
        registeredValue,
        geographicValue: null,
        status: "no_geographic_data",
      })
      continue
    }

    const normalizedRegistered = normalizeDistrictValue(registeredValue)
    const normalizedGeographic = normalizeDistrictValue(geographicValue)

    const isMatch = normalizedRegistered === normalizedGeographic
    comparisons.push({
      registeredKey: key,
      label,
      registeredValue,
      geographicValue,
      status: isMatch ? "match" : "mismatch",
    })
  }

  const mismatchCount = comparisons.filter((c) => c.status === "mismatch").length
  const matchCount = comparisons.filter((c) => c.status === "match").length

  return { comparisons, mismatchCount, matchCount, lowConfidence }
}
