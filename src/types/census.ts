/**
 * Raw Census API response shape.
 * First row is headers, subsequent rows are data values.
 */
export type CensusApiRawResponse = string[][]

/**
 * Parsed Census ACS 5-Year Data Profile for a county.
 * Percentage fields are in 0-100 scale (as returned by Census API "PE" suffix variables).
 * Monetary values are in USD. Time values are in minutes.
 */
export interface CensusProfile {
  totalPopulation: number | null
  medianAge: number | null
  percentUnder18: number | null
  percentOver65: number | null
  medianHouseholdIncome: number | null
  povertyRate: number | null
  percentBachelorsOrHigher: number | null
  percentWhite: number | null
  percentBlack: number | null
  percentAsian: number | null
  percentHispanicLatino: number | null
  percentUninsured: number | null
  medianHomeValue: number | null
  homeownershipRate: number | null
  meanCommuteTimeMinutes: number | null
  percentBroadband: number | null
}
