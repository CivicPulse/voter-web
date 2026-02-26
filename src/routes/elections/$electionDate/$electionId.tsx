import { createFileRoute, Navigate } from "@tanstack/react-router"
import { z } from "zod"

const searchSchema = z.object({
  tab: z.enum(["info", "results", "participation"]).optional(),
})

export const Route = createFileRoute(
  "/elections/$electionDate/$electionId",
)({
  component: RedirectToElectionDetail,
  validateSearch: searchSchema,
})

function RedirectToElectionDetail() {
  const { electionId } = Route.useParams()
  const { tab } = Route.useSearch()

  return (
    <Navigate
      to="/elections/$electionDate"
      params={{ electionDate: electionId }}
      search={tab ? { tab } : {}}
      replace
    />
  )
}
