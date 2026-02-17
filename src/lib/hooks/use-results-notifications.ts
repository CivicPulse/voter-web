import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import type { ElectionResultsResponse } from "@/types/elections"
import { getTotalVotes, getLeadingCandidate } from "@/types/elections"

/**
 * Build a fingerprint string from the results data that changes only when
 * the actual vote counts or reporting status change — not on every refetch.
 */
function buildResultsFingerprint(results: ElectionResultsResponse): string {
  const parts: string[] = [
    `p:${results.precincts_reporting ?? 0}/${results.precincts_participating ?? 0}`,
    ...results.candidates.map(
      (c) => `${c.id}:${c.vote_count}`,
    ),
  ]
  return parts.join("|")
}

function getNotificationPermission(): "default" | "granted" | "denied" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "default"
  }
  return Notification.permission as "default" | "granted" | "denied"
}

interface UseResultsNotificationsOptions {
  /** Election name for the notification title */
  electionName: string
  /** Whether the election is actively being updated */
  isActive: boolean
  /** Current results data (from polling) */
  results: ElectionResultsResponse | undefined
}

interface UseResultsNotificationsReturn {
  /** Whether notifications are currently enabled by the user */
  enabled: boolean
  /** Current browser permission state */
  permission: "default" | "granted" | "denied"
  /** Whether the Notifications API is supported */
  supported: boolean
  /** Toggle notifications on/off. Requests permission if needed. */
  toggle: () => void
}

/**
 * Hook that fires a browser notification when election results data actually
 * changes between polling intervals.
 *
 * Uses the Notifications API (not Push API) since the page is already open
 * and polling. Firefox is the primary target; Chrome/Edge/Safari also supported.
 */
export function useResultsNotifications({
  electionName,
  isActive,
  results,
}: UseResultsNotificationsOptions): UseResultsNotificationsReturn {
  const supported = typeof window !== "undefined" && "Notification" in window
  const [userEnabled, setUserEnabled] = useState(false)
  const [permission, setPermission] = useState(getNotificationPermission)
  const prevFingerprintRef = useRef<string | null>(null)
  const initialDataReceivedRef = useRef(false)

  // Effective enabled: user opted in AND election is still active
  const enabled = userEnabled && isActive

  // Track fingerprint changes and fire notifications
  useEffect(() => {
    if (!results) return

    const fingerprint = buildResultsFingerprint(results)

    // First time we receive data — just store the fingerprint, don't notify
    if (!initialDataReceivedRef.current) {
      initialDataReceivedRef.current = true
      prevFingerprintRef.current = fingerprint
      return
    }

    // No change
    if (fingerprint === prevFingerprintRef.current) return

    // Data actually changed — always update fingerprint
    const prevFingerprint = prevFingerprintRef.current
    prevFingerprintRef.current = fingerprint

    if (!enabled || !supported || permission !== "granted") return

    // Build notification body
    const totalVotes = getTotalVotes(results.candidates)
    const leader = getLeadingCandidate(results.candidates)
    const reporting = results.precincts_reporting ?? 0
    const participating = results.precincts_participating ?? 0

    const bodyParts: string[] = []
    if (leader && totalVotes > 0) {
      const pct = ((leader.vote_count / totalVotes) * 100).toFixed(1)
      bodyParts.push(`${leader.name} leads with ${pct}%`)
    }
    if (participating > 0) {
      bodyParts.push(`${reporting}/${participating} precincts reporting`)
    }
    bodyParts.push(`${totalVotes.toLocaleString()} total votes`)

    // Detect if precincts reporting increased
    const prevReporting = prevFingerprint
      ? parseInt(prevFingerprint.split("|")[0]?.split("/")[0]?.split(":")[1] ?? "0", 10)
      : 0
    const isNewReporting = reporting > prevReporting

    const title = isNewReporting
      ? `Results Updated: ${electionName}`
      : `Vote Counts Updated: ${electionName}`

    try {
      // renotify is supported in Firefox and Chrome but not in the TS standard lib types
      const options: NotificationOptions & { renotify?: boolean } = {
        body: bodyParts.join("\n"),
        tag: `election-results-${results.election_id}`,
        renotify: true,
      }
      new Notification(title, options)
    } catch {
      // Notification constructor can throw in some contexts
      // Silently ignore — the in-page UI still shows updates
    }
  }, [results, enabled, supported, permission, electionName])

  const toggle = useCallback(() => {
    if (!supported) {
      toast.error("Notifications not supported", {
        description: "Your browser does not support the Notifications API.",
      })
      return
    }

    if (userEnabled) {
      setUserEnabled(false)
      toast.info("Notifications disabled", {
        description: "You won't receive notifications for this race.",
      })
      return
    }

    // Need to request permission
    if (Notification.permission === "default") {
      Notification.requestPermission().then((result) => {
        const perm = result as "default" | "granted" | "denied"
        setPermission(perm)
        if (perm === "granted") {
          setUserEnabled(true)
          toast.success("Notifications enabled", {
            description:
              "You'll be notified when results are updated for this race.",
          })
        } else if (perm === "denied") {
          toast.error("Notifications blocked", {
            description:
              "Please allow notifications in your browser settings to use this feature.",
          })
        }
      })
      return
    }

    if (Notification.permission === "granted") {
      setPermission("granted")
      setUserEnabled(true)
      toast.success("Notifications enabled", {
        description:
          "You'll be notified when results are updated for this race.",
      })
      return
    }

    // Permission was denied previously
    setPermission("denied")
    toast.error("Notifications blocked", {
      description:
        "Notifications are blocked. Please update your browser settings to allow notifications for this site.",
    })
  }, [supported, userEnabled])

  return { enabled, permission, supported, toggle }
}
