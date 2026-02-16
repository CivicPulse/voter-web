import { Link } from "@tanstack/react-router"
import { ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Election } from "@/types/elections"

interface RaceListItemProps {
  race: Election
  electionDate: string
}

export function RaceListItem({ race, electionDate }: RaceListItemProps) {
  return (
    <Link
      to="/elections/$electionDate/$electionId"
      params={{ electionDate, electionId: race.id }}
      className="flex items-center justify-between gap-4 border rounded-lg p-4 hover:bg-accent/50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">{race.name}</h3>
        <p className="text-sm text-muted-foreground truncate">{race.district}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary" className="capitalize">
            {race.election_type}
          </Badge>
          {race.status === "active" ? (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Active
            </Badge>
          ) : (
            <Badge variant="outline">Finalized</Badge>
          )}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
    </Link>
  )
}
