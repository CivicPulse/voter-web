import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/elections/$electionDate")({
  params: {
    parse: ({ electionDate }) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(electionDate)) {
        throw new Error("Invalid date format")
      }
      return { electionDate }
    },
    stringify: ({ electionDate }) => ({ electionDate }),
  },
  component: ElectionDateLayout,
})

function ElectionDateLayout() {
  return <Outlet />
}
