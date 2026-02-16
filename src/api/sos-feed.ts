import type {
  SosFeedRawResponse,
  SosFeedResponse,
  SosAutoFillResult,
} from "@/types/sos-feed"
import type { ElectionType } from "@/types/elections"

/** Check if a URL is a valid Georgia SOS results feed URL */
export function isSosUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "results.sos.ga.gov" &&
      parsed.pathname.endsWith(".json")
    )
  } catch {
    return false
  }
}

/**
 * Fetch and parse the SOS JSON feed from a URL.
 *
 * Uses raw `fetch` intentionally — this hits an external third-party URL
 * (results.sos.ga.gov), not the voter-api backend, so the shared `ky` client
 * with JWT headers and base URL is not appropriate.
 */
export async function fetchSosFeed(
  url: string,
  signal?: AbortSignal,
): Promise<SosFeedResponse> {
  if (!isSosUrl(url)) {
    throw new Error(
      "Invalid URL: must be an HTTPS URL on results.sos.ga.gov ending in .json",
    )
  }

  const response = await fetch(url, {
    // Follow redirects transparently — the SOS CDN may redirect URLs and
    // `redirect: "error"` would throw an opaque TypeError indistinguishable
    // from CORS/network errors.
    redirect: "follow",
    signal: signal ?? AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    throw new Error(
      `SOS feed request failed: ${response.status} ${response.statusText}`,
    )
  }

  let data: SosFeedRawResponse
  try {
    data = await response.json()
  } catch {
    throw new Error(
      "SOS feed returned invalid data (not valid JSON). Verify the URL points to a JSON feed.",
    )
  }

  if (
    typeof data.electionName !== "string" ||
    typeof data.electionDate !== "string" ||
    !data.results ||
    (data.results.ballotItems !== null && !Array.isArray(data.results.ballotItems))
  ) {
    throw new Error(
      "Invalid SOS feed: missing required fields (electionName, electionDate, results)",
    )
  }

  return data as SosFeedResponse
}

/** Detect election type from the election name string */
export function detectElectionType(electionName: string): ElectionType | null {
  const lower = electionName.toLowerCase()

  if (lower.includes("special") && lower.includes("runoff")) return "runoff"
  if (lower.includes("runoff")) return "runoff"
  if (lower.includes("special")) return "special"
  if (lower.includes("primary")) return "primary"
  if (lower.includes("general")) return "general"

  return null
}

/** Extract the district/scope from the SOS feed ballot items */
export function extractDistrict(feed: SosFeedResponse): string {
  const ballotItems = feed.results.ballotItems ?? []
  const names = ballotItems
    .map((item) => item.name?.trim())
    .filter((name): name is string => Boolean(name))

  if (names.length === 1) {
    return names[0]
  }

  return feed.electionName.trim()
}

/** Extract all auto-fill fields from a parsed SOS feed */
export function extractAutoFillData(
  feed: SosFeedResponse,
): SosAutoFillResult {
  return {
    name: feed.electionName.trim(),
    election_date: feed.electionDate.trim(),
    election_type: detectElectionType(feed.electionName),
    district: extractDistrict(feed),
  }
}
