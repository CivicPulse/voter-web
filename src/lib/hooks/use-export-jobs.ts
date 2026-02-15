import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getExportJobs,
  getExportJob,
  createExport,
  downloadExport,
} from "@/lib/api/admin"
import {
  isActiveJob,
  AuthenticationError,
  PermissionError,
  NetworkError,
} from "@/types/admin"
import type { CreateExportRequest } from "@/types/admin"
import { toast } from "sonner"

/**
 * Hook to fetch and cache the list of all export jobs
 *
 * Automatically polls every 3 seconds when any job is active (pending/processing)
 * Shows toast notifications for auth/permission/network errors
 */
export function useExportJobs() {
  return useQuery({
    queryKey: ["admin", "exports", "list"],
    queryFn: getExportJobs,
    refetchInterval: (query) => {
      const jobs = query.state.data?.jobs ?? []
      // Continue polling if any job is active
      const hasActiveJobs = jobs.some(isActiveJob)
      return hasActiveJobs ? 3000 : false
    },
    staleTime: 0, // Always refetch when polling is active
    retry: (failureCount, error) => {
      // Don't retry auth/permission errors
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

      // Handle network errors during polling
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

/**
 * Hook to fetch a specific export job
 *
 * Polls every 3 seconds while the job is active
 */
export function useExportJob(jobId: string | null) {
  return useQuery({
    queryKey: ["admin", "exports", jobId],
    queryFn: () => getExportJob(jobId!),
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
 * Hook to create an export job
 * Shows success/error toast notifications
 */
export function useCreateExport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateExportRequest) => createExport(request),
    onSuccess: () => {
      // Invalidate export jobs list to show new job
      queryClient.invalidateQueries({ queryKey: ["admin", "exports", "list"] })
      toast.success("Export started", {
        description: "Export job has been created and is processing.",
      })
    },
    onError: (error: Error) => {
      if (error instanceof AuthenticationError) {
        toast.error("Session expired", { description: error.message })
      } else if (error instanceof PermissionError) {
        toast.error("Access denied", { description: error.message })
      } else {
        toast.error("Export failed", {
          description: error.message || "Failed to create export job.",
        })
      }
    },
  })
}

/**
 * Hook to download an export file
 * Shows success/error toast notifications
 */
export function useDownloadExport() {
  return useMutation({
    mutationFn: async (jobId: string) => {
      const blob = await downloadExport(jobId)

      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `export-${jobId}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    },
    onSuccess: () => {
      toast.success("Download started", {
        description: "Export file is downloading.",
      })
    },
    onError: (error: Error) => {
      if (error instanceof AuthenticationError) {
        toast.error("Session expired", { description: error.message })
      } else if (error instanceof PermissionError) {
        toast.error("Access denied", { description: error.message })
      } else {
        toast.error("Download failed", {
          description: error.message || "Failed to download export file.",
        })
      }
    },
  })
}
