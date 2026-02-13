import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { AlertCircle, ChevronUp, Loader2 } from "lucide-react"
import { GeorgiaCountyMap } from "@/components/GeorgiaCountyMap"
import { useCountyBoundaries } from "@/hooks/useCountyBoundaries"
import { StateCensusProfileCard } from "@/components/StateCensusProfileCard"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

export const Route = createFileRoute("/")({
  component: Index,
})

function Index() {
  const { data, isLoading, isError, error } = useCountyBoundaries()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="relative h-full w-full">
      {/* Full-screen map */}
      <div className="relative z-0 h-full w-full">
        {isLoading && (
          <div className="flex h-full items-center justify-center bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading county boundaries…</span>
            </div>
          </div>
        )}

        {isError && (
          <div className="flex h-full items-center justify-center bg-destructive/10">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>
                Failed to load county data
                {error instanceof Error ? `: ${error.message}` : ""}
              </span>
            </div>
          </div>
        )}

        {data && (
          <GeorgiaCountyMap
            data={data}
            className="rounded-none border-0"
          />
        )}
      </div>

      {/* Bottom drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerTrigger asChild>
          <button
            type="button"
            aria-label="Open state demographics drawer"
            className="absolute bottom-0 left-0 right-0 z-[1000] flex items-center justify-center gap-2 rounded-t-lg bg-background/95 px-4 py-2 text-sm font-medium shadow-[0_-2px_10px_rgba(0,0,0,0.1)] backdrop-blur-sm transition-colors hover:bg-accent"
          >
            <ChevronUp className="h-4 w-4" />
            State Demographics
          </button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Georgia State Demographics</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6 max-h-[60vh] sm:max-h-[70vh]">
            <StateCensusProfileCard fipsState="13" stateName="Georgia" />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
