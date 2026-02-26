import { UserCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Election } from "@/types/elections"

interface ElectionEligibilityProps {
  election: Election
}

export function ElectionEligibility({ election }: ElectionEligibilityProps) {
  let description: string

  if (election.eligibility_description) {
    description = election.eligibility_description
  } else if (election.district) {
    description = `Registered voters in ${election.district}`
  } else {
    description = "Contact your local election office for eligibility details"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          Eligibility
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
