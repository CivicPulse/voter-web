import { FIPS_TO_ABBREV } from "@/lib/states"

/**
 * Convert a name to a URL slug.
 * "Ben Hill" → "ben-hill", "DeKalb" → "dekalb"
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Build a slug-based county URL path.
 * @param countyName  e.g. "Bibb"
 * @param fipsCode    Full FIPS code "13021" or just state FIPS "13"
 * @returns e.g. "/counties/ga/bibb"
 */
export function countySlugPath(
  countyName: string,
  fipsCode: string,
): string {
  const stateFips = fipsCode.length > 2 ? fipsCode.slice(0, 2) : fipsCode
  const stateAbbrev = FIPS_TO_ABBREV[stateFips]
  if (!stateAbbrev) {
    console.error(`countySlugPath: Unknown state FIPS code: ${stateFips} (from FIPS "${fipsCode}")`)
    return ""
  }
  return `/counties/${stateAbbrev}/${slugify(countyName)}`
}
