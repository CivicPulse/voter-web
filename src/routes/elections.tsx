import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/elections")({
  component: ElectionsLayout,
})

function ElectionsLayout() {
  return <Outlet />
}
