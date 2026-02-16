import { createFileRoute, Outlet, Link, useParams } from "@tanstack/react-router"
import { ChevronRight } from "lucide-react"

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

function ElectionDateBreadcrumb() {
  const { electionDate } = useParams({
    from: "/elections/$electionDate",
  })

  const formattedDate = new Date(electionDate + "T00:00:00").toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  )

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
      <Link to="/elections" className="hover:text-foreground transition-colors">
        Elections
      </Link>
      <ChevronRight className="h-3 w-3" />
      <span className="text-foreground">{formattedDate}</span>
    </nav>
  )
}

function ElectionDateLayout() {
  return (
    <div>
      <ElectionDateBreadcrumb />
      <Outlet />
    </div>
  )
}
