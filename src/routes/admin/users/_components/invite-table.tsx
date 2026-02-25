import { useState } from "react"
import { useCancelInvite, useResendInvite } from "@/lib/hooks/use-invites"
import type { Invite } from "@/types/admin"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MoreHorizontal } from "lucide-react"

function getInviteStatus(invite: Invite): "accepted" | "expired" | "pending" {
  if (invite.accepted_at) return "accepted"
  if (new Date(invite.expires_at) < new Date()) return "expired"
  return "pending"
}

interface InviteTableProps {
  invites: Invite[]
}

export function InviteTable({ invites }: InviteTableProps) {
  const resendInviteMutation = useResendInvite()
  const cancelInviteMutation = useCancelInvite()
  const [cancellingInvite, setCancellingInvite] = useState<Invite | null>(null)

  const handleCancelConfirm = () => {
    if (!cancellingInvite) return
    cancelInviteMutation.mutate(cancellingInvite.id, {
      onSuccess: () => setCancellingInvite(null),
    })
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.map((invite) => {
              const status = getInviteStatus(invite)
              const isPending = status === "pending"

              return (
                <TableRow key={invite.id}>
                  <TableCell className="font-medium">{invite.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        invite.role === "admin"
                          ? "destructive"
                          : invite.role === "analyst"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {invite.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(invite.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(invite.expires_at).toLocaleDateString()}
                    {status === "expired" && (
                      <span className="ml-1 text-destructive">(expired)</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        status === "accepted"
                          ? "default"
                          : status === "expired"
                            ? "outline"
                            : "secondary"
                      }
                    >
                      {status === "accepted"
                        ? "Accepted"
                        : status === "expired"
                          ? "Expired"
                          : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isPending && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Invite actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              resendInviteMutation.mutate(invite.id)
                            }
                            disabled={resendInviteMutation.isPending}
                          >
                            Resend Invite
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setCancellingInvite(invite)}
                          >
                            Cancel Invite
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Cancel Invite Confirmation Dialog */}
      <Dialog
        open={cancellingInvite !== null}
        onOpenChange={(open) => {
          if (!open) setCancellingInvite(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Invite</DialogTitle>
            <DialogDescription>
              This will revoke the invitation link.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              Are you sure you want to cancel the invite for{" "}
              <span className="font-semibold">{cancellingInvite?.email}</span>?
              They will no longer be able to use the invitation link to create an
              account.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancellingInvite(null)}
            >
              Keep Invite
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={cancelInviteMutation.isPending}
            >
              {cancelInviteMutation.isPending
                ? "Cancelling..."
                : "Cancel Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
