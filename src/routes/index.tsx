import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { GeorgiaCountyMap } from "@/components/GeorgiaCountyMap"
import { useCountyBoundaries } from "@/hooks/useCountyBoundaries"
import { useBoundaryTypeGeoJSON } from "@/hooks/useBoundaryTypeGeoJSON"
import { StateCensusProfileCard } from "@/components/StateCensusProfileCard"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

const homeSearchSchema = z.object({
  overlay: z
    .enum(["congressional", "psc", "state_house", "state_senate"])
    .optional()
    .catch(undefined),
})

export const Route = createFileRoute("/")({
  component: Index,
  validateSearch: homeSearchSchema,
})

function Index() {
  const { overlay } = Route.useSearch()
  const { data, isLoading: isCountiesLoading, isError, error } =
    useCountyBoundaries()
  const { data: overlayData, isLoading: isOverlayLoading } =
    useBoundaryTypeGeoJSON(overlay ?? null, null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="relative h-full w-full">
      {/* Map renders immediately with tiles; layers appear as data arrives */}
      <div className="relative z-0 h-full w-full">
        <GeorgiaCountyMap
          data={data ?? null}
          overlayData={overlayData}
          isCountiesLoading={isCountiesLoading}
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

      {/* Bottom drawer open trigger */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-label="Open state demographics drawer"
        className="absolute bottom-0 left-0 right-0 z-[1000] flex items-center justify-center gap-2 rounded-t-lg bg-background/95 px-4 py-2 text-sm font-medium shadow-[0_-2px_10px_rgba(0,0,0,0.1)] backdrop-blur-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronUp className="h-4 w-4" />
        State Demographics
      </button>
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Georgia State Demographics</DrawerTitle>
            <DrawerDescription>
              Swipe down to close
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6 max-h-[60vh] sm:max-h-[70vh]">
            <StateCensusProfileCard fipsState="13" stateName="Georgia" />
          </div>
          {/* Close bar at bottom of drawer — mirrors the open trigger */}
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close state demographics drawer"
            className="flex shrink-0 items-center justify-center gap-2 border-t bg-background/95 px-4 py-2 text-sm font-medium transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronDown className="h-4 w-4" />
            State Demographics
          </button>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
