import { createFileRoute, Link } from "@tanstack/react-router"
import { useAdminElections } from "@/lib/hooks/use-admin-elections"
import { AdminErrorBoundary } from "@/components/admin-error-boundary"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Vote, Plus, FileDown } from "lucide-react"
import { ElectionTable } from "./_components/election-table"

export const Route = createFileRoute("/admin/elections/")({
  component: () => (
    <AdminErrorBoundary>
      <AdminElectionsPage />
    </AdminErrorBoundary>
  ),
})

function AdminElectionsPage() {
  const { data, isLoading, error } = useAdminElections()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="border rounded-lg p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-32" />
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
          <h1 className="text-3xl font-bold mb-2">Election Management</h1>
          <p className="text-muted-foreground">
            Manage elections and race configurations
          </p>
        </div>
        <div className="border border-destructive rounded-lg p-6 text-center">
          <p className="text-destructive">
            Failed to load elections: {error.message}
          </p>
        </div>
      </div>
    )
  }

  const elections = data?.elections ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Election Management</h1>
          <p className="text-muted-foreground">
            Manage elections and race configurations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/admin/elections/import-feed">
              <FileDown className="h-4 w-4 mr-2" />
              Import Feed
            </Link>
          </Button>
          <Button asChild>
            <Link to="/admin/elections/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Election
            </Link>
          </Button>
        </div>
      </div>

      {elections.length === 0 ? (
        <EmptyState
          icon={<Vote className="h-12 w-12" />}
          title="No elections yet"
          description="Create your first election to start managing race results."
          action={{
            label: "Create Election",
            onClick: () => {
              window.location.href = "/admin/elections/create"
            },
          }}
        />
      ) : (
        <ElectionTable elections={elections} />
      )}
    </div>
  )
}
