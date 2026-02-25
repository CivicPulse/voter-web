import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getAnalysisRuns,
  getAnalysisRun,
  triggerAnalysisRun,
  getAnalysisResults,
} from "@/lib/api/analysis"
import { isActiveAnalysisRun } from "@/types/analysis"
import type { TriggerAnalysisRequest, MatchStatus } from "@/types/analysis"
import { AuthenticationError, PermissionError, NetworkError } from "@/types/admin"
import { toast } from "sonner"

export function useAnalysisRuns() {
  return useQuery({
    queryKey: ["admin", "analysis", "list"],
    queryFn: () => getAnalysisRuns(),
    refetchInterval: (query) => {
      const runs = query.state.data?.items ?? []
      const hasActiveRuns = runs.some(isActiveAnalysisRun)
      return hasActiveRuns ? 3000 : false
    },
    staleTime: 0,
    retry: (failureCount, error) => {
      if (
        error instanceof AuthenticationError ||
        error instanceof PermissionError
      ) {
        if (error instanceof AuthenticationError) {
          toast.error("Session expired", { description: error.message })
        } else {
          toast.error("Access denied", { description: error.message })
        }
        return false
      }

      if (error instanceof NetworkError) {
        if (failureCount === 0) {
          toast.warning("Connection issue", {
            description:
              "Having trouble connecting. Will keep trying in the background.",
          })
        }
        return failureCount < 2
      }

      return failureCount < 2
    },
  })
}

export function useAnalysisRun(runId: string | null) {
  return useQuery({
    queryKey: ["admin", "analysis", runId],
    queryFn: () => getAnalysisRun(runId!),
    enabled: !!runId,
    refetchInterval: (query) => {
      const run = query.state.data
      return run && isActiveAnalysisRun(run) ? 3000 : false
    },
    staleTime: 0,
    retry: 2,
  })
}

export function useAnalysisResults(
  runId: string | null,
  filters?: {
    match_status?: MatchStatus
    county?: string
    page?: number
    page_size?: number
  }
) {
  return useQuery({
    queryKey: ["admin", "analysis", runId, "results", filters],
    queryFn: () => getAnalysisResults(runId!, filters),
    enabled: !!runId,
    staleTime: 30_000,
    retry: 2,
  })
}

export function useTriggerAnalysis() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: TriggerAnalysisRequest) =>
      triggerAnalysisRun(request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "analysis", "list"],
      })
      toast.success("Analysis started", {
        description:
          "District mismatch analysis has been triggered and is processing.",
      })
    },
    onError: (error: Error) => {
      if (error instanceof AuthenticationError) {
        toast.error("Session expired", { description: error.message })
      } else if (error instanceof PermissionError) {
        toast.error("Access denied", { description: error.message })
      } else {
        toast.error("Analysis failed", {
          description:
            error.message || "Failed to trigger analysis run.",
        })
      }
    },
  })
}
