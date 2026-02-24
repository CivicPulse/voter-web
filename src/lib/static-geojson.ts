/**
 * Loads pre-cached GeoJSON from static assets (public/geojson/).
 * Returns null if the file doesn't exist, letting callers fall back to the API.
 */
export async function fetchStaticGeoJSON<T>(
  boundaryType: string,
): Promise<T | null> {
  // In development, skip static cache to always get fresh data from the API.
  // Static GeoJSON may contain stale UUIDs from a different database.
  if (import.meta.env.DEV) return null

  try {
    const res = await fetch(
      `${import.meta.env.BASE_URL}geojson/${boundaryType}.json`,
    )
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}
