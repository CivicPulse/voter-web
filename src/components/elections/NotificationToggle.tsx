import { Bell, BellOff, BellRing } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NotificationToggleProps {
  enabled: boolean
  permission: "default" | "granted" | "denied"
  supported: boolean
  onToggle: () => void
}

/**
 * Toggle button for enabling/disabling browser notifications on election
 * results updates. Shows contextual title based on current state.
 */
export function NotificationToggle({
  enabled,
  permission,
  supported,
  onToggle,
}: NotificationToggleProps) {
  if (!supported) return null

  const isDenied = permission === "denied" && !enabled

  let label: string
  let Icon: typeof Bell

  if (enabled) {
    label = "Notifications on — click to disable"
    Icon = BellRing
  } else if (isDenied) {
    label = "Notifications blocked by browser"
    Icon = BellOff
  } else {
    label = "Get notified when results update"
    Icon = Bell
  }

  return (
    <Button
      variant={enabled ? "default" : "outline"}
      size="sm"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={enabled}
      title={label}
      className="gap-1.5"
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">
        {enabled ? "Notifications on" : "Notify me"}
      </span>
    </Button>
  )
}
