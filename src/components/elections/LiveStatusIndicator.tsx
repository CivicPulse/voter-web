import { useEffect, useMemo, useState } from "react"
import { Radio, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { ElectionStatus } from "@/types/elections"

interface LiveStatusIndicatorProps {
  status: ElectionStatus
  lastRefreshedAt: string | null
  refreshIntervalSeconds: number
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })
}

function calculateRemaining(
  lastRefreshedAt: string,
  intervalSeconds: number,
): number {
  const lastRefresh = new Date(lastRefreshedAt).getTime()
  const nextRefresh = lastRefresh + intervalSeconds * 1000
  return Math.max(0, Math.ceil((nextRefresh - Date.now()) / 1000))
}

function useCountdown(
  lastRefreshedAt: string | null,
  intervalSeconds: number,
  isActive: boolean,
) {
  // Tick counter drives recalculation without setState in effect body
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!isActive || !lastRefreshedAt) return
    const timer = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(timer)
  }, [lastRefreshedAt, intervalSeconds, isActive])

  // tick is in the dependency array to trigger recalculation each second
  return useMemo(
    () => {
      if (!isActive || !lastRefreshedAt) return null
      return calculateRemaining(lastRefreshedAt, intervalSeconds)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick, isActive, lastRefreshedAt, intervalSeconds],
  )
}

export function LiveStatusIndicator({
  status,
  lastRefreshedAt,
  refreshIntervalSeconds,
}: LiveStatusIndicatorProps) {
  const isActive = status === "active"
  const secondsUntilRefresh = useCountdown(
    lastRefreshedAt,
    refreshIntervalSeconds,
    isActive,
  )

  return (
    <div className="flex items-center gap-2 text-sm">
      {isActive ? (
        <Badge variant="outline" className="gap-1 text-green-700 border-green-300">
          <Radio className="h-3 w-3 animate-pulse" />
          Live
        </Badge>
      ) : (
        <Badge variant="outline" className="gap-1 text-blue-700 border-blue-300">
          <CheckCircle2 className="h-3 w-3" />
          Final
        </Badge>
      )}

      {lastRefreshedAt && (
        <span className="text-muted-foreground">
          Updated {formatTimestamp(lastRefreshedAt)}
        </span>
      )}

      {isActive && secondsUntilRefresh !== null && (
        <span className="text-muted-foreground">
          · next in {secondsUntilRefresh}s
        </span>
      )}
    </div>
  )
}
