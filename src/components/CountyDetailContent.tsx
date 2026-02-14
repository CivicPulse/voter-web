import { useState } from "react"
import {
  Lock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Info,
  MapPin,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { CensusProfileCard } from "@/components/CensusProfileCard"
import { CountyDetailMap } from "@/components/CountyDetailMap"
import { useCountyBoundary } from "@/hooks/useCountyBoundary"
import { useBoundaryTypeGeoJSON } from "@/hooks/useBoundaryTypeGeoJSON"
import { useAuthStore } from "@/stores/authStore"

const functionalStatusLabels: Record<string, string> = {
  A: "Active",
  C: "Consolidated",
  N: "Nonfunctioning",
  I: "Inactive",
  F: "Fictitious",
  S: "Statistical",
}

interface CountyDetailContentProps {
  countyId: string
  overlay?: string
}

export function CountyDetailContent({
  countyId,
  overlay,
}: Readonly<CountyDetailContentProps>) {
  const selectedType = overlay ?? null
  const {
    data: county,
    isLoading: isCountyLoading,
    isError,
    error,
  } = useCountyBoundary(countyId)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const { data: overlayData, isLoading: isOverlayLoading } =
    useBoundaryTypeGeoJSON(selectedType, county?.name ?? null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="relative h-full w-full">
      {/* Map renders immediately with tiles; layers appear as data arrives */}
      <div className="relative z-0 h-full w-full">
        <CountyDetailMap
          countyGeometry={county?.geometry ?? null}
          overlayData={overlayData}
          isCountyLoading={isCountyLoading}
          isOverlayLoading={isOverlayLoading}
          className="rounded-none border-0"
        />
      </div>

      {/* Error overlay on map */}
      {isError && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-background/60">
          <div className="flex items-center gap-2 rounded-md bg-background px-4 py-3 text-destructive shadow-md">
            <AlertCircle className="h-5 w-5" />
            <span>
              Failed to load county data
              {error instanceof Error ? `: ${error.message}` : ""}
            </span>
          </div>
        </div>
      )}

      {/* Not-found overlay */}
      {!isCountyLoading && !isError && !county && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-background/60">
          <div className="flex items-center gap-2 rounded-md bg-background px-4 py-3 text-muted-foreground shadow-md">
            <AlertCircle className="h-5 w-5" />
            <span>County not found</span>
          </div>
        </div>
      )}

      {/* Bottom drawer trigger — only show when county data is available */}
      {county && (
        <>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={`Open ${county.name} County details drawer`}
            className="absolute bottom-0 left-0 right-0 z-[1000] flex items-center justify-center gap-2 rounded-t-lg bg-background/95 px-4 py-2 text-sm font-medium shadow-[0_-2px_10px_rgba(0,0,0,0.1)] backdrop-blur-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronUp className="h-4 w-4" />
            County Details
          </button>
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{county.name} County Details</DrawerTitle>
                <DrawerDescription>Swipe down to close</DrawerDescription>
              </DrawerHeader>
              <div className="overflow-y-auto px-4 pb-6 max-h-[60vh] md:max-h-[70vh] space-y-6">
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
                                {county.county_metadata.land_area_km2.toLocaleString()}{" "}
                                km²{" "}
                                <span className="text-muted-foreground">
                                  (
                                  {(
                                    county.county_metadata.land_area_km2 * 0.386102
                                  ).toLocaleString(undefined, {
                                    maximumFractionDigits: 1,
                                  })}{" "}
                                  mi²)
                                </span>
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-muted-foreground">
                                Water Area
                              </dt>
                              <dd className="text-sm">
                                {county.county_metadata.water_area_km2.toLocaleString()}{" "}
                                km²{" "}
                                <span className="text-muted-foreground">
                                  (
                                  {(
                                    county.county_metadata.water_area_km2 * 0.386102
                                  ).toLocaleString(undefined, {
                                    maximumFractionDigits: 1,
                                  })}{" "}
                                  mi²)
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
                                {functionalStatusLabels[
                                  county.county_metadata.functional_status
                                ] ?? county.county_metadata.functional_status}
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

                {county.county_metadata && (
                  <CensusProfileCard
                    fipsState={county.county_metadata.fips_state}
                    fipsCounty={county.county_metadata.fips_county}
                    countyName={county.name}
                  />
                )}

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
                      <p className="text-sm font-medium">
                        Sign in to view voter data
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Voter registration data, analysis, and exports require
                        authentication.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
              {/* Close bar at bottom of drawer */}
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label={`Close ${county.name} County details drawer`}
                className="flex shrink-0 items-center justify-center gap-2 border-t bg-background/95 px-4 py-2 text-sm font-medium transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronDown className="h-4 w-4" />
                County Details
              </button>
            </DrawerContent>
          </Drawer>
        </>
      )}
    </div>
  )
}
