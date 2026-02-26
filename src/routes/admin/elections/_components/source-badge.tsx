import { Badge } from "@/components/ui/badge"

interface SourceBadgeProps {
  source?: "sos_feed" | "manual" | null
}

export function SourceBadge({ source }: SourceBadgeProps) {
  if (source === "sos_feed") {
    return (
      <Badge
        variant="outline"
        className="bg-blue-100 text-blue-700 border-blue-200"
      >
        SOS Feed
      </Badge>
    )
  }
  if (source === "manual") {
    return (
      <Badge
        variant="outline"
        className="bg-amber-100 text-amber-700 border-amber-200"
      >
        Manual
      </Badge>
    )
  }
  return null
}
