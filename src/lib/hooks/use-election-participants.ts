import { useQuery } from "@tanstack/react-query"
import { getElectionParticipants } from "@/lib/api/elections"

export interface ElectionParticipantsParams {
  page: number
  pageSize: number
  search?: string
  county?: string
  voter_status?: string
  has_district_mismatch?: "true" | "false"
  county_precinct?: string
  ballot_style?: string
  congressional_district?: string
  state_senate_district?: string
  state_house_district?: string
}

export function useElectionParticipants(
  electionId: string,
  params: ElectionParticipantsParams,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [
      "elections",
      electionId,
      "participation",
      "participants",
      params,
    ],
    queryFn: () =>
      getElectionParticipants(electionId, {
        page: params.page,
        page_size: params.pageSize,
        q: params.search || undefined,
        county: params.county,
        voter_status: params.voter_status,
        has_district_mismatch: params.has_district_mismatch !== undefined
          ? params.has_district_mismatch === "true"
          : undefined,
        county_precinct: params.county_precinct,
        ballot_style: params.ballot_style,
        congressional_district: params.congressional_district,
        state_senate_district: params.state_senate_district,
        state_house_district: params.state_house_district,
      }),
    enabled: enabled && !!electionId,
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    retry: 1,
  })
}
