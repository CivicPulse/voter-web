import type { SosFeedResponse } from "@/types/sos-feed"
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

/** Fetch and parse the SOS JSON feed from a URL */
export async function fetchSosFeed(
  url: string,
  signal?: AbortSignal,
): Promise<SosFeedResponse> {
  const response = await fetch(url, {
    redirect: "error",
    signal: signal ?? AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    throw new Error(
      `SOS feed request failed: ${response.status} ${response.statusText}`,
    )
  }

  const data: SosFeedResponse = await response.json()

  if (!data.electionName || !data.electionDate || !data.results) {
    throw new Error(
      "Invalid SOS feed: missing required fields (electionName, electionDate, results)",
    )
  }

  return data
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
  const ballotItems = feed.results?.ballotItems ?? []
  const names = ballotItems
    .map((item) => item.name?.trim())
    .filter((name): name is string => Boolean(name))

  if (names.length === 1) {
    return names[0]
  }

  return feed.electionName?.trim() ?? ""
}

/** Shape of the auto-fill result */
export interface SosAutoFillResult {
  name: string
  election_date: string
  election_type: ElectionType | null
  district: string
}

/** Extract all auto-fill fields from a parsed SOS feed */
export function extractAutoFillData(
  feed: SosFeedResponse,
): SosAutoFillResult {
  return {
    name: feed.electionName?.trim() ?? "",
    election_date: feed.electionDate?.trim() ?? "",
    election_type: feed.electionName
      ? detectElectionType(feed.electionName)
      : null,
    district: extractDistrict(feed),
  }
}
