import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { ElectionDetailPage } from "@/components/elections/ElectionDetailPage"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const searchSchema = z.object({
  tab: z.enum(["info", "results", "participation"]).optional(),
})

export const Route = createFileRoute("/elections/$electionDate")({
  component: ElectionDateLayout,
  validateSearch: searchSchema,
})

function ElectionDateLayout() {
  const { electionDate } = Route.useParams()
  const { tab } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  // If the param is a UUID, render the election detail page directly
  if (UUID_RE.test(electionDate)) {
    return (
      <ElectionDetailPage
        electionId={electionDate}
        tab={tab}
        onTabChange={(value) => {
          navigate({
            search: { tab: value },
            replace: true,
          })
        }}
      />
    )
  }

  // Otherwise render child routes (legacy date-based URLs)
  return <Outlet />
}
