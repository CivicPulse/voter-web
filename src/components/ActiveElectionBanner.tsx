import { Link } from "@tanstack/react-router"
import { Vote } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Election } from "@/types/elections"

interface ActiveElectionBannerProps {
  elections: Election[]
  className?: string
}

/**
 * Floating banner shown on district/county detail pages when there are
 * active elections. Links to the election date page.
 */
export function ActiveElectionBanner({
  elections,
  className,
}: Readonly<ActiveElectionBannerProps>) {
  if (elections.length === 0) return null

  // Group by date for display
  const byDate = new Map<string, Election[]>()
  for (const e of elections) {
    const existing = byDate.get(e.election_date)
    if (existing) {
      existing.push(e)
    } else {
      byDate.set(e.election_date, [e])
    }
  }

  const dates = Array.from(byDate.keys()).sort()

  return (
    <div className={className}>
      {dates.map((date) => {
        const races = byDate.get(date)!
        const formattedDate = new Date(date + "T00:00:00").toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric", year: "numeric" },
        )
        return (
          <Link
            key={date}
            to="/elections/$electionDate"
            params={{ electionDate: date }}
            aria-label={`View active election on ${formattedDate}, ${races.length} ${races.length === 1 ? "race" : "races"}`}
            className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm transition-colors hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:hover:bg-green-900"
          >
            <Vote className="h-4 w-4 shrink-0 text-green-700 dark:text-green-400" />
            <span className="flex-1 min-w-0">
              <span className="font-medium text-green-800 dark:text-green-300">
                Active Election
              </span>
              <span className="text-green-700 dark:text-green-400">
                {" "}&middot; {formattedDate}
              </span>
              <span className="text-green-600 dark:text-green-500">
                {" "}&middot; {races.length} {races.length === 1 ? "race" : "races"}
              </span>
            </span>
            <Badge className="shrink-0 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              View
            </Badge>
          </Link>
        )
      })}
    </div>
  )
}
