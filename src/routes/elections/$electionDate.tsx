import { createFileRoute, Outlet, Navigate } from "@tanstack/react-router"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const Route = createFileRoute("/elections/$electionDate")({
  component: ElectionDateLayout,
})

function ElectionDateLayout() {
  const { electionDate } = Route.useParams()

  // If the param is a UUID, redirect to the new direct detail route
  if (UUID_RE.test(electionDate)) {
    return <Navigate to="/elections/$electionId" params={{ electionId: electionDate }} replace />
  }

  // Otherwise render child routes (which will themselves redirect)
  return <Outlet />
}
