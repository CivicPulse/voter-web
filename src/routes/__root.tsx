import {
  createRootRoute,
  Link,
  Outlet,
  useMatch,
  useNavigate,
} from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { useEffect, useMemo, useState } from "react"
import { HelpCircle, Home as HomeIcon, Info, Loader2, LogIn, LogOut, MapPinned, Menu, User, Users, Vote } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet"
import { LayerBar } from "@/components/LayerBar"
import { useAuthStore } from "@/stores/authStore"
import { useNavigationContext } from "@/stores/navigation-context"
import { useCountyBoundary } from "@/hooks/useCountyBoundary"
import { useCountySlugResolver } from "@/hooks/useCountySlugResolver"
import { useDistrictSlugResolver } from "@/hooks/useDistrictSlugResolver"
import { useDistrictSlugResolverScoped } from "@/hooks/useDistrictSlugResolverScoped"
import { useBoundaryTypes } from "@/hooks/useBoundaryTypes"
import { useBoundaryTypeGeoJSON } from "@/hooks/useBoundaryTypeGeoJSON"
import { useStatewideOverlayTypes } from "@/hooks/useStatewideOverlayTypes"
import { useAvailableStates } from "@/hooks/useAvailableStates"
import { ABBREV_TO_NAME } from "@/lib/states"
import { resolveHeaderTitle } from "@/lib/resolve-header-title"
import { useUserRole } from "@/lib/hooks/use-user-role"
import {
  useActiveElections,
  electionBoundaryTypes,
} from "@/lib/hooks/use-active-elections"
import { AdminNavMenu, AdminNavLinks } from "@/components/admin-nav-menu"
import { Toaster } from "@/components/ui/sonner"
import { WelcomeModal } from "@/components/WelcomeModal"

function MobileNav({
  headerTitle,
  isAuthenticated,
  user,
  onLogout,
  isAdmin,
  onShowWelcome,
}: {
  headerTitle: string | null
  isAuthenticated: boolean
  user: { username: string; role: string } | null
  onLogout: () => void
  isAdmin: boolean
  onShowWelcome: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <nav className="md:hidden border-b px-4 py-2 flex items-center">
      <Sheet open={open} onOpenChange={setOpen}>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <SheetContent side="left" className="w-64 flex flex-col gap-0 p-0">
          <SheetHeader className="p-4 pb-2">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>

          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1 px-4 py-2">
            <SheetClose asChild>
              <Link
                to="/"
                className="[&.active]:font-bold py-2 text-sm flex items-center gap-2"
              >
                <HomeIcon className="h-4 w-4" />
                Home
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                to="/elections"
                className="[&.active]:font-bold py-2 text-sm flex items-center gap-2"
              >
                <Vote className="h-4 w-4" />
                Elections
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                to="/lookup"
                className="[&.active]:font-bold py-2 text-sm flex items-center gap-2"
              >
                <MapPinned className="h-4 w-4" />
                Address Lookup
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                to="/about"
                className="[&.active]:font-bold py-2 text-sm flex items-center gap-2"
              >
                <Info className="h-4 w-4" />
                About
              </Link>
            </SheetClose>
            {isAuthenticated && (
              <SheetClose asChild>
                <Link
                  to="/voters"
                  className="[&.active]:font-bold py-2 text-sm flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Voters
                </Link>
              </SheetClose>
            )}
            <SheetClose asChild>
              <button
                type="button"
                className="py-2 text-sm text-left flex items-center gap-2"
                onClick={onShowWelcome}
              >
                <HelpCircle className="h-4 w-4" />
                Help
              </button>
            </SheetClose>

            {isAdmin && (
              <div className="pt-2 border-t mt-2">
                <AdminNavLinks onLinkClick={() => setOpen(false)} />
              </div>
            )}
          </div>

          <div className="shrink-0 border-t px-4 py-4">
            {isAuthenticated && user ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{user.username}</span>
                  <span className="text-xs uppercase text-muted-foreground/70">
                    ({user.role})
                  </span>
                </div>
                <SheetClose asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start"
                    onClick={onLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </SheetClose>
              </div>
            ) : (
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  asChild
                >
                  <Link to="/login">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Link>
                </Button>
              </SheetClose>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {headerTitle && (
        <h1 className="text-lg font-bold truncate flex-1 text-center pr-10">
          {headerTitle}
        </h1>
      )}
    </nav>
  )
}

function RootLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const initialize = useAuthStore((state) => state.initialize)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  // Admin role check for navigation
  const { data: userProfile } = useUserRole()
  const isAdmin = userProfile?.role === "admin" || userProfile?.role === "analyst"

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
  const lookupMatch = useMatch({ from: "/lookup/", shouldThrow: false })
  const lookupResultsMatch = useMatch({
    from: "/lookup/results",
    shouldThrow: false,
  })
  const districtIdMatch = useMatch({
    from: "/districts/$districtId",
    shouldThrow: false,
  })
  const districtSlugMatch = useMatch({
    from: "/districts/$type/$name",
    shouldThrow: false,
  })
  const stateMatch = useMatch({ from: "/$state", shouldThrow: false })
  const scopedDistrictMatch = useMatch({
    from: "/districts/$state/$type/$name",
    shouldThrow: false,
  })
  const scopedCountyDistrictMatch = useMatch({
    from: "/districts/$state/$county/$type/$name",
    shouldThrow: false,
  })

  // Resolve slug route to UUID when on slug route
  const slugState = countySlugMatch?.params?.state ?? ""
  const slugCounty = countySlugMatch?.params?.county ?? ""
  const { countyId: resolvedSlugId } = useCountySlugResolver(
    slugState,
    slugCounty,
  )

  // Resolve district slug route to UUID when on slug route
  const districtSlugType = districtSlugMatch?.params?.type ?? ""
  const districtSlugName = districtSlugMatch?.params?.name ?? ""
  const { districtId: resolvedDistrictSlugId } = useDistrictSlugResolver(
    districtSlugType,
    districtSlugName,
  )

  // Resolve scoped district slug routes to UUID
  const { districtId: resolvedScopedDistrictId } = useDistrictSlugResolverScoped(
    scopedDistrictMatch?.params?.state ?? "",
    null,
    scopedDistrictMatch?.params?.type ?? "",
    scopedDistrictMatch?.params?.name ?? "",
  )
  const { districtId: resolvedScopedCountyDistrictId } = useDistrictSlugResolverScoped(
    scopedCountyDistrictMatch?.params?.state ?? "",
    scopedCountyDistrictMatch?.params?.county ?? null,
    scopedCountyDistrictMatch?.params?.type ?? "",
    scopedCountyDistrictMatch?.params?.name ?? "",
  )

  // County data hooks (enabled guards prevent fetches when not on county route)
  const isOnCountyRoute = !!(countyIdMatch || countySlugMatch)
  const countyId = countyIdMatch?.params?.countyId ?? resolvedSlugId ?? ""
  const { data: county } = useCountyBoundary(countyId)

  // District data hooks
  const isOnDistrictRoute = !!(
    districtIdMatch ||
    districtSlugMatch ||
    scopedDistrictMatch ||
    scopedCountyDistrictMatch
  )
  const districtId =
    districtIdMatch?.params?.districtId ??
    resolvedDistrictSlugId ??
    resolvedScopedDistrictId ??
    resolvedScopedCountyDistrictId ??
    ""
  const { data: district } = useCountyBoundary(districtId)

  const isOnHomePage = !!homeMatch
  const isOnStatePage = !!stateMatch

  // State name resolution for home page and state page
  const { defaultState } = useAvailableStates()
  const homeStateName = defaultState
    ? (ABBREV_TO_NAME[defaultState.abbreviation] ??
        defaultState.abbreviation.toUpperCase())
    : "State"

  const countyOverlay =
    (countyIdMatch?.search as { overlay?: string } | undefined)?.overlay ??
    (countySlugMatch?.search as { overlay?: string } | undefined)?.overlay
  const homeOverlay = (homeMatch?.search as { overlay?: string } | undefined)
    ?.overlay
  const stateOverlay = (stateMatch?.search as { overlay?: string } | undefined)
    ?.overlay
  const districtOverlay =
    (districtIdMatch?.search as { overlay?: string } | undefined)?.overlay ??
    (districtSlugMatch?.search as { overlay?: string } | undefined)?.overlay ??
    (scopedDistrictMatch?.search as { overlay?: string } | undefined)?.overlay ??
    (scopedCountyDistrictMatch?.search as { overlay?: string } | undefined)?.overlay
  const selectedType = countyOverlay ?? homeOverlay ?? stateOverlay ?? districtOverlay ?? null

  const { data: boundaryTypes, isLoading: isTypesLoading } =
    useBoundaryTypes()
  const { data: statewideTypes, isLoading: isStatewideTypesLoading } =
    useStatewideOverlayTypes()
  // Precinct detail pages show the full set of boundary type overlays so users
  // can see any district type on top of a precinct. All other county-scoped
  // districts (e.g. county commission, school board) show only the County
  // Precinct toggle — state-scoped districts (congressional, state senate, etc.)
  // don't show a LayerBar at all.
  const districtOverlayTypes = useMemo(() => {
    if (!district || !boundaryTypes) return undefined
    if (district.boundary_type === "county_precinct") return boundaryTypes
    return boundaryTypes.filter((t) => t === "county_precinct")
  }, [district, boundaryTypes])
  const overlayCountyFilter =
    isOnCountyRoute ? (county?.name ?? null) :
    isOnDistrictRoute ? (district?.county ?? null) :
    null
  const { data: overlayData, isLoading: isOverlayLoading } =
    useBoundaryTypeGeoJSON(selectedType, overlayCountyFilter)

  // Active election awareness for LayerBar indicators
  const { data: activeElections } = useActiveElections()
  const electionTypes = useMemo(
    () => (activeElections ? electionBoundaryTypes(activeElections) : new Set<string>()),
    [activeElections],
  )

  const headerTitle = resolveHeaderTitle({
    isOnDistrictRoute,
    district,
    isOnCountyRoute,
    county,
    isOnStatePage,
    stateAbbrev: stateMatch?.params?.state,
    isOnLookupPage: !!(lookupMatch || lookupResultsMatch),
    isOnHomePage,
  })

  // Update navigation context for geographic pages (used by voter/election filters)
  const setNavContext = useNavigationContext((s) => s.setContext)
  useEffect(() => {
    if (isOnCountyRoute && county) {
      const stateAbbrev = countySlugMatch?.params?.state ?? defaultState?.abbreviation ?? null
      setNavContext(stateAbbrev, county.name)
    } else if (isOnStatePage && stateMatch) {
      setNavContext(stateMatch.params.state, null)
    } else if (isOnHomePage && defaultState) {
      setNavContext(defaultState.abbreviation, null)
    } else {
      setNavContext(null, null)
    }
  }, [isOnCountyRoute, county, isOnStatePage, stateMatch, isOnHomePage, defaultState, countySlugMatch, setNavContext])

  // Layer bar type change callback
  const handleTypeChange = (type: string | undefined) => {
    if (isOnStatePage && stateMatch) {
      navigate({
        to: "/$state",
        params: { state: stateMatch.params.state },
        search: { overlay: type },
        replace: true,
      })
    } else if (isOnHomePage) {
      navigate({
        to: "/",
        search: { overlay: type },
        replace: true,
      })
    } else if (countySlugMatch) {
      navigate({
        to: "/counties/$state/$county",
        params: { state: slugState, county: slugCounty },
        search: { overlay: type },
        replace: true,
      })
    } else if (isOnCountyRoute) {
      navigate({
        to: "/counties/$countyId",
        params: { countyId },
        search: { overlay: type },
        replace: true,
      })
    } else if (scopedCountyDistrictMatch) {
      navigate({
        to: "/districts/$state/$county/$type/$name",
        params: scopedCountyDistrictMatch.params,
        search: { overlay: type },
        replace: true,
      })
    } else if (scopedDistrictMatch) {
      navigate({
        to: "/districts/$state/$type/$name",
        params: scopedDistrictMatch.params,
        search: { overlay: type },
        replace: true,
      })
    } else if (districtSlugMatch) {
      navigate({
        to: "/districts/$type/$name",
        params: districtSlugMatch.params,
        search: { overlay: type },
        replace: true,
      })
    } else if (districtIdMatch) {
      navigate({
        to: "/districts/$districtId",
        params: districtIdMatch.params,
        search: { overlay: type },
        replace: true,
      })
    }
  }

  const [showWelcome, setShowWelcome] = useState(
    () => localStorage.getItem("welcome_dismissed") !== "true",
  )

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
        {/* Row 1: Primary nav — desktop */}
        <nav className="hidden md:flex border-b px-4 py-2 items-center">
          <div className="flex-1 flex gap-4 min-w-0">
            <Link to="/" className="[&.active]:font-bold shrink-0 flex items-center gap-1">
              <HomeIcon className="h-4 w-4" />
              Home
            </Link>
            <Link to="/elections" className="[&.active]:font-bold shrink-0 flex items-center gap-1">
              <Vote className="h-4 w-4" />
              Elections
            </Link>
            <Link to="/lookup" className="[&.active]:font-bold shrink-0 flex items-center gap-1">
              <MapPinned className="h-4 w-4" />
              Address Lookup
            </Link>
            <Link to="/about" className="[&.active]:font-bold shrink-0 flex items-center gap-1">
              <Info className="h-4 w-4" />
              About
            </Link>
            {isAuthenticated && (
              <Link to="/voters" className="[&.active]:font-bold shrink-0 flex items-center gap-1">
                <Users className="h-4 w-4" />
                Voters
              </Link>
            )}
            {isAdmin && <AdminNavMenu />}
          </div>

          {headerTitle && (
            <h1 className="text-lg font-bold truncate px-4 text-center">
              {headerTitle}
            </h1>
          )}

          <div className="flex-1 flex items-center justify-end gap-3 min-w-0">
            <button
              type="button"
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowWelcome(true)}
              aria-label="Help"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
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

        {/* Row 1: Primary nav — mobile */}
        <MobileNav
          headerTitle={headerTitle}
          isAuthenticated={isAuthenticated}
          user={user}
          onLogout={handleLogout}
          isAdmin={isAdmin}
          onShowWelcome={() => setShowWelcome(true)}
        />

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
            electionTypes={electionTypes}
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
            countyName={homeStateName}
            statewide
            electionTypes={electionTypes}
          />
        )}
        {isOnStatePage && stateMatch && (
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
            countyName={
              ABBREV_TO_NAME[stateMatch.params.state] ??
              stateMatch.params.state.toUpperCase()
            }
            statewide
            electionTypes={electionTypes}
          />
        )}
        {isOnDistrictRoute && district?.county && (
          <LayerBar
            boundaryTypes={districtOverlayTypes}
            isTypesLoading={isTypesLoading}
            selectedType={selectedType}
            onTypeChange={handleTypeChange}
            overlayFeatureCount={
              selectedType && overlayData && !isOverlayLoading
                ? overlayData.features.length
                : null
            }
            countyName={district.county}
            electionTypes={electionTypes}
          />
        )}
      </header>
      <main className="flex-1 min-h-0 overflow-auto">
        <Outlet />
      </main>
      <WelcomeModal open={showWelcome} onOpenChange={setShowWelcome} />
      <Toaster />
      <TanStackRouterDevtools />
    </div>
  )
}

export const Route = createRootRoute({ component: RootLayout })
