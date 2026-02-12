import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: Index,
})

function Index() {
  return (
    <div className="p-2">
      <h1 className="text-2xl font-bold">Voter Web</h1>
      <p className="mt-2 text-muted-foreground">
        SPA interface for the voter-api backend.
      </p>
    </div>
  )
}
