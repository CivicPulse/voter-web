import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useCreateUser } from "@/lib/hooks/use-admin-users"
import { createUserSchema, type CreateUserFormValues } from "@/lib/schemas/user-form"
import { AdminErrorBoundary } from "@/components/admin-error-boundary"
import { Button } from "@/components/ui/button"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

export const Route = createFileRoute("/admin/users/create")({
  component: () => (
    <AdminErrorBoundary>
      <CreateUserPage />
    </AdminErrorBoundary>
  ),
})

function CreateUserPage() {
  const navigate = useNavigate()
  const createUserMutation = useCreateUser()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingData, setPendingData] = useState<CreateUserFormValues | null>(null)

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "viewer",
      is_active: true,
    },
  })

  const handleFormSubmit = (data: CreateUserFormValues) => {
    // Show confirmation dialog if creating admin or analyst
    if (data.role === "admin" || data.role === "analyst") {
      setPendingData(data)
      setShowConfirmDialog(true)
    } else {
      // Direct submission for viewer role
      submitUser(data)
    }
  }

  const submitUser = (data: CreateUserFormValues) => {
    // Remove confirmPassword before sending to API
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword: _confirmPassword, ...userData } = data

    createUserMutation.mutate(userData, {
      onSuccess: () => {
        navigate({ to: "/admin/users" })
      },
    })
  }

  const handleConfirm = () => {
    if (pendingData) {
      submitUser(pendingData)
      setShowConfirmDialog(false)
      setPendingData(null)
    }
  }

  const handleCancel = () => {
    setShowConfirmDialog(false)
    setPendingData(null)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/admin/users" })}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        <h1 className="text-3xl font-bold mb-2">Create User</h1>
        <p className="text-muted-foreground">
          Add a new user account with role-based permissions
        </p>
      </div>

      {createUserMutation.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to create user: {createUserMutation.error.message}
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="john_doe" {...field} />
                </FormControl>
                <FormDescription>
                  3-50 characters, letters, numbers, and underscores only
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} />
                </FormControl>
                <FormDescription>User's email address</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormDescription>
                  Minimum 8 characters, must include letters and numbers
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormDescription>Re-enter password to confirm</FormDescription>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  User's permission level (Admin and Analyst have elevated access)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
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

          <div className="flex gap-3">
            <Button type="submit" disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? "Creating..." : "Create User"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/admin/users" })}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Elevated Role</DialogTitle>
            <DialogDescription>
              You are creating a user with elevated permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              Creating user <span className="font-semibold">{pendingData?.username}</span>{" "}
              with role:{" "}
              <span className="font-semibold uppercase">{pendingData?.role}</span>
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
            <Button onClick={handleConfirm} disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? "Creating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
