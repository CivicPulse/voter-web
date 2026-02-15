import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/elections/$electionDate")({
  component: ElectionDateLayout,
})

function ElectionDateLayout() {
  return <Outlet />
}
