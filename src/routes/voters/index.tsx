import { useEffect, useRef } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import { Loader2, Users } from "lucide-react"
import { useVoterSearch } from "@/hooks/useVoters"
import { VoterSearchFilters } from "@/routes/voters/_components/VoterSearchFilters"
import { VoterTable } from "@/routes/voters/_components/VoterTable"
import { BulkGeocodeButton } from "@/routes/voters/_components/BulkGeocodeButton"
import { DriverLicenseScannerButton } from "@/routes/voters/_components/DriverLicenseScannerButton"
import { useNavigationContext } from "@/stores/navigation-context"

const voterSearchSchema = z.object({
  q: z.string().optional().catch(undefined),
  county: z.string().optional().catch(undefined),
  status: z.string().optional().catch(undefined),
  congressional_district: z.string().optional().catch(undefined),
  state_senate_district: z.string().optional().catch(undefined),
  state_house_district: z.string().optional().catch(undefined),
  sort_by: z
    .enum(["name", "county", "registration_date", "voter_id"])
    .optional()
    .catch(undefined),
  sort_order: z.enum(["asc", "desc"]).optional().catch(undefined),
  page: z.coerce.number().int().positive().optional().catch(undefined),
})

export const Route = createFileRoute("/voters/")({
  component: VoterSearchPage,
  validateSearch: voterSearchSchema,
})

function VoterSearchPage() {
  const params = Route.useSearch()
  const navigate = useNavigate()
  const { data, isLoading, error } = useVoterSearch(params)

  // Pre-populate county filter from navigation context (one-time on mount)
  const navCounty = useNavigationContext((s) => s.countyName)
  const appliedRef = useRef(false)
  useEffect(() => {
    if (appliedRef.current || params.county) return
    if (navCounty) {
      appliedRef.current = true
      navigate({
        to: "/voters",
        search: { ...params, county: navCounty },
        replace: true,
      })
    }
  }, [navCounty, params, navigate])

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Voters</h1>
        </div>
        <div className="flex items-center gap-2">
          <DriverLicenseScannerButton />
          <BulkGeocodeButton />
        </div>
      </div>

      <div className="mb-6">
        <VoterSearchFilters params={params} />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-destructive">
          <p>Failed to load voters. Please try again.</p>
        </div>
      )}

      {data && <VoterTable data={data} params={params} />}
    </div>
  )
}
