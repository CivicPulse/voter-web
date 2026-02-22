import { Link, useNavigate } from "@tanstack/react-router"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { VoterSearchParams, VoterSearchResponse } from "@/types/voter"

interface VoterTableProps {
  data: VoterSearchResponse
  params: VoterSearchParams
}

type SortField = NonNullable<VoterSearchParams["sort_by"]>

function SortIcon({
  field,
  currentSort,
  currentOrder,
}: Readonly<{
  field: SortField
  currentSort?: SortField
  currentOrder?: "asc" | "desc"
}>) {
  if (currentSort !== field) return <ArrowUpDown className="h-3 w-3 ml-1" />
  if (currentOrder === "asc") return <ArrowUp className="h-3 w-3 ml-1" />
  return <ArrowDown className="h-3 w-3 ml-1" />
}

export function VoterTable({ data, params }: Readonly<VoterTableProps>) {
  const navigate = useNavigate()

  const handleSort = (field: SortField) => {
    const newOrder =
      params.sort_by === field && params.sort_order === "asc" ? "desc" : "asc"
    navigate({
      to: "/voters",
      search: {
        ...params,
        sort_by: field,
        sort_order: newOrder,
      },
      replace: true,
    })
  }

  const handlePageChange = (newPage: number) => {
    navigate({
      to: "/voters",
      search: {
        ...params,
        page: newPage,
      },
      replace: true,
    })
  }

  if (data.voters.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          No voters found matching your search criteria.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your search query or filters.
        </p>
      </div>
    )
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <button
                type="button"
                className="flex items-center font-medium hover:text-foreground"
                onClick={() => handleSort("name")}
              >
                Name
                <SortIcon
                  field="name"
                  currentSort={params.sort_by}
                  currentOrder={params.sort_order}
                />
              </button>
            </TableHead>
            <TableHead>
              <button
                type="button"
                className="flex items-center font-medium hover:text-foreground"
                onClick={() => handleSort("county")}
              >
                County
                <SortIcon
                  field="county"
                  currentSort={params.sort_by}
                  currentOrder={params.sort_order}
                />
              </button>
            </TableHead>
            <TableHead>
              <button
                type="button"
                className="flex items-center font-medium hover:text-foreground"
                onClick={() => handleSort("voter_id")}
              >
                Voter ID
                <SortIcon
                  field="voter_id"
                  currentSort={params.sort_by}
                  currentOrder={params.sort_order}
                />
              </button>
            </TableHead>
            <TableHead>
              <button
                type="button"
                className="flex items-center font-medium hover:text-foreground"
                onClick={() => handleSort("registration_date")}
              >
                Registration Date
                <SortIcon
                  field="registration_date"
                  currentSort={params.sort_by}
                  currentOrder={params.sort_order}
                />
              </button>
            </TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.voters.map((voter) => (
            <TableRow key={voter.id}>
              <TableCell>
                <Link
                  to="/voters/$voterId"
                  params={{ voterId: voter.id }}
                  className="font-medium hover:underline text-primary"
                >
                  {voter.last_name}, {voter.first_name}
                </Link>
              </TableCell>
              <TableCell>{voter.county}</TableCell>
              <TableCell className="font-mono text-sm">
                {voter.voter_id}
              </TableCell>
              <TableCell>
                {voter.registration_date
                  ? new Date(
                      voter.registration_date + "T00:00:00",
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={voter.status === "Active" ? "default" : "secondary"}
                >
                  {voter.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {data.total_pages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={data.page <= 1}
            onClick={() => handlePageChange(data.page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.page} of {data.total_pages} ({data.total} results)
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={data.page >= data.total_pages}
            onClick={() => handlePageChange(data.page + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
