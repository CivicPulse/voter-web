import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"
import { Calendar, ChevronLeft, ChevronRight, Loader2, Vote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useElections } from "@/lib/hooks/use-elections"
import { useElectionFilters } from "@/lib/hooks/use-election-filters"
import type { ElectionEvent } from "@/types/elections"

export const Route = createFileRoute("/elections/")({
  component: ElectionsListPage,
})

function ElectionEventCard({ event }: { event: ElectionEvent }) {
  const formattedDate = new Date(event.date + "T00:00:00").toLocaleDateString(
    "en-US",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" },
  )

  return (
    <Link
      to="/elections/$electionDate"
      params={{ electionDate: event.date }}
      className="block border rounded-lg p-4 hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <h2 className="font-semibold truncate">{formattedDate}</h2>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {event.types.map((type) => (
              <Badge key={type} variant="secondary" className="capitalize">
                {type}
              </Badge>
            ))}
            <Badge variant="outline">
              {event.raceCount} {event.raceCount === 1 ? "race" : "races"}
            </Badge>
            {event.hasActiveRaces && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Active
              </Badge>
            )}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
      </div>
    </Link>
  )
}

function ElectionsListPage() {
  const { electionFilters, setElectionFilters } = useElectionFilters()
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useElections(electionFilters, page)

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Vote className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Elections</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select
          value={electionFilters.status}
          onValueChange={(v) =>
            setElectionFilters({
              status: v as typeof electionFilters.status,
            })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="finalized">Finalized</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={electionFilters.election_type}
          onValueChange={(v) =>
            setElectionFilters({
              election_type: v as typeof electionFilters.election_type,
            })
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="primary">Primary</SelectItem>
            <SelectItem value="special">Special</SelectItem>
            <SelectItem value="runoff">Runoff</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          placeholder="From date"
          value={electionFilters.date_from ?? ""}
          onChange={(e) =>
            setElectionFilters({
              date_from: e.target.value || null,
            })
          }
          className="w-[160px]"
        />
        <Input
          type="date"
          placeholder="To date"
          value={electionFilters.date_to ?? ""}
          onChange={(e) =>
            setElectionFilters({
              date_to: e.target.value || null,
            })
          }
          className="w-[160px]"
        />
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-destructive">
          <p>Failed to load elections. Please try again.</p>
        </div>
      )}

      {data && data.events.length === 0 && (
        <div className="text-center py-12">
          <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No elections match the current filters.
          </p>
        </div>
      )}

      {data && data.events.length > 0 && (
        <>
          <div className="space-y-3">
            {data.events.map((event) => (
              <ElectionEventCard key={event.date} event={event} />
            ))}
          </div>

          {/* Pagination */}
          {data.total_pages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {data.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.total_pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
