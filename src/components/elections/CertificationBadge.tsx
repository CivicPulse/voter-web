import { Shield, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { ElectionStatus } from "@/types/elections"
import { getCertificationLabel } from "@/types/elections"

interface CertificationBadgeProps {
  status: ElectionStatus
}

export function CertificationBadge({ status }: CertificationBadgeProps) {
  const label = getCertificationLabel(status)

  if (status === "finalized") {
    return (
      <Badge
        variant="outline"
        className="border-green-600 text-green-700 dark:text-green-400 gap-1"
      >
        <ShieldCheck className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      className="border-yellow-600 text-yellow-700 dark:text-yellow-400 gap-1"
    >
      <Shield className="h-3 w-3" />
      {label}
    </Badge>
  )
}
