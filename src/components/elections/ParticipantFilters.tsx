import { useEffect, useRef } from "react"
import { Loader2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useVoterFilters } from "@/hooks/useVoters"
import { useParticipationStats } from "@/lib/hooks/use-participation-stats"
import type { ParticipantUrlParams } from "@/types/elections"

const MISMATCH_OPTIONS = [
  { value: "true", label: "Mismatch Only" },
  { value: "false", label: "No Mismatch" },
]

interface ParticipantFiltersProps {
  electionId: string
  params: ParticipantUrlParams
  onUpdate: (updates: Partial<ParticipantUrlParams>) => void
}

export function ParticipantFilters({
  electionId,
  params,
  onUpdate,
}: Readonly<ParticipantFiltersProps>) {
  const { data: stats } = useParticipationStats(electionId)

  const { data: filters, isFetching } = useVoterFilters(
    params.p_county ? { county: params.p_county } : undefined,
  )

  // Global filters (for statuses, congressional, state senate, state house)
  // when no county is selected — we still need statuses without county scope
  const { data: globalFilters } = useVoterFilters(undefined)

  // Track previous county to reset p_precinct on county change
  const prevCountyRef = useRef(params.p_county)
  useEffect(() => {
    if (prevCountyRef.current !== params.p_county) {
      prevCountyRef.current = params.p_county
      if (params.p_precinct) {
        onUpdate({ p_precinct: undefined, p_page: undefined })
      }
    }
  }, [params.p_county, params.p_precinct, onUpdate])

  const updateFilter = (updates: Partial<ParticipantUrlParams>) => {
    onUpdate({ ...updates, p_page: undefined })
  }

  // County options from participation stats, sorted alphabetically
  const countyOptions = stats?.county_breakdown
    .map((item) => item.county)
    .sort((a, b) => a.localeCompare(b)) ?? []

  // Ballot style options from participation stats, sorted alphabetically
  const ballotStyleOptions = stats?.method_breakdown
    .map((item) => item.method)
    .sort((a, b) => a.localeCompare(b)) ?? []

  // Use county-scoped filters when county is selected, otherwise global
  const activeFilters = params.p_county ? filters : globalFilters
  const statuses = activeFilters?.statuses ?? []
  const congressionalDistricts = activeFilters?.congressional_districts ?? []
  const stateSenateDistricts = activeFilters?.state_senate_districts ?? []
  const stateHouseDistricts = activeFilters?.state_house_districts ?? []

  const countyPrecincts = filters?.county_precincts ?? []
  const hasCountyPrecincts = params.p_county && countyPrecincts.length > 0

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {/* County */}
        <Select
          value={params.p_county ?? "all"}
          onValueChange={(v) =>
            updateFilter({ p_county: v === "all" ? undefined : v })
          }
        >
          <SelectTrigger className="w-[160px]" aria-label="Filter by county">
            <SelectValue placeholder="County" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Counties</SelectItem>
            {countyOptions.map((county) => (
              <SelectItem key={county} value={county}>
                {county}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Voter Status */}
        <Select
          value={params.p_voter_status ?? "all"}
          onValueChange={(v) =>
            updateFilter({ p_voter_status: v === "all" ? undefined : v })
          }
        >
          <SelectTrigger className="w-[140px]" aria-label="Filter by voter status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* District Mismatch */}
        <Select
          value={params.p_mismatch ?? "all"}
          onValueChange={(v) =>
            updateFilter({
              p_mismatch: v === "all" ? undefined : (v as "true" | "false"),
            })
          }
        >
          <SelectTrigger className="w-[160px]" aria-label="Filter by district check">
            <SelectValue placeholder="District Check" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Districts</SelectItem>
            {MISMATCH_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Congressional District */}
        <Select
          value={params.p_congressional ?? "all"}
          onValueChange={(v) =>
            updateFilter({ p_congressional: v === "all" ? undefined : v })
          }
        >
          <SelectTrigger className="w-[180px]" aria-label="Filter by congressional district">
            <SelectValue placeholder="Congressional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Congressional</SelectItem>
            {congressionalDistricts.map((d) => (
              <SelectItem key={d} value={d}>
                District {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* State Senate District */}
        <Select
          value={params.p_senate ?? "all"}
          onValueChange={(v) =>
            updateFilter({ p_senate: v === "all" ? undefined : v })
          }
        >
          <SelectTrigger className="w-[160px]" aria-label="Filter by state senate district">
            <SelectValue placeholder="State Senate" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All State Senate</SelectItem>
            {stateSenateDistricts.map((d) => (
              <SelectItem key={d} value={d}>
                District {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* State House District */}
        <Select
          value={params.p_house ?? "all"}
          onValueChange={(v) =>
            updateFilter({ p_house: v === "all" ? undefined : v })
          }
        >
          <SelectTrigger className="w-[150px]" aria-label="Filter by state house district">
            <SelectValue placeholder="State House" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All State House</SelectItem>
            {stateHouseDistricts.map((d) => (
              <SelectItem key={d} value={d}>
                District {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Ballot Style */}
        <Select
          value={params.p_ballot_style ?? "all"}
          onValueChange={(v) =>
            updateFilter({ p_ballot_style: v === "all" ? undefined : v })
          }
        >
          <SelectTrigger className="w-[160px]" aria-label="Filter by ballot style">
            <SelectValue placeholder="Ballot Style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ballot Styles</SelectItem>
            {ballotStyleOptions.map((style) => (
              <SelectItem key={style} value={style}>
                {style}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* County-scoped precinct row */}
      {params.p_county && (isFetching || hasCountyPrecincts) && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            {params.p_county} districts:
          </span>

          {isFetching && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}

          {hasCountyPrecincts && (
            <Select
              value={params.p_precinct ?? "all"}
              onValueChange={(v) =>
                updateFilter({ p_precinct: v === "all" ? undefined : v })
              }
            >
              <SelectTrigger className="w-[180px]" aria-label="Filter by precinct">
                <SelectValue placeholder="Precinct" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Precincts</SelectItem>
                {countyPrecincts.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  )
}
