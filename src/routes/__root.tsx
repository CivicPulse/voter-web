import {
  createRootRoute,
  Link,
  Outlet,
  useMatch,
  useNavigate,
} from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { useEffect } from "react"
import { Loader2, LogIn, LogOut, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LayerBar } from "@/components/LayerBar"
import { useAuthStore } from "@/stores/authStore"
import { useCountyBoundary } from "@/hooks/useCountyBoundary"
import { useBoundaryTypes } from "@/hooks/useBoundaryTypes"
import { useBoundaryTypeGeoJSON } from "@/hooks/useBoundaryTypeGeoJSON"

function RootLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const initialize = useAuthStore((state) => state.initialize)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  // Route detection
  const countyMatch = useMatch({
    from: "/counties/$countyId",
    shouldThrow: false,
  })
  const homeMatch = useMatch({ from: "/", shouldThrow: false })
  const lookupMatch = useMatch({ from: "/lookup/", shouldThrow: false })
  const lookupResultsMatch = useMatch({
    from: "/lookup/results",
    shouldThrow: false,
  })

  // County data hooks (enabled guards prevent fetches when not on county route)
  const countyId = countyMatch?.params?.countyId ?? ""
  const { data: county } = useCountyBoundary(countyId)

  const overlay = (countyMatch?.search as { overlay?: string } | undefined)
    ?.overlay
  const selectedType = overlay ?? null

  const { data: boundaryTypes, isLoading: isTypesLoading } =
    useBoundaryTypes()
  const { data: overlayData, isLoading: isOverlayLoading } =
    useBoundaryTypeGeoJSON(selectedType, county?.name ?? null)

  // Determine header title
  let headerTitle: string | null = null
  if (countyMatch && county) {
    headerTitle = `${county.name} County`
  } else if (lookupMatch || lookupResultsMatch) {
    headerTitle = "Address Lookup"
  } else if (homeMatch) {
    headerTitle = "Voter Web"
  }

  // Layer bar type change callback
  const handleTypeChange = (type: string | undefined) => {
    navigate({
      to: "/counties/$countyId",
      params: { countyId },
      search: { overlay: type },
      replace: true,
    })
  }

  useEffect(() => {
    initialize()
  }, [initialize])

  const handleLogout = () => {
    logout()
    navigate({ to: "/" })
  }

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-svh flex flex-col overflow-hidden bg-background text-foreground">
      <header className="flex-none bg-background z-50">
        {/* Row 1: Primary nav */}
        <nav className="border-b px-4 py-2 flex items-center">
          <div className="flex-1 flex gap-4 min-w-0">
            <Link to="/" className="[&.active]:font-bold shrink-0">
              Home
            </Link>
            {isAuthenticated && (
              <Link
                to="/lookup"
                className="[&.active]:font-bold shrink-0"
                aria-label="Address lookup"
              >
                <Search className="h-4 w-4" />
              </Link>
            )}
          </div>

          {headerTitle && (
            <h1 className="text-lg font-bold truncate px-4 text-center">
              {headerTitle}
            </h1>
          )}

          <div className="flex-1 flex items-center justify-end gap-3 min-w-0">
            {isAuthenticated && user ? (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{user.username}</span>
                  <span className="text-xs uppercase text-muted-foreground/70">
                    ({user.role})
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </nav>

        {/* Row 2: Layer controls (county detail pages only) */}
        {countyMatch && county?.geometry && (
          <LayerBar
            boundaryTypes={boundaryTypes}
            isTypesLoading={isTypesLoading}
            selectedType={selectedType}
            onTypeChange={handleTypeChange}
            overlayFeatureCount={
              selectedType && overlayData && !isOverlayLoading
                ? overlayData.features.length
                : null
            }
            countyName={county.name}
          />
        )}
      </header>
      <main className="flex-1 min-h-0">
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </div>
  )
}

export const Route = createRootRoute({ component: RootLayout })
