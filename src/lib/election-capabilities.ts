import type { CapabilitiesResponse, ElectionFeatureFlags } from "@/types/elections"

/** Default feature flags — all disabled */
export const EMPTY_FLAGS: ElectionFeatureFlags = {
  search: false,
  raceCategory: false,
  geographic: false,
  electionDate: false,
  filterOptions: false,
}

/**
 * Map an API capabilities response to typed feature flags.
 *
 * Translates snake_case API param names to camelCase feature flags.
 * Geographic is enabled by either `county` or `district` support.
 * Missing/undefined `endpoints` defaults `filterOptions` to false.
 */
export function mapCapabilitiesToFlags(
  response: CapabilitiesResponse,
): ElectionFeatureFlags {
  const params = new Set(response.supported_filters)
  return {
    search: params.has("q"),
    raceCategory: params.has("race_category"),
    geographic: params.has("county") || params.has("district"),
    electionDate: params.has("election_date"),
    filterOptions: response.endpoints?.filter_options ?? false,
  }
}
