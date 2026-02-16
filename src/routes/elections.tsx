import { createFileRoute, Outlet } from "@tanstack/react-router"
import { ElectionErrorBoundary } from "@/components/elections/ElectionErrorBoundary"

export const Route = createFileRoute("/elections")({
  component: ElectionsLayout,
})

function ElectionsLayout() {
  return (
    <ElectionErrorBoundary>
      <Outlet />
    </ElectionErrorBoundary>
  )
}
