import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { VoterDetail } from "@/types/voter"

interface VoterRegistrationCardProps {
  voter: VoterDetail
}

export function VoterRegistrationCard({ voter }: VoterRegistrationCardProps) {
  const fullName = [
    voter.first_name,
    voter.middle_name,
    voter.last_name,
    voter.suffix,
  ]
    .filter(Boolean)
    .join(" ")

  const address = [voter.address_line_1, voter.address_line_2]
    .filter(Boolean)
    .join("\n")

  const registrationDate = new Date(
    voter.registration_date + "T00:00:00",
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{fullName}</CardTitle>
          <Badge
            variant={voter.status === "Active" ? "default" : "secondary"}
          >
            {voter.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Voter ID</dt>
            <dd className="font-mono">{voter.voter_id}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">County</dt>
            <dd>{voter.county}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Registration Date</dt>
            <dd>{registrationDate}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Address</dt>
            <dd className="whitespace-pre-line">{address}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}
