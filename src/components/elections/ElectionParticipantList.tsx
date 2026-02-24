import { useState, useDeferredValue } from "react"
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

const PAGE_SIZE = 25

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
}: Readonly<{
  electionId: string
}>) {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const deferredSearch = useDeferredValue(searchInput)

  const { data, isLoading, isError, refetch } = useElectionParticipants(
    electionId,
    { page, pageSize: PAGE_SIZE, search: deferredSearch },
    true,
  )

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    setPage(1)
  }

  return (
    <div className="space-y-4" data-testid="election-participant-list">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">Voter List</h3>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or registration #"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
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
              {deferredSearch
                ? "No voters match the search criteria."
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
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={data.pagination.page >= data.pagination.total_pages}
                    onClick={() => setPage((p) => p + 1)}
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
