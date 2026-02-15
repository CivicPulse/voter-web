import { createFileRoute } from "@tanstack/react-router"
import { Users } from "lucide-react"

export const Route = createFileRoute("/admin/users/")({
  component: UserManagementPage,
})

function UserManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts and permissions
        </p>
      </div>

      <div className="border rounded-lg p-12 text-center">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
        <p className="text-sm text-muted-foreground">
          User management interface will be implemented in Phase 4
        </p>
      </div>
    </div>
  )
}
