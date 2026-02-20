import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { Loader2, Users } from "lucide-react"
import { useVoterSearch } from "@/hooks/useVoters"
import { VoterSearchFilters } from "@/routes/voters/_components/VoterSearchFilters"
import { VoterTable } from "@/routes/voters/_components/VoterTable"

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
  const { data, isLoading, error } = useVoterSearch(params)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Voters</h1>
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
