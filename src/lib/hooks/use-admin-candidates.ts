import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  createCandidate,
  updateCandidate,
  deleteCandidate,
  createCandidateLink,
  deleteCandidateLink,
} from "@/lib/api/candidates"
import type {
  CreateCandidateRequest,
  UpdateCandidateRequest,
  CreateCandidateLinkRequest,
} from "@/types/candidates"
import { AuthenticationError, PermissionError } from "@/types/admin"
import { HTTPError } from "ky"
import { toast } from "sonner"

/**
 * Hook to create a candidate for an election.
 * Invalidates the election's candidates list on success.
 * 409 conflicts are re-thrown without a toast so the form can handle them.
 */
export function useCreateCandidate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      electionId,
      data,
    }: {
      electionId: string
      data: CreateCandidateRequest
    }) => createCandidate(electionId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["elections", variables.electionId, "candidates"],
      })
      toast.success("Candidate created")
    },
    onError: (error: Error) => {
      if (error instanceof HTTPError && error.response.status === 409) {
        throw error
      }
      if (error instanceof AuthenticationError) {
        toast.error("Session expired", { description: error.message })
      } else if (error instanceof PermissionError) {
        toast.error("Permission denied", { description: error.message })
      } else {
        toast.error("Failed to create candidate", {
          description:
            error.message || "An error occurred while creating the candidate.",
        })
      }
    },
  })
}

/**
 * Hook to update an existing candidate.
 * Invalidates both the election's candidates list and the individual candidate cache.
 * 409 conflicts are re-thrown without a toast so the form can handle them.
 */
export function useUpdateCandidate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      candidateId,
      data,
    }: {
      candidateId: string
      electionId: string
      data: UpdateCandidateRequest
    }) => updateCandidate(candidateId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["elections", variables.electionId, "candidates"],
      })
      queryClient.invalidateQueries({
        queryKey: ["candidates", variables.candidateId],
      })
      toast.success("Candidate updated")
    },
    onError: (error: Error) => {
      if (error instanceof HTTPError && error.response.status === 409) {
        throw error
      }
      if (error instanceof AuthenticationError) {
        toast.error("Session expired", { description: error.message })
      } else if (error instanceof PermissionError) {
        toast.error("Permission denied", { description: error.message })
      } else {
        toast.error("Failed to update candidate", {
          description:
            error.message || "An error occurred while updating the candidate.",
        })
      }
    },
  })
}

/**
 * Hook to delete a candidate.
 * Invalidates the election's candidates list on success.
 */
export function useDeleteCandidate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      candidateId,
    }: {
      candidateId: string
      electionId: string
    }) => deleteCandidate(candidateId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["elections", variables.electionId, "candidates"],
      })
      toast.success("Candidate deleted")
    },
    onError: (error: Error) => {
      if (error instanceof AuthenticationError) {
        toast.error("Session expired", { description: error.message })
      } else if (error instanceof PermissionError) {
        toast.error("Permission denied", { description: error.message })
      } else {
        toast.error("Failed to delete candidate", {
          description:
            error.message || "An error occurred while deleting the candidate.",
        })
      }
    },
  })
}

/**
 * Hook to add a link to a candidate.
 * Invalidates the individual candidate cache on success.
 */
export function useCreateCandidateLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      candidateId,
      data,
    }: {
      candidateId: string
      data: CreateCandidateLinkRequest
    }) => createCandidateLink(candidateId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["candidates", variables.candidateId],
      })
      toast.success("Link added")
    },
    onError: (error: Error) => {
      if (error instanceof AuthenticationError) {
        toast.error("Session expired", { description: error.message })
      } else if (error instanceof PermissionError) {
        toast.error("Permission denied", { description: error.message })
      } else {
        toast.error("Failed to add link", {
          description:
            error.message || "An error occurred while adding the link.",
        })
      }
    },
  })
}

/**
 * Hook to remove a link from a candidate.
 * Invalidates the individual candidate cache on success.
 */
export function useDeleteCandidateLink() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      candidateId,
      linkId,
    }: {
      candidateId: string
      linkId: string
    }) => deleteCandidateLink(candidateId, linkId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["candidates", variables.candidateId],
      })
      toast.success("Link removed")
    },
    onError: (error: Error) => {
      if (error instanceof AuthenticationError) {
        toast.error("Session expired", { description: error.message })
      } else if (error instanceof PermissionError) {
        toast.error("Permission denied", { description: error.message })
      } else {
        toast.error("Failed to remove link", {
          description:
            error.message || "An error occurred while removing the link.",
        })
      }
    },
  })
}
