import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Lock, Loader2, AlertCircle, Info, MapPin } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCountyBoundary } from "@/hooks/useCountyBoundary"
import { useAuthStore } from "@/stores/authStore"

export const Route = createFileRoute("/counties/$countyId")({
  component: CountyDetailPage,
})

function CountyDetailPage() {
  const { countyId } = Route.useParams()
  const { data: county, isLoading, isError, error } = useCountyBoundary(countyId)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading county data…</span>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>
            Failed to load county data
            {error instanceof Error ? `: ${error.message}` : ""}
          </span>
        </div>
      </div>
    )
  }

  if (!county) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertCircle className="h-5 w-5" />
          <span>County not found</span>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Map
        </Link>
      </Button>

      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">{county.name} County</h1>
        <Badge variant="secondary">{county.boundary_type}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            County Information
          </CardTitle>
          <CardDescription>Public boundary data</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Name
              </dt>
              <dd className="text-sm">{county.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Boundary Identifier
              </dt>
              <dd className="font-mono text-sm">
                {county.boundary_identifier}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Boundary Type
              </dt>
              <dd className="text-sm">{county.boundary_type}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Source
              </dt>
              <dd className="text-sm">{county.source}</dd>
            </div>
            {county.county && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  County
                </dt>
                <dd className="text-sm">{county.county}</dd>
              </div>
            )}
            {county.effective_date && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Effective Date
                </dt>
                <dd className="text-sm">{county.effective_date}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Created At
              </dt>
              <dd className="text-sm">
                {new Date(county.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Separator />

      {isAuthenticated ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Voter Data
              </CardTitle>
              <CardDescription>
                Registered voter information for {county.name} County
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Voter data will appear here.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analysis</CardTitle>
              <CardDescription>
                Analytical data for {county.name} County
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Analysis data will appear here.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Lock className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Sign in to view voter data</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Voter registration data, analysis, and exports require
              authentication.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
