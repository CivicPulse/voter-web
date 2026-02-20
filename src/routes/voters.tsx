import { createFileRoute, Outlet } from "@tanstack/react-router"
import { requireAuth } from "@/lib/auth-guards"

export const Route = createFileRoute("/voters")({
  component: VotersLayout,
  beforeLoad: ({ location }) => {
    requireAuth(location.pathname)
  },
})

function VotersLayout() {
  return (
    <div className="container mx-auto px-4 py-4 sm:p-6">
      <Outlet />
    </div>
  )
}
