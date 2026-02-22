import { z } from "zod"
import { createFileRoute } from "@tanstack/react-router"
import { DistrictDetailContent } from "@/components/DistrictDetailContent"

export const Route = createFileRoute("/districts/$districtId")({
  validateSearch: z.object({ overlay: z.string().optional() }),
  component: DistrictDetailPage,
})

function DistrictDetailPage() {
  const { districtId } = Route.useParams()
  const { overlay } = Route.useSearch()
  return <DistrictDetailContent districtId={districtId} overlay={overlay} />
}
