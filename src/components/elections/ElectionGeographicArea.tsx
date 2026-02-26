import { MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Election } from "@/types/elections"

interface ElectionGeographicAreaProps {
  election: Election
}

export function ElectionGeographicArea({ election }: ElectionGeographicAreaProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Geographic Area
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{election.district}</p>
      </CardContent>
    </Card>
  )
}
