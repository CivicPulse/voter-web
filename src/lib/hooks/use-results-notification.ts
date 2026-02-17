import { useEffect, useRef } from "react"
import type { ElectionResultsResponse } from "@/types/elections"
import { playNotificationSound } from "@/lib/notification-sound"

/**
 * Build a fingerprint string from election results data.
 *
 * The fingerprint captures the values that matter for "new data" detection:
 * candidate vote counts, precinct reporting numbers, and county-level totals.
 * It intentionally ignores field ordering by sorting candidates/counties by
 * their IDs/names so that cosmetic reordering doesn't trigger a false positive.
 */
function buildResultsFingerprint(results: ElectionResultsResponse): string {
  const candidateParts = [...results.candidates]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((c) => `${c.id}:${c.vote_count}`)

  const countyParts = [...results.county_results]
    .sort((a, b) => a.county_name.localeCompare(b.county_name))
    .map((county) => {
      const cands = [...county.candidates]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((c) => `${c.id}:${c.vote_count}`)
        .join(",")
      return `${county.county_name}|${county.precincts_reporting}/${county.precincts_participating}|${cands}`
    })

  return [
    `p:${results.precincts_reporting}/${results.precincts_participating}`,
    ...candidateParts,
    ...countyParts,
  ].join(";")
}

/**
 * Plays a notification sound when election results data changes between
 * fetches. Skips the initial load so the sound only fires on updates.
 *
 * @param results - The current election results (undefined while loading)
 */
export function useResultsNotification(
  results: ElectionResultsResponse | undefined,
): void {
  const prevFingerprint = useRef<string | null>(null)

  useEffect(() => {
    if (!results) return

    const fingerprint = buildResultsFingerprint(results)

    if (prevFingerprint.current === null) {
      // First load — store fingerprint but don't play sound.
      prevFingerprint.current = fingerprint
      return
    }

    if (fingerprint !== prevFingerprint.current) {
      prevFingerprint.current = fingerprint
      playNotificationSound()
    }
  }, [results])
}
