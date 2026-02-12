import type { CensusApiRawResponse, CensusProfile } from "@/types/census"

const CENSUS_BASE_URL = "https://api.census.gov/data/2023/acs/acs5/profile"

/**
 * ACS Data Profile variable codes mapped to CensusProfile field names.
 * This mapping drives both the API request URL and response parsing.
 */
const CENSUS_VARIABLES = {
  DP05_0001E: "totalPopulation",
  DP05_0018E: "medianAge",
  DP05_0005PE: "percentUnder18",
  DP05_0024PE: "percentOver65",
  DP03_0062E: "medianHouseholdIncome",
  DP03_0119PE: "povertyRate",
  DP02_0068PE: "percentBachelorsOrHigher",
  DP05_0037PE: "percentWhite",
  DP05_0038PE: "percentBlack",
  DP05_0044PE: "percentAsian",
  DP05_0071PE: "percentHispanicLatino",
  DP03_0099PE: "percentUninsured",
  DP04_0089E: "medianHomeValue",
  DP04_0046PE: "homeownershipRate",
  DP03_0025E: "meanCommuteTimeMinutes",
  DP02_0154PE: "percentBroadband",
  DP03_0009PE: "unemploymentRate",
  DP03_0024PE: "percentWorkFromHome",
  DP03_0088E: "perCapitaIncome",
  DP03_0074PE: "percentSnap",
  DP02_0066PE: "percentGraduateDegree",
  DP02_0094PE: "percentForeignBorn",
  DP02_0114PE: "percentNonEnglish",
  DP02_0070PE: "percentVeterans",
  DP02_0072PE: "percentDisability",
  DP04_0134E: "medianGrossRent",
  DP04_0003PE: "vacancyRate",
  DP04_0058PE: "percentNoVehicle",
} as const satisfies Record<string, keyof CensusProfile>

/**
 * Parse a raw Census API value string to a number or null.
 * The Census API uses sentinel values (e.g. -666666666) for missing/suppressed data.
 */
function parseCensusValue(raw: string): number | null {
  if (!raw || raw.trim() === "") return null
  const num = Number(raw)
  if (Number.isNaN(num)) return null
  if (num <= -666666666) return null
  return num
}

/**
 * Fetch Census ACS 5-Year Data Profile for a county.
 */
export async function fetchCensusProfile(
  fipsState: string,
  fipsCounty: string,
): Promise<CensusProfile> {
  const variableCodes = Object.keys(CENSUS_VARIABLES).join(",")
  const url = `${CENSUS_BASE_URL}?get=${variableCodes}&for=county:${fipsCounty}&in=state:${fipsState}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(
      `Census API request failed: ${response.status} ${response.statusText}`,
    )
  }

  const data: CensusApiRawResponse = await response.json()

  if (data.length < 2) {
    throw new Error("Census API returned no data rows")
  }

  const headers = data[0]
  const values = data[1]

  const profile: Record<string, number | null> = {}
  for (const [code, fieldName] of Object.entries(CENSUS_VARIABLES)) {
    const index = headers.indexOf(code)
    profile[fieldName] = index >= 0 ? parseCensusValue(values[index]) : null
  }

  return profile as unknown as CensusProfile
}
