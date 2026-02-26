import { useState, useEffect } from "react"
import { Link } from "@tanstack/react-router"
import { Search, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useElectionParticipants } from "@/lib/hooks/use-election-participants"
import type { ParticipantUrlParams } from "@/types/elections"

const PAGE_SIZE = 25

function hasActiveFilters(params: ParticipantUrlParams): boolean {
  return !!(
    params.p_county ||
    params.p_voter_status ||
    params.p_mismatch ||
    params.p_precinct ||
    params.p_ballot_style ||
    params.p_congressional ||
    params.p_senate ||
    params.p_house
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}

export function ElectionParticipantList({
  electionId,
  params,
  onUpdate,
}: Readonly<{
  electionId: string
  params: ParticipantUrlParams
  onUpdate: (updates: Partial<ParticipantUrlParams>) => void
}>) {
  const page = params.p_page ?? 1
  const [searchInput, setSearchInput] = useState(params.p_q ?? "")

  // Debounce search → URL update
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim()
      if (trimmed !== (params.p_q ?? "")) {
        onUpdate({ p_q: trimmed || undefined, p_page: undefined })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, params.p_q, onUpdate])

  const { data, isLoading, isError, refetch } = useElectionParticipants(
    electionId,
    {
      page,
      pageSize: PAGE_SIZE,
      search: params.p_q,
      county: params.p_county,
      voter_status: params.p_voter_status,
      has_district_mismatch: params.p_mismatch,
      county_precinct: params.p_precinct,
      ballot_style: params.p_ballot_style,
      congressional_district: params.p_congressional,
      state_senate_district: params.p_senate,
      state_house_district: params.p_house,
    },
    true,
  )

  return (
    <div className="space-y-4" data-testid="election-participant-list">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">Voter List</h3>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or registration #"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading && <LoadingSkeleton />}

      {isError && (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Failed to load participant list.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && data && (
        <>
          {data.items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {hasActiveFilters(params) || params.p_q
                ? "No voters match the current filters."
                : "No participants found for this election."}
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Registration #</TableHead>
                    <TableHead>County</TableHead>
                    <TableHead>Voting Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell>
                        {participant.first_name || participant.last_name
                          ? `${participant.first_name} ${participant.last_name}`.trim()
                          : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {participant.voter_id ? (
                          <Link
                            to="/voters/$voterId"
                            params={{ voterId: participant.voter_id }}
                            className="text-primary hover:underline"
                          >
                            {participant.voter_registration_number}
                          </Link>
                        ) : (
                          participant.voter_registration_number
                        )}
                      </TableCell>
                      <TableCell>{participant.county}</TableCell>
                      <TableCell>{participant.voting_method}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {data.pagination.page} of {data.pagination.total_pages} ({data.pagination.total.toLocaleString("en-US")} total)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.pagination.page <= 1}
                    onClick={() => onUpdate({ p_page: data.pagination.page - 1 })}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.pagination.page >= data.pagination.total_pages}
                    onClick={() => onUpdate({ p_page: data.pagination.page + 1 })}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
