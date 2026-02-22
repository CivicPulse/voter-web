import { createFileRoute, Link } from "@tanstack/react-router"
import { useAdminUsers, useUpdateUser, useDeleteUser } from "@/lib/hooks/use-admin-users"
import { useApiCapabilities } from "@/lib/hooks/use-api-capabilities"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  DropdownMenuSeparator,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Users, Plus, MoreHorizontal } from "lucide-react"
import type { AdminUser } from "@/types/admin"
import { AdminErrorBoundary } from "@/components/admin-error-boundary"
import { Skeleton } from "@/components/ui/skeleton"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { editUserSchema, type EditUserFormValues } from "@/lib/schemas/user-form"

export const Route = createFileRoute("/admin/users/")({
  component: () => (
    <AdminErrorBoundary>
      <UserManagementPage />
    </AdminErrorBoundary>
  ),
})

function UserManagementPage() {
  const { data, isLoading, error } = useAdminUsers()

  // TODO: Remove capability guard once voter-api adds PATCH/DELETE /users/{user_id}
  const { canEditUser, canDeleteUser, isLoading: capabilitiesLoading } = useApiCapabilities()

  const updateUserMutation = useUpdateUser()
  const deleteUserMutation = useDeleteUser()

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)
  const [showEditConfirm, setShowEditConfirm] = useState(false)
  const [pendingEditData, setPendingEditData] = useState<EditUserFormValues | null>(null)

  const editForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { email: "", role: "viewer", is_active: true },
  })

  const openEditDialog = (user: AdminUser) => {
    setEditingUser(user)
    editForm.reset({ email: user.email, role: user.role, is_active: user.is_active })
  }

  const handleEditSubmit = (data: EditUserFormValues) => {
    if (data.role === "admin" || data.role === "analyst") {
      setPendingEditData(data)
      setShowEditConfirm(true)
    } else {
      submitEdit(data)
    }
  }

  const submitEdit = (data: EditUserFormValues) => {
    if (!editingUser) return
    updateUserMutation.mutate(
      { id: editingUser.id, data },
      {
        onSuccess: () => {
          setEditingUser(null)
          setPendingEditData(null)
          setShowEditConfirm(false)
        },
      }
    )
  }

  const handleEditConfirm = () => {
    if (pendingEditData) {
      submitEdit(pendingEditData)
    }
  }

  const handleSuspendToggle = (user: AdminUser) => {
    updateUserMutation.mutate({ id: user.id, data: { is_active: !user.is_active } })
  }

  const handleDelete = () => {
    if (!deletingUser) return
    deleteUserMutation.mutate(deletingUser.id, {
      onSuccess: () => setDeletingUser(null),
    })
  }

  const showActionsColumn = canEditUser || canDeleteUser

  if (isLoading || capabilitiesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="border rounded-lg p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-6 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <div className="border border-destructive rounded-lg p-6 text-center">
          <p className="text-destructive">
            Failed to load users: {error.message}
          </p>
        </div>
      </div>
    )
  }

  const users = data?.items ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/users/create">
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </Link>
        </Button>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No users yet"
          description="Create your first user to get started with user management."
          action={{
            label: "Create User",
            onClick: () => {
              window.location.href = "/admin/users/create"
            },
          }}
        />
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Login</TableHead>
                {showActionsColumn && (
                  <TableHead className="w-12" />
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: AdminUser) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === "admin"
                          ? "destructive"
                          : user.role === "analyst"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? "default" : "outline"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.last_login_at
                      ? new Date(user.last_login_at).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  {showActionsColumn && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="User actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEditUser && (
                            <>
                              <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleSuspendToggle(user)}
                              >
                                {user.is_active ? "Suspend" : "Reactivate"}
                              </DropdownMenuItem>
                            </>
                          )}
                          {canEditUser && canDeleteUser && (
                            <DropdownMenuSeparator />
                          )}
                          {canDeleteUser && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeletingUser(user)}
                            >
                              Delete User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit User Dialog */}
      <Dialog
        open={editingUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUser(null)
            setShowEditConfirm(false)
            setPendingEditData(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update account details for{" "}
              <span className="font-semibold">{editingUser?.username}</span>.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleEditSubmit)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="analyst">Analyst</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Admin and Analyst roles have elevated access.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active Account</FormLabel>
                      <FormDescription>
                        User can log in and access the system
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Elevated role confirmation dialog */}
      <Dialog
        open={showEditConfirm}
        onOpenChange={(open) => {
          if (!open) {
            setShowEditConfirm(false)
            setPendingEditData(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Elevated Role</DialogTitle>
            <DialogDescription>
              You are assigning elevated permissions to this user.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              Setting{" "}
              <span className="font-semibold">{editingUser?.username}</span>'s role
              to{" "}
              <span className="font-semibold uppercase">
                {pendingEditData?.role}
              </span>
              .
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {pendingEditData?.role === "admin"
                ? "Admins have full system access including user management."
                : "Analysts can access admin features but cannot manage users."}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditConfirm(false)
                setPendingEditData(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditConfirm} disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? "Saving..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog
        open={deletingUser !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingUser(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deletingUser?.username}</span>?
              This will permanently remove this user and revoke their access.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingUser(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
