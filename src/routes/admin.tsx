import { createFileRoute, Outlet } from "@tanstack/react-router"
import { useUserRole } from "@/lib/hooks/use-user-role"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"
import { PermissionErrorComponent } from "@/components/permission-error"
import { AuthenticationError, PermissionError } from "@/types/admin"

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
})

function AdminLayout() {
  const { data: user, isLoading, error } = useUserRole()

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  // Handle authentication and permission errors
  if (error) {
    if (
      error instanceof AuthenticationError ||
      error instanceof PermissionError
    ) {
      return <PermissionErrorComponent error={error} />
    }

    // Generic error fallback
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Error Loading Admin Panel</AlertTitle>
          <AlertDescription>
            <p className="mb-4">
              {error instanceof Error ? error.message : "An unexpected error occurred"}
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Check if user has admin or analyst role
  const isAdmin = user?.role === "admin" || user?.role === "analyst"

  if (!user || !isAdmin) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access this page. Admin or analyst
            role is required.
          </AlertDescription>
        </Alert>
        <div className="mt-6 flex gap-4">
          <Button
            onClick={() => (window.location.href = "/")}
            variant="outline"
          >
            Go Home
          </Button>
          <Button onClick={() => (window.location.href = "/login")}>
            Log In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <Outlet />
    </div>
  )
}
