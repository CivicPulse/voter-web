import { createFileRoute, Link } from "@tanstack/react-router"
import { z } from "zod"
import {
  ArrowLeft,
  Lock,
  Loader2,
  AlertCircle,
  Info,
  Layers,
  MapPin,
} from "lucide-react"
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { CountyDetailMap } from "@/components/CountyDetailMap"
import { useCountyBoundary } from "@/hooks/useCountyBoundary"
import { useBoundaryTypes } from "@/hooks/useBoundaryTypes"
import { useBoundaryTypeGeoJSON } from "@/hooks/useBoundaryTypeGeoJSON"
import { useAuthStore } from "@/stores/authStore"

const countySearchSchema = z.object({
  overlay: z.string().optional().catch(undefined),
})

export const Route = createFileRoute("/counties/$countyId")({
  component: CountyDetailPage,
  validateSearch: countySearchSchema,
})

const functionalStatusLabels: Record<string, string> = {
  A: "Active",
  C: "Consolidated",
  N: "Nonfunctioning",
  I: "Inactive",
  F: "Fictitious",
  S: "Statistical",
}

function CountyDetailPage() {
  const { countyId } = Route.useParams()
  const { overlay } = Route.useSearch()
  const selectedType = overlay ?? null
  const navigate = Route.useNavigate()
  const { data: county, isLoading, isError, error } = useCountyBoundary(countyId)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const { data: boundaryTypes, isLoading: isTypesLoading } =
    useBoundaryTypes()
  const { data: overlayData, isLoading: isOverlayLoading } =
    useBoundaryTypeGeoJSON(selectedType, county?.name ?? null)

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

      {county.geometry && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              County Map
            </CardTitle>
            <CardDescription>
              Boundary visualization with optional district overlays
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">District Overlays</span>
              </div>
              {isTypesLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading available types…
                </div>
              ) : boundaryTypes && boundaryTypes.length > 0 ? (
                <ToggleGroup
                  type="single"
                  value={selectedType ?? ""}
                  onValueChange={(value) =>
                    navigate({
                      search: (prev) => ({
                        ...prev,
                        overlay: value === "" ? undefined : value,
                      }),
                      replace: true,
                    })
                  }
                  className="flex flex-wrap justify-start"
                >
                  {boundaryTypes.map((type) => (
                    <ToggleGroupItem
                      key={type}
                      value={type}
                      className="text-xs capitalize"
                    >
                      {type.replaceAll("_", " ")}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              ) : null}
            </div>

            <CountyDetailMap
              countyGeometry={county.geometry}
              overlayData={overlayData}
              isOverlayLoading={isOverlayLoading}
            />

            {selectedType &&
              overlayData &&
              !isOverlayLoading &&
              overlayData.features.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Showing {overlayData.features.length}{" "}
                  {selectedType.replaceAll("_", " ")} district
                  {overlayData.features.length === 1 ? "" : "s"} intersecting{" "}
                  {county.name} County
                </p>
              )}
            {selectedType &&
              overlayData &&
              !isOverlayLoading &&
              overlayData.features.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No {selectedType.replaceAll("_", " ")} districts found
                  intersecting {county.name} County
                </p>
              )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            County Information
          </CardTitle>
          <CardDescription>Public boundary data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

          {county.county_metadata && (
            <>
              <Separator />
              <div>
                <h3 className="mb-3 text-sm font-semibold">
                  Geographic Details
                </h3>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Full Name
                    </dt>
                    <dd className="text-sm">
                      {county.county_metadata.name_lsad}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      FIPS Code
                    </dt>
                    <dd className="font-mono text-sm">
                      {county.county_metadata.fips_state}
                      {county.county_metadata.fips_county}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      GEOID
                    </dt>
                    <dd className="font-mono text-sm">
                      {county.county_metadata.geoid}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Land Area
                    </dt>
                    <dd className="text-sm">
                      {county.county_metadata.land_area_km2.toLocaleString()} km²
                      {" "}
                      <span className="text-muted-foreground">
                        ({(county.county_metadata.land_area_km2 * 0.386102).toLocaleString(undefined, { maximumFractionDigits: 1 })} mi²)
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Water Area
                    </dt>
                    <dd className="text-sm">
                      {county.county_metadata.water_area_km2.toLocaleString()} km²
                      {" "}
                      <span className="text-muted-foreground">
                        ({(county.county_metadata.water_area_km2 * 0.386102).toLocaleString(undefined, { maximumFractionDigits: 1 })} mi²)
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Internal Point
                    </dt>
                    <dd className="font-mono text-sm">
                      {county.county_metadata.internal_point_lat},{" "}
                      {county.county_metadata.internal_point_lon}
                    </dd>
                  </div>
                  {county.county_metadata.cbsa_code && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        CBSA Code
                      </dt>
                      <dd className="font-mono text-sm">
                        {county.county_metadata.cbsa_code}
                      </dd>
                    </div>
                  )}
                  {county.county_metadata.csa_code && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        CSA Code
                      </dt>
                      <dd className="font-mono text-sm">
                        {county.county_metadata.csa_code}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Functional Status
                    </dt>
                    <dd className="text-sm">
                      {functionalStatusLabels[county.county_metadata.functional_status] ?? county.county_metadata.functional_status}
                    </dd>
                  </div>
                  {county.county_metadata.gnis_code && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        GNIS Code
                      </dt>
                      <dd className="font-mono text-sm">
                        {county.county_metadata.gnis_code}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </>
          )}
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
