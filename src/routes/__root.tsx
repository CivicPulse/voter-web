import {
  createRootRoute,
  Link,
  Outlet,
  useMatch,
  useNavigate,
} from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { useEffect } from "react"
import { Loader2, LogIn, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LayerBar } from "@/components/LayerBar"
import { useAuthStore } from "@/stores/authStore"
import { useCountyBoundary } from "@/hooks/useCountyBoundary"
import { useCountySlugResolver } from "@/hooks/useCountySlugResolver"
import { useBoundaryTypes } from "@/hooks/useBoundaryTypes"
import { useBoundaryTypeGeoJSON } from "@/hooks/useBoundaryTypeGeoJSON"
import { useStatewideOverlayTypes } from "@/hooks/useStatewideOverlayTypes"

function RootLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const initialize = useAuthStore((state) => state.initialize)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  // Route detection
  const countyIdMatch = useMatch({
    from: "/counties/$countyId",
    shouldThrow: false,
  })
  const countySlugMatch = useMatch({
    from: "/counties/$state/$county",
    shouldThrow: false,
  })
  const homeMatch = useMatch({ from: "/", shouldThrow: false })

  // Resolve slug route to UUID when on slug route
  const slugState = countySlugMatch?.params?.state ?? ""
  const slugCounty = countySlugMatch?.params?.county ?? ""
  const { countyId: resolvedSlugId } = useCountySlugResolver(
    slugState,
    slugCounty,
  )

  // County data hooks (enabled guards prevent fetches when not on county route)
  const isOnCountyRoute = !!(countyIdMatch || countySlugMatch)
  const countyId = countyIdMatch?.params?.countyId ?? resolvedSlugId ?? ""
  const { data: county } = useCountyBoundary(countyId)

  const isOnHomePage = !!homeMatch

  const countyOverlay =
    (countyIdMatch?.search as { overlay?: string } | undefined)?.overlay ??
    (countySlugMatch?.search as { overlay?: string } | undefined)?.overlay
  const homeOverlay = (homeMatch?.search as { overlay?: string } | undefined)
    ?.overlay
  const selectedType = countyOverlay ?? homeOverlay ?? null

  const { data: boundaryTypes, isLoading: isTypesLoading } =
    useBoundaryTypes()
  const { data: statewideTypes, isLoading: isStatewideTypesLoading } =
    useStatewideOverlayTypes()
  const { data: overlayData, isLoading: isOverlayLoading } =
    useBoundaryTypeGeoJSON(
      selectedType,
      isOnCountyRoute ? (county?.name ?? null) : null,
    )

  // Determine header title
  let headerTitle: string | null = null
  if (isOnCountyRoute && county) {
    headerTitle = `${county.name} County`
  } else if (homeMatch) {
    headerTitle = "Voter Web"
  }

  // Layer bar type change callback
  const handleTypeChange = (type: string | undefined) => {
    if (isOnHomePage) {
      navigate({
        to: "/",
        search: {
          overlay: type as
            | "congressional"
            | "psc"
            | "state_house"
            | "state_senate"
            | undefined,
        },
        replace: true,
      })
    } else if (countySlugMatch) {
      navigate({
        to: "/counties/$state/$county",
        params: { state: slugState, county: slugCounty },
        search: { overlay: type },
        replace: true,
      })
    } else {
      navigate({
        to: "/counties/$countyId",
        params: { countyId },
        search: { overlay: type },
        replace: true,
      })
    }
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

        {/* Row 2: Layer controls (county detail or homepage) */}
        {isOnCountyRoute && county?.geometry && (
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
        {isOnHomePage && (
          <LayerBar
            boundaryTypes={statewideTypes}
            isTypesLoading={isStatewideTypesLoading}
            selectedType={selectedType}
            onTypeChange={handleTypeChange}
            overlayFeatureCount={
              selectedType && overlayData && !isOverlayLoading
                ? overlayData.features.length
                : null
            }
            countyName="Georgia"
            statewide
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
