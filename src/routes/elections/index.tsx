import { createFileRoute, Link } from "@tanstack/react-router"
import { useDeferredValue, useMemo, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Search,
  Vote,
  X,
} from "lucide-react"
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
import { Toggle } from "@/components/ui/toggle"
import { useElections } from "@/lib/hooks/use-elections"
import { useElectionFilters } from "@/lib/hooks/use-election-filters"
import { useNavigationContext } from "@/stores/navigation-context"
import { ABBREV_TO_NAME } from "@/lib/states"
import { synthesizeDescription } from "@/types/elections"
import type { Election } from "@/types/elections"

export const Route = createFileRoute("/elections/")({
  component: ElectionsListPage,
})

function ElectionListItem({
  election,
  highlighted,
}: {
  election: Election
  highlighted: boolean
}) {
  const formattedDate = new Date(
    election.election_date + "T00:00:00",
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const description = synthesizeDescription(election)

  return (
    <Link
      to="/elections/$electionDate"
      params={{ electionDate: election.id }}
      className={`block border rounded-lg p-4 hover:bg-accent/50 transition-colors ${
        highlighted ? "border-primary/40 bg-primary/5" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{election.name}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{formattedDate}</p>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {description}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge variant="secondary" className="capitalize">
              {election.election_type}
            </Badge>
            <Badge
              variant={election.status === "active" ? "default" : "outline"}
              className={
                election.status === "active"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : ""
              }
            >
              {election.status === "active" ? "Active" : "Finalized"}
            </Badge>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
      </div>
    </Link>
  )
}

function ElectionsListPage() {
  const { electionFilters, setElectionFilters, resetElectionFilters } =
    useElectionFilters()
  const [page, setPage] = useState(1)

  // Exclude client-side search from API params
  const apiFilters = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { search, ...rest } = electionFilters
    return rest
  }, [electionFilters])
  const { data, isLoading, error } = useElections(apiFilters, page)

  // Wrap filter updates to reset pagination when filters change
  const updateFilters = (updates: Partial<typeof electionFilters>) => {
    setElectionFilters(updates)
    setPage(1)
  }

  // Client-side search filtering with deferred value
  const searchText = electionFilters.search ?? ""
  const deferredSearch = useDeferredValue(searchText)

  const elections = data?.elections
  const filteredElections = useMemo(() => {
    if (!elections) return []
    if (!deferredSearch) return elections
    const lower = deferredSearch.toLowerCase()
    return elections.filter(
      (e) =>
        e.name.toLowerCase().includes(lower) ||
        e.district.toLowerCase().includes(lower) ||
        synthesizeDescription(e).toLowerCase().includes(lower),
    )
  }, [elections, deferredSearch])

  // Geographic context
  const navState = useNavigationContext((s) => s.stateAbbrev)
  const navCounty = useNavigationContext((s) => s.countyName)
  const clearContext = useNavigationContext((s) => s.setContext)
  let contextLabel: string | null = null
  if (navCounty && navState) {
    contextLabel = `${navCounty} County, ${ABBREV_TO_NAME[navState] ?? navState.toUpperCase()}`
  } else if (navState) {
    contextLabel = ABBREV_TO_NAME[navState] ?? navState.toUpperCase()
  }

  // Highlight elections matching geographic context
  const contextMatch = (election: Election): boolean => {
    if (!contextLabel) return false
    const district = election.district.toLowerCase()
    if (navCounty && district.includes(navCounty.toLowerCase())) return true
    if (navState) {
      const stateName = (ABBREV_TO_NAME[navState] ?? "").toLowerCase()
      if (stateName && district.includes(stateName)) return true
    }
    return false
  }

  const hasActiveFilters =
    electionFilters.status !== "all" ||
    electionFilters.election_type !== "all" ||
    electionFilters.registration_open ||
    electionFilters.early_voting_active ||
    searchText

  return (
    <div className="container mx-auto px-4 py-4 sm:p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Vote className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Elections</h1>
      </div>

      {/* Geographic context banner */}
      {contextLabel && (
        <div className="flex items-center gap-2 mb-4 p-3 rounded-lg border bg-muted/30">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm">
            Showing elections for <strong>{contextLabel}</strong>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 text-xs"
            onClick={() => clearContext(null, null)}
          >
            Show all
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search elections..."
          value={searchText}
          onChange={(e) => updateFilters({ search: e.target.value })}
          className="pl-9"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select
          value={electionFilters.status}
          onValueChange={(v) =>
            updateFilters({
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
            updateFilters({
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

        <Toggle
          variant="outline"
          pressed={electionFilters.registration_open ?? false}
          onPressedChange={(pressed) =>
            updateFilters({ registration_open: pressed || undefined })
          }
          className="data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
        >
          Registration Open
        </Toggle>

        <Toggle
          variant="outline"
          pressed={electionFilters.early_voting_active ?? false}
          onPressedChange={(pressed) =>
            updateFilters({ early_voting_active: pressed || undefined })
          }
          className="data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
        >
          Early Voting Now
        </Toggle>
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

      {data && filteredElections.length === 0 && (
        <div className="text-center py-12">
          <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">
            No elections found matching your search.
          </p>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { resetElectionFilters(); setPage(1) }}
            >
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
      )}

      {data && filteredElections.length > 0 && (
        <>
          <div className="space-y-3">
            {filteredElections.map((election) => (
              <ElectionListItem
                key={election.id}
                election={election}
                highlighted={contextMatch(election)}
              />
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
