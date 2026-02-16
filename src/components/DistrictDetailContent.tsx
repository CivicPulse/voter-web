import { useState, useMemo } from "react"
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { DistrictDetailMap } from "@/components/DistrictDetailMap"
import { ActiveElectionBanner } from "@/components/ActiveElectionBanner"
import { ElectedOfficialsCard } from "@/components/ElectedOfficialsCard"
import { useCountyBoundary } from "@/hooks/useCountyBoundary"
import { useCountyBoundaries } from "@/hooks/useCountyBoundaries"
import {
  useActiveElections,
  electionsForDistrict,
} from "@/lib/hooks/use-active-elections"

const boundaryTypeLabels: Record<string, string> = {
  congressional: "Congressional District",
  state_senate: "State Senate District",
  state_house: "State House District",
  psc: "Public Service Commission District",
}

interface DistrictDetailContentProps {
  districtId: string
}

export function DistrictDetailContent({
  districtId,
}: Readonly<DistrictDetailContentProps>) {
  const {
    data: district,
    isLoading: isDistrictLoading,
    isError,
    error,
  } = useCountyBoundary(districtId)
  const { data: counties, isLoading: isCountiesLoading } =
    useCountyBoundaries()
  const { data: activeElections } = useActiveElections()
  const matchingElections = useMemo(
    () =>
      district && activeElections
        ? electionsForDistrict(activeElections, district.name)
        : [],
    [district, activeElections],
  )
  const [drawerOpen, setDrawerOpen] = useState(false)

  const typeLabel = district
    ? (boundaryTypeLabels[district.boundary_type] ??
      district.boundary_type.replaceAll("_", " "))
    : ""

  return (
    <div className="relative h-full w-full">
      {/* Map renders immediately with tiles; layers appear as data arrives */}
      <div className="relative z-0 h-full w-full">
        <DistrictDetailMap
          districtGeometry={district?.geometry ?? null}
          counties={counties ?? null}
          isDistrictLoading={isDistrictLoading}
          isCountiesLoading={isCountiesLoading}
          className="rounded-none border-0"
        />
      </div>

      {/* Error overlay on map */}
      {isError && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-background/60">
          <div className="flex items-center gap-2 rounded-md bg-background px-4 py-3 text-destructive shadow-md">
            <AlertCircle className="h-5 w-5" />
            <span>
              Failed to load district data
              {error instanceof Error ? `: ${error.message}` : ""}
            </span>
          </div>
        </div>
      )}

      {/* Not-found overlay */}
      {!isDistrictLoading && !isError && !district && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-background/60">
          <div className="flex items-center gap-2 rounded-md bg-background px-4 py-3 text-muted-foreground shadow-md">
            <AlertCircle className="h-5 w-5" />
            <span>District not found</span>
          </div>
        </div>
      )}

      {/* Active election banner — floating on map */}
      {matchingElections.length > 0 && (
        <div className="absolute left-3 right-3 top-3 z-[1000] sm:left-auto sm:right-3 sm:max-w-sm">
          <ActiveElectionBanner elections={matchingElections} className="space-y-2" />
        </div>
      )}

      {/* Bottom drawer trigger — only show when district data is available */}
      {district && (
        <>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={`Open ${district.name} details drawer`}
            className="absolute bottom-0 left-0 right-0 z-[1000] flex items-center justify-center gap-2 rounded-t-lg bg-background/95 px-4 py-2 text-sm font-medium shadow-[0_-2px_10px_rgba(0,0,0,0.1)] backdrop-blur-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronUp className="h-4 w-4" />
            District Details
          </button>
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{district.name} Details</DrawerTitle>
                <DrawerDescription>Swipe down to close</DrawerDescription>
              </DrawerHeader>
              <div className="overflow-y-auto px-4 pb-6 max-h-[60vh] md:max-h-[70vh] space-y-6">
                {matchingElections.length > 0 && (
                  <ActiveElectionBanner elections={matchingElections} className="space-y-2" />
                )}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      District Information
                    </CardTitle>
                    <CardDescription>Public boundary data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">
                          Name
                        </dt>
                        <dd className="text-sm">{district.name}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">
                          Type
                        </dt>
                        <dd className="text-sm capitalize">{typeLabel}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">
                          Boundary Identifier
                        </dt>
                        <dd className="font-mono text-sm">
                          {district.boundary_identifier}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">
                          Source
                        </dt>
                        <dd className="text-sm">{district.source}</dd>
                      </div>
                      {district.effective_date && (
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">
                            Effective Date
                          </dt>
                          <dd className="text-sm">{district.effective_date}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">
                          Created At
                        </dt>
                        <dd className="text-sm">
                          {new Date(district.created_at).toLocaleDateString()}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
                <ElectedOfficialsCard
                  boundaryType={district.boundary_type}
                  districtIdentifier={district.boundary_identifier}
                />
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label={`Close ${district.name} details drawer`}
                className="flex shrink-0 items-center justify-center gap-2 border-t bg-background/95 px-4 py-2 text-sm font-medium transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronDown className="h-4 w-4" />
                District Details
              </button>
            </DrawerContent>
          </Drawer>
        </>
      )}
    </div>
  )
}
