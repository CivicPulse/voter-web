import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useElections } from "@/lib/hooks/use-elections"
import { useNavigationContext } from "@/stores/navigation-context"
import { ABBREV_TO_NAME } from "@/lib/states"
import { synthesizeDescription } from "@/types/elections"
import {
  DATE_PRESETS,
  resolvePreset,
  matchPreset,
  getDefaultDateRange,
} from "@/lib/date-presets"
import {
  electionSearchSchema,
  mapParamsToApiFilters,
  deriveActiveFilters,
} from "@/lib/election-search"
import type { ElectionSearchParams } from "@/lib/election-search"
import { EmptyState } from "@/components/ui/empty-state"
import type { DatePresetKey } from "@/lib/date-presets"
import type { Election } from "@/types/elections"

// ---------------------------------------------------------------------------
// Route definition
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/elections/")({
  component: ElectionsListPage,
  validateSearch: electionSearchSchema,
})

// ---------------------------------------------------------------------------
// ElectionListItem (unchanged)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// ElectionsListPage
// ---------------------------------------------------------------------------

function ElectionsListPage() {
  const params = Route.useSearch()
  const navigate = useNavigate()

  // Default date range for "Next 3 months" (applied when no dates in URL)
  const defaultDates = getDefaultDateRange()

  // Map URL params to API filters
  const apiFilters = mapParamsToApiFilters(params, defaultDates)

  // Exclude client-side search from API params
  const { data, isLoading, error } = useElections(apiFilters, params.page ?? 1)

  // Helper to update filters and reset page
  const updateFilters = (updates: Partial<ElectionSearchParams>) => {
    navigate({ to: "/elections", search: { ...params, ...updates, page: 1 } })
  }

  // Clear all filters (returns to default "Next 3 months" state)
  const clearAllFilters = () => {
    navigate({ to: "/elections", search: {} })
  }

  // Determine the active date preset from current URL params
  const activePreset: DatePresetKey =
    params.date_preset === "all-time"
      ? "all-time"
      : matchPreset(
          params.date_from ?? defaultDates.date_from,
          params.date_to ?? defaultDates.date_to,
        )

  // Custom date range popover state
  const [customRangeOpen, setCustomRangeOpen] = useState(false)
  const [customFrom, setCustomFrom] = useState(params.date_from ?? "")
  const [customTo, setCustomTo] = useState(params.date_to ?? "")

  // Client-side search filtering with deferred value
  const searchText = params.search ?? ""
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

  // Derive active (non-default) filters for chip display
  const activeFilters = useMemo(
    () => deriveActiveFilters(params, activePreset),
    [params, activePreset],
  )

  // Handle removing a single filter chip
  const onRemoveChip = (paramKey: string) => {
    switch (paramKey) {
      case "status":
        updateFilters({ status: undefined })
        break
      case "type":
        updateFilters({ type: undefined })
        break
      case "date_range":
        updateFilters({
          date_from: undefined,
          date_to: undefined,
          date_preset: undefined,
        })
        break
      case "reg_open":
        updateFilters({ reg_open: undefined })
        break
      case "early_voting":
        updateFilters({ early_voting: undefined })
        break
      case "search":
        updateFilters({ search: undefined })
        break
    }
  }

  // Handle date preset selection
  const handlePresetChange = (value: string) => {
    const key = value as DatePresetKey
    if (key === "custom") {
      // Open the custom date range popover, don't navigate yet
      setCustomFrom(params.date_from ?? "")
      setCustomTo(params.date_to ?? "")
      setCustomRangeOpen(true)
      return
    }
    if (key === "all-time") {
      updateFilters({
        date_from: undefined,
        date_to: undefined,
        date_preset: "all-time",
      })
      return
    }
    // Named preset -- resolve to dates
    const resolved = resolvePreset(key)
    updateFilters({
      date_from: resolved.date_from,
      date_to: resolved.date_to,
      date_preset: undefined,
    })
  }

  // Apply custom date range
  const applyCustomRange = () => {
    updateFilters({
      date_from: customFrom || undefined,
      date_to: customTo || undefined,
      date_preset: undefined,
    })
    setCustomRangeOpen(false)
  }

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
          onChange={(e) => updateFilters({ search: e.target.value || undefined })}
          className="pl-9"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        {/* Status filter */}
        <Select
          value={params.status ?? "all"}
          onValueChange={(v) =>
            updateFilters({ status: v === "all" ? undefined : (v as "active" | "finalized") })
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

        {/* Type filter */}
        <Select
          value={params.type ?? "all"}
          onValueChange={(v) =>
            updateFilters({ type: v === "all" ? undefined : (v as "general" | "primary" | "special" | "runoff") })
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

        {/* Date preset filter */}
        <Popover open={customRangeOpen} onOpenChange={setCustomRangeOpen}>
          <PopoverTrigger asChild>
            <div>
              <Select value={activePreset} onValueChange={handlePresetChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_PRESETS.map((preset) => (
                    <SelectItem key={preset.key} value={preset.key}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="start">
            <div className="space-y-3">
              <p className="text-sm font-medium">Custom date range</p>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">From</label>
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">To</label>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </div>
              <Button size="sm" className="w-full" onClick={applyCustomRange}>
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Registration open checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="reg-open"
            checked={params.reg_open === "true"}
            onCheckedChange={(checked) =>
              updateFilters({ reg_open: checked ? "true" : undefined })
            }
          />
          <label
            htmlFor="reg-open"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Registration open
          </label>
        </div>

        {/* Early voting active checkbox */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="early-voting"
            checked={params.early_voting === "true"}
            onCheckedChange={(checked) =>
              updateFilters({ early_voting: checked ? "true" : undefined })
            }
          />
          <label
            htmlFor="early-voting"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Early voting active
          </label>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {activeFilters.map((chip) => (
            <Badge
              key={chip.paramKey}
              variant="outline"
              className="gap-1 cursor-pointer pl-2.5 pr-1.5 py-1"
              onClick={() => onRemoveChip(chip.paramKey)}
            >
              {chip.key}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={clearAllFilters}
          >
            Clear all
          </Button>
        </div>
      )}

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

      {/* Empty state: filters active, zero results */}
      {data && filteredElections.length === 0 && activeFilters.length > 0 && (
        <EmptyState
          icon={<Vote className="h-12 w-12" />}
          title="No elections found"
          description={
            <div>
              <p className="mb-2">Active filters:</p>
              <ul className="text-left list-disc list-inside mb-2">
                {activeFilters.map((f) => (
                  <li key={f.key}>{f.key}</li>
                ))}
              </ul>
              <p>Try broadening your filters for more results.</p>
            </div>
          }
          action={{ label: "Clear all filters", onClick: clearAllFilters }}
        />
      )}

      {/* Empty state: default filters, no results */}
      {data && filteredElections.length === 0 && activeFilters.length === 0 && (
        <EmptyState
          icon={<Vote className="h-12 w-12" />}
          title="No upcoming elections"
          description="There are no elections in the next 3 months."
          action={{
            label: "Show all elections",
            onClick: () =>
              updateFilters({
                date_from: undefined,
                date_to: undefined,
                date_preset: "all-time",
              }),
          }}
        />
      )}

      {data && filteredElections.length > 0 && (
        <>
          {/* Result count */}
          <p className="text-sm text-muted-foreground mb-3">
            Showing {filteredElections.length} of {data.total} elections
          </p>

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
                disabled={(params.page ?? 1) <= 1}
                onClick={() =>
                  navigate({
                    to: "/elections",
                    search: { ...params, page: (params.page ?? 1) - 1 },
                  })
                }
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {params.page ?? 1} of {data.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={(params.page ?? 1) >= data.total_pages}
                onClick={() =>
                  navigate({
                    to: "/elections",
                    search: { ...params, page: (params.page ?? 1) + 1 },
                  })
                }
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
