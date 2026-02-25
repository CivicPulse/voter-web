import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  inviteUserSchema,
  type InviteUserFormValues,
} from "@/lib/schemas/user-form"
import { useCreateInvite } from "@/lib/hooks/use-invites"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface InviteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteUserDialog({ open, onOpenChange }: InviteUserDialogProps) {
  const createInviteMutation = useCreateInvite()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingData, setPendingData] = useState<InviteUserFormValues | null>(
    null
  )

  const form = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: "",
      role: "viewer",
    },
  })

  const handleFormSubmit = (data: InviteUserFormValues) => {
    if (data.role === "admin" || data.role === "analyst") {
      setPendingData(data)
      setShowConfirmDialog(true)
    } else {
      submitInvite(data)
    }
  }

  const submitInvite = (data: InviteUserFormValues) => {
    createInviteMutation.mutate(data, {
      onSuccess: () => {
        form.reset()
        setPendingData(null)
        setShowConfirmDialog(false)
        onOpenChange(false)
      },
    })
  }

  const handleConfirm = () => {
    if (pendingData) {
      submitInvite(pendingData)
    }
  }

  const handleCancel = () => {
    setShowConfirmDialog(false)
    setPendingData(null)
  }

  const handleDialogClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset()
      setPendingData(null)
      setShowConfirmDialog(false)
    }
    onOpenChange(nextOpen)
  }

  return (
    <>
      <Dialog open={open && !showConfirmDialog} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Send an invitation email to create a new account.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleFormSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      An invitation link will be sent to this address.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="analyst">Analyst</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      User's permission level (Admin and Analyst have elevated
                      access)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogClose(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createInviteMutation.isPending}
                >
                  {createInviteMutation.isPending
                    ? "Sending..."
                    : "Send Invite"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Elevated role confirmation dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={(nextOpen) => {
        if (!nextOpen) handleCancel()
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Elevated Role</DialogTitle>
            <DialogDescription>
              You are inviting a user with elevated permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              Inviting{" "}
              <span className="font-semibold">{pendingData?.email}</span> with
              role:{" "}
              <span className="font-semibold uppercase">
                {pendingData?.role}
              </span>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {pendingData?.role === "admin"
                ? "Admins have full system access including user management."
                : "Analysts can access admin features but cannot manage users."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={createInviteMutation.isPending}
            >
              {createInviteMutation.isPending ? "Sending..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
