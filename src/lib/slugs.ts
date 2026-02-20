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

/** @deprecated Use the 4-arg overload with stateAbbrev and county. */
export function districtSlugPath(name: string, boundaryType: string): string
/**
 * Build a slug-based district URL path with state/county context.
 *
 * County-scoped districts: `/districts/{state}/{countySlug}/{typeSlug}/{nameSlug}`
 * State-scoped districts:  `/districts/{state}/{typeSlug}/{nameSlug}`
 */
export function districtSlugPath(
  name: string,
  boundaryType: string,
  stateAbbrev: string,
  county: string | null,
): string
export function districtSlugPath(
  name: string,
  boundaryType: string,
  stateAbbrev?: string,
  county?: string | null,
): string {
  const typeSlug = slugify(boundaryType)
  const nameSlug = slugify(name)
  if (!stateAbbrev) {
    return `/districts/${typeSlug}/${nameSlug}`
  }
  if (county) {
    return `/districts/${stateAbbrev}/${slugify(county)}/${typeSlug}/${nameSlug}`
  }
  return `/districts/${stateAbbrev}/${typeSlug}/${nameSlug}`
}
