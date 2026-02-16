import { Link } from "@tanstack/react-router"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Election } from "@/types/elections"

interface ElectionTableProps {
  elections: Election[]
}

export function ElectionTable({ elections }: ElectionTableProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Refresh</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {elections.map((election) => (
            <TableRow key={election.id}>
              <TableCell className="font-medium">
                <Link
                  to="/admin/elections/$electionId"
                  params={{ electionId: election.id }}
                  className="hover:underline"
                >
                  {election.name}
                </Link>
                {election.ballot_item_id && (
                  <Badge
                    variant="outline"
                    className="ml-2 text-xs font-normal"
                  >
                    Feed
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-sm">
                {new Date(election.election_date + "T00:00:00").toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {election.election_type}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    election.status === "active" ? "default" : "secondary"
                  }
                >
                  {election.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {election.last_refreshed_at
                  ? new Date(election.last_refreshed_at).toLocaleString()
                  : "Never"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
