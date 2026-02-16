import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getElections,
  getElectionDetail,
  createElection,
  updateElection,
  refreshElection,
} from "@/lib/api/elections"
import type {
  CreateElectionRequest,
  UpdateElectionRequest,
} from "@/types/elections"
import {
  AuthenticationError,
  PermissionError,
  NetworkError,
} from "@/types/admin"
import { toast } from "sonner"

/**
 * Hook to fetch a single election's detail for the admin edit page.
 */
export function useAdminElectionDetail(electionId: string) {
  return useQuery({
    queryKey: ["admin", "elections", electionId],
    queryFn: () => getElectionDetail(electionId),
    enabled: !!electionId,
    staleTime: 30 * 1000,
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
      return failureCount < 1
    },
  })
}

/**
 * Hook to fetch and cache the list of all elections for admin management.
 */
export function useAdminElections() {
  return useQuery({
    queryKey: ["admin", "elections"],
    queryFn: () => getElections({ page_size: 100 }),
    staleTime: 30 * 1000,
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
        toast.warning("Connection issue", {
          description: "Having trouble loading elections. Please try again.",
        })
        return failureCount < 1
      }
      return failureCount < 1
    },
  })
}

/**
 * Hook to create a new election.
 * Invalidates the elections list on success.
 */
export function useCreateElection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateElectionRequest) => createElection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "elections"] })
      toast.success("Election created", {
        description: "The election has been created successfully.",
      })
    },
    onError: (error: Error) => {
      if (error instanceof AuthenticationError) {
        toast.error("Session expired", { description: error.message })
      } else if (error instanceof PermissionError) {
        toast.error("Access denied", { description: error.message })
      } else {
        toast.error("Failed to create election", {
          description:
            error.message || "An error occurred while creating the election.",
        })
      }
    },
  })
}

/**
 * Hook to update an existing election.
 * Invalidates the elections list on success.
 */
export function useUpdateElection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      electionId,
      data,
    }: {
      electionId: string
      data: UpdateElectionRequest
    }) => updateElection(electionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "elections"] })
      queryClient.invalidateQueries({ queryKey: ["elections"] })
      toast.success("Election updated", {
        description: "The election has been updated successfully.",
      })
    },
    onError: (error: Error) => {
      if (error instanceof AuthenticationError) {
        toast.error("Session expired", { description: error.message })
      } else if (error instanceof PermissionError) {
        toast.error("Access denied", { description: error.message })
      } else {
        toast.error("Failed to update election", {
          description:
            error.message || "An error occurred while updating the election.",
        })
      }
    },
  })
}

/**
 * Hook to manually trigger a data refresh for an election.
 * Invalidates results queries on success.
 */
export function useRefreshElection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (electionId: string) => refreshElection(electionId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["elections"] })
      toast.success("Election refreshed", {
        description: `${data.counties_updated} counties updated, ${data.precincts_reporting}/${data.precincts_participating} precincts reporting.`,
      })
    },
    onError: (error: Error) => {
      if (error instanceof AuthenticationError) {
        toast.error("Session expired", { description: error.message })
      } else if (error instanceof PermissionError) {
        toast.error("Access denied", { description: error.message })
      } else {
        toast.error("Failed to refresh election", {
          description:
            error.message ||
            "An error occurred while refreshing the election data.",
        })
      }
    },
  })
}
