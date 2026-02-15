import { createFileRoute, Link } from "@tanstack/react-router"
import { Users, Upload, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/admin/")({
  component: AdminIndexPage,
})

function AdminIndexPage() {
  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage users, import data, and generate exports
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* User Management Card */}
        <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Users className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold">User Management</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Create and manage user accounts with role-based permissions
          </p>
          <Button asChild className="w-full">
            <Link to="/admin/users">Manage Users</Link>
          </Button>
        </div>

        {/* Imports Card */}
        <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-100 text-green-600">
              <Upload className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold">Imports</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Upload voter data (CSV) and boundary files (GeoJSON, Shapefile)
          </p>
          <Button asChild className="w-full">
            <Link to="/admin/imports">View Imports</Link>
          </Button>
        </div>

        {/* Exports Card */}
        <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
              <Download className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold">Exports</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Generate and download bulk data exports for analysis
          </p>
          <Button asChild className="w-full">
            <Link to="/admin/exports">View Exports</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
