import { createRootRoute, Link, Outlet, useNavigate } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { useEffect } from "react"
import { Loader2, LogIn, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/authStore"

function RootLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const initialize = useAuthStore((state) => state.initialize)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

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
      <nav className="flex-none border-b px-4 py-2 flex items-center justify-between bg-background z-50">
        <div className="flex gap-4">
          <Link to="/" className="[&.active]:font-bold">
            Home
          </Link>
        </div>

        <div className="flex items-center gap-3">
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
      <main className="flex-1 min-h-0">
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </div>
  )
}

export const Route = createRootRoute({ component: RootLayout })
