import { useQuery } from "@tanstack/react-query"
import { getElectionParticipants } from "@/lib/api/elections"

export function useElectionParticipants(
  electionId: string,
  params: { page: number; pageSize: number; search: string },
  enabled: boolean,
) {
  return useQuery({
    queryKey: [
      "elections",
      electionId,
      "participation",
      "participants",
      { page: params.page, pageSize: params.pageSize, search: params.search },
    ],
    queryFn: () =>
      getElectionParticipants(electionId, {
        page: params.page,
        page_size: params.pageSize,
        q: params.search || undefined,
      }),
    enabled: enabled && !!electionId,
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    retry: 1,
  })
}
