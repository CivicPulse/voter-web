import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { CountyDetailContent } from "@/components/CountyDetailContent"

const countySearchSchema = z.object({
  overlay: z.string().optional().catch(undefined),
})

export const Route = createFileRoute("/counties/$countyId")({
  component: CountyDetailPage,
  validateSearch: countySearchSchema,
})

function CountyDetailPage() {
  const { countyId } = Route.useParams()
  const { overlay } = Route.useSearch()
  return <CountyDetailContent countyId={countyId} overlay={overlay} />
}
