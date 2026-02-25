import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getImportJobs,
  getImportJob,
  createVoterImport,
  createBoundaryImport,
} from "@/lib/api/admin"
import {
  isActiveJob,
  AuthenticationError,
  PermissionError,
} from "@/types/admin"
import { adminQueryRetry } from "@/lib/hooks/admin-query-retry"
import { toast } from "sonner"

/**
 * Hook to fetch and cache the list of all import jobs
 *
 * Automatically polls every 3 seconds when any job is active (pending/processing)
 * Shows toast notifications for auth/permission/network errors
 */
export function useImportJobs() {
  return useQuery({
    queryKey: ["admin", "imports", "list"],
    queryFn: getImportJobs,
    refetchInterval: (query) => {
      const jobs = query.state.data?.jobs ?? []
      // Continue polling if any job is active
      const hasActiveJobs = jobs.some(isActiveJob)
      return hasActiveJobs ? 3000 : false
    },
    staleTime: 0, // Always refetch when polling is active
    retry: adminQueryRetry,
  })
}

/**
 * Hook to fetch a specific import job
 *
 * Polls every 3 seconds while the job is active
 */
export function useImportJob(jobId: string | null) {
  return useQuery({
    queryKey: ["admin", "imports", jobId],
    queryFn: () => getImportJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const job = query.state.data
      return job && isActiveJob(job) ? 3000 : false
    },
    staleTime: 0,
    retry: 2,
  })
}

/**
 * Hook to create a voter import job
 * Shows success/error toast notifications
 */
export function useCreateVoterImport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => createVoterImport(file),
    onSuccess: () => {
      // Invalidate import jobs list to show new job
      queryClient.invalidateQueries({ queryKey: ["admin", "imports", "list"] })
      toast.success("Import started", {
        description: "Voter import job has been created and is processing.",
      })
    },
    onError: (error: Error) => {
      if (error instanceof AuthenticationError) {
        toast.error("Session expired", { description: error.message })
      } else if (error instanceof PermissionError) {
        toast.error("Access denied", { description: error.message })
      } else {
        toast.error("Import failed", {
          description: error.message || "Failed to create import job.",
        })
      }
    },
  })
}

/**
 * Hook to create a boundary import job
 * Shows success/error toast notifications
 */
export function useCreateBoundaryImport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      file,
      boundaryType,
    }: {
      file: File
      boundaryType?: string
    }) => createBoundaryImport(file, boundaryType),
    onSuccess: () => {
      // Invalidate import jobs list to show new job
      queryClient.invalidateQueries({ queryKey: ["admin", "imports", "list"] })
      toast.success("Import started", {
        description: "Boundary import job has been created and is processing.",
      })
    },
    onError: (error: Error) => {
      if (error instanceof AuthenticationError) {
        toast.error("Session expired", { description: error.message })
      } else if (error instanceof PermissionError) {
        toast.error("Access denied", { description: error.message })
      } else {
        toast.error("Import failed", {
          description: error.message || "Failed to create import job.",
        })
      }
    },
  })
}
