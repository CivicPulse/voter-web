import { useMemo, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { AlertCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { StateCountyMap } from "@/components/StateCountyMap"
import { StateSelectionPage } from "@/components/StateSelectionPage"
import { ActiveElectionBanner } from "@/components/ActiveElectionBanner"
import { useCountyBoundaries } from "@/hooks/useCountyBoundaries"
import { useAvailableStates } from "@/hooks/useAvailableStates"
import { useBoundaryTypeGeoJSON } from "@/hooks/useBoundaryTypeGeoJSON"
import { useActiveElections } from "@/lib/hooks/use-active-elections"
import { useElectedOfficialsByBoundaryType } from "@/lib/hooks/use-elected-officials"
import { ElectedOfficialsCard } from "@/components/ElectedOfficialsCard"
import { StateCensusProfileCard } from "@/components/StateCensusProfileCard"
import { ABBREV_TO_NAME } from "@/lib/states"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

const homeSearchSchema = z.object({
  overlay: z.string().optional().catch(undefined),
})

export const Route = createFileRoute("/")({
  component: Index,
  validateSearch: homeSearchSchema,
})

function Index() {
  const { overlay } = Route.useSearch()
  const {
    states,
    isLoading: isStatesLoading,
    isSingleState,
    defaultState,
  } = useAvailableStates()
  const { data: allCounties, isLoading: isCountiesLoading, isError, error } =
    useCountyBoundaries()
  const { data: overlayData, isLoading: isOverlayLoading } =
    useBoundaryTypeGeoJSON(overlay ?? null, null)
  const { data: activeElections } = useActiveElections()
  const { data: electedOfficials } = useElectedOfficialsByBoundaryType(
    overlay ?? null,
  )
  const [drawerOpen, setDrawerOpen] = useState(false)

  const stateCounties = useMemo(() => {
    if (!allCounties || !defaultState) return allCounties ?? null
    return {
      ...allCounties,
      features: allCounties.features.filter(
        (f) =>
          f.properties.boundary_identifier.slice(0, 2) === defaultState.fipsCode,
      ),
    }
  }, [allCounties, defaultState])

  if (isStatesLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading…</span>
        </div>
      </div>
    )
  }

  if (!isSingleState && states.length > 1) {
    return <StateSelectionPage states={states} />
  }

  const stateName = defaultState
    ? (ABBREV_TO_NAME[defaultState.abbreviation] ?? defaultState.abbreviation.toUpperCase())
    : "State"
  const stateAbbrevUpper = defaultState?.abbreviation.toUpperCase() ?? ""
  const stateFips = defaultState?.fipsCode ?? ""

  return (
    <div className="relative h-full w-full">
      <div className="relative z-0 h-full w-full">
        <StateCountyMap
          data={stateCounties}
          overlayData={overlayData}
          activeElections={activeElections}
          electedOfficials={electedOfficials}
          isCountiesLoading={isCountiesLoading}
          isOverlayLoading={isOverlayLoading}
          className="rounded-none border-0"
        />
      </div>

      {activeElections && activeElections.length > 0 && (
        <div className="absolute left-3 right-3 top-3 z-40 sm:left-auto sm:right-3 sm:max-w-sm">
          <ActiveElectionBanner elections={activeElections} className="space-y-2" />
        </div>
      )}

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

      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label={`Open ${stateName} details drawer`}
        className="absolute bottom-0 left-0 right-0 z-[1000] flex items-center justify-center gap-2 rounded-t-lg bg-background/95 px-4 py-2 text-sm font-medium shadow-[0_-2px_10px_rgba(0,0,0,0.1)] backdrop-blur-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronUp className="h-4 w-4" />
        State Details
      </button>
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{stateName} State Details</DrawerTitle>
            <DrawerDescription>
              Swipe down to close
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6 max-h-[60vh] sm:max-h-[70vh] space-y-6">
            <ElectedOfficialsCard
              boundaryType="us_senate"
              districtIdentifier={stateAbbrevUpper}
            />
            <StateCensusProfileCard fipsState={stateFips} stateName={stateName} />
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label={`Close ${stateName} details drawer`}
            className="flex shrink-0 items-center justify-center gap-2 border-t bg-background/95 px-4 py-2 text-sm font-medium transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronDown className="h-4 w-4" />
            State Details
          </button>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
