import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Election } from "@/types/elections"
import { DeleteElectionDialog } from "./delete-election-dialog"
import { SourceBadge } from "./source-badge"

interface ElectionTableProps {
  elections: Election[]
  isAdmin: boolean
}

export function ElectionTable({ elections, isAdmin }: ElectionTableProps) {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const deleteTarget = elections.find((e) => e.id === deleteTargetId)

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Last Refresh</TableHead>
              {isAdmin && <TableHead className="w-[60px]" />}
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
                <TableCell>
                  <SourceBadge source={election.source} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {election.last_refreshed_at
                    ? new Date(election.last_refreshed_at).toLocaleString()
                    : "Never"}
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTargetId(election.id)}
                      aria-label={`Delete ${election.name}`}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {deleteTarget && (
        <DeleteElectionDialog
          open={deleteTargetId !== null}
          onOpenChange={(open) => {
            if (!open) setDeleteTargetId(null)
          }}
          electionName={deleteTarget.name}
          electionId={deleteTarget.id}
          onDeleted={() => setDeleteTargetId(null)}
        />
      )}
    </>
  )
}
