import { createRootRoute, Link, Outlet } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"

const RootLayout = () => (
  <div className="min-h-svh bg-background text-foreground">
    <nav className="border-b px-4 py-2 flex gap-4">
      <Link to="/" className="[&.active]:font-bold">
        Home
      </Link>
    </nav>
    <main className="p-4">
      <Outlet />
    </main>
    <TanStackRouterDevtools />
  </div>
)

export const Route = createRootRoute({ component: RootLayout })
