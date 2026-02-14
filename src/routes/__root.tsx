import {
  createRootRoute,
  Link,
  Outlet,
  useMatch,
  useNavigate,
} from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { useEffect, useState } from "react"
import { Loader2, LogIn, LogOut, Menu, Search, User } from "lucide-react"
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
import { useCountyBoundary } from "@/hooks/useCountyBoundary"
import { useCountySlugResolver } from "@/hooks/useCountySlugResolver"
import { useDistrictSlugResolver } from "@/hooks/useDistrictSlugResolver"
import { useBoundaryTypes } from "@/hooks/useBoundaryTypes"
import { useBoundaryTypeGeoJSON } from "@/hooks/useBoundaryTypeGeoJSON"
import { useStatewideOverlayTypes } from "@/hooks/useStatewideOverlayTypes"

function MobileNav({
  headerTitle,
  isAuthenticated,
  user,
  onLogout,
}: {
  headerTitle: string | null
  isAuthenticated: boolean
  user: { username: string; role: string } | null
  onLogout: () => void
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
                className="[&.active]:font-bold py-2 text-sm"
              >
                Home
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                to="/about"
                className="[&.active]:font-bold py-2 text-sm"
              >
                About
              </Link>
            </SheetClose>
            {isAuthenticated && (
              <SheetClose asChild>
                <Link
                  to="/lookup"
                  className="[&.active]:font-bold py-2 text-sm flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Address Lookup
                </Link>
              </SheetClose>
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

  // County data hooks (enabled guards prevent fetches when not on county route)
  const isOnCountyRoute = !!(countyIdMatch || countySlugMatch)
  const countyId = countyIdMatch?.params?.countyId ?? resolvedSlugId ?? ""
  const { data: county } = useCountyBoundary(countyId)

  // District data hooks
  const isOnDistrictRoute = !!(districtIdMatch || districtSlugMatch)
  const districtId =
    districtIdMatch?.params?.districtId ?? resolvedDistrictSlugId ?? ""
  const { data: district } = useCountyBoundary(districtId)

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
  if (isOnDistrictRoute && district) {
    const typeLabel = district.boundary_type.replaceAll("_", " ")
    headerTitle = `${district.name} (${typeLabel})`
  } else if (isOnCountyRoute && county) {
    headerTitle = `${county.name} County`
  } else if (lookupMatch || lookupResultsMatch) {
    headerTitle = "Address Lookup"
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
        {/* Row 1: Primary nav — desktop */}
        <nav className="hidden md:flex border-b px-4 py-2 items-center">
          <div className="flex-1 flex gap-4 min-w-0">
            <Link to="/" className="[&.active]:font-bold shrink-0">
              Home
            </Link>
            <Link to="/about" className="[&.active]:font-bold shrink-0">
              About
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

        {/* Row 1: Primary nav — mobile */}
        <MobileNav
          headerTitle={headerTitle}
          isAuthenticated={isAuthenticated}
          user={user}
          onLogout={handleLogout}
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
      <main className="flex-1 min-h-0 overflow-auto">
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </div>
  )
}

export const Route = createRootRoute({ component: RootLayout })
