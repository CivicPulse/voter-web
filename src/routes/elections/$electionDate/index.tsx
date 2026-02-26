import { createFileRoute, Navigate } from "@tanstack/react-router"

export const Route = createFileRoute("/elections/$electionDate/")({
  component: RedirectToElections,
})

function RedirectToElections() {
  return <Navigate to="/elections" replace />
}
