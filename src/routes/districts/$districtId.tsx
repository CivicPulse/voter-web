import { createFileRoute } from "@tanstack/react-router"
import { DistrictDetailContent } from "@/components/DistrictDetailContent"

export const Route = createFileRoute("/districts/$districtId")({
  component: DistrictDetailPage,
})

function DistrictDetailPage() {
  const { districtId } = Route.useParams()
  return <DistrictDetailContent districtId={districtId} />
}
