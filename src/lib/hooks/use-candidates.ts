import { useQuery } from "@tanstack/react-query"
import { getCandidates, getCandidateDetail } from "@/lib/api/candidates"
import type { CandidateListParams } from "@/types/candidates"

/** Fetch paginated candidate list for an election */
export function useCandidates(electionId: string, params?: CandidateListParams) {
  return useQuery({
    queryKey: ["elections", electionId, "candidates", params],
    queryFn: () => getCandidates(electionId, params),
    staleTime: 30_000,
    enabled: !!electionId,
  })
}

/** Fetch full candidate detail */
export function useCandidateDetail(candidateId: string) {
  return useQuery({
    queryKey: ["candidates", candidateId],
    queryFn: () => getCandidateDetail(candidateId),
    staleTime: 30_000,
    enabled: !!candidateId,
  })
}
