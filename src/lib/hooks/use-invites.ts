import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getInvites,
  createInvite,
  cancelInvite,
  resendInvite,
  acceptInvite,
} from "@/lib/api/admin"
import type { InviteCreateRequest, InviteAcceptRequest } from "@/types/admin"
import {
  AuthenticationError,
  PermissionError,
  NetworkError,
} from "@/types/admin"
import { toast } from "sonner"

/**
 * Hook to fetch and cache the list of all invites
 * Shows toast notifications for auth/permission/network errors
 */
export function useInvites() {
  return useQuery({
    queryKey: ["admin", "invites"],
    queryFn: getInvites,
    staleTime: 30 * 1000, // Cache for 30 seconds
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

      // Handle network errors
      if (error instanceof NetworkError) {
        toast.warning("Connection issue", {
          description: "Having trouble loading invites. Please try again.",
        })
        return failureCount < 1
      }

      return failureCount < 1
    },
  })
}

/**
 * Hook to create a new invite
 *
 * Automatically invalidates the invite list query on success
 * Shows success/error toast notifications
 */
export function useCreateInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: InviteCreateRequest) => createInvite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "invites"] })
      toast.success("Invite sent", {
        description: "The invitation has been sent successfully.",
      })
    },
    onError: (error: Error) => {
      if (error instanceof AuthenticationError) {
        toast.error("Session expired", { description: error.message })
      } else if (error instanceof PermissionError) {
        toast.error("Access denied", { description: error.message })
      } else {
        toast.error("Failed to send invite", {
          description:
            error.message || "An error occurred while sending the invite.",
        })
      }
    },
  })
}

/**
 * Hook to cancel an invite
 *
 * Automatically invalidates the invite list query on success
 * Shows success/error toast notifications
 */
export function useCancelInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => cancelInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "invites"] })
      toast.success("Invite cancelled", {
        description: "The invitation has been cancelled.",
      })
    },
    onError: (error: Error) => {
      if (error instanceof AuthenticationError) {
        toast.error("Session expired", { description: error.message })
      } else if (error instanceof PermissionError) {
        toast.error("Access denied", { description: error.message })
      } else {
        toast.error("Failed to cancel invite", {
          description:
            error.message || "An error occurred while cancelling the invite.",
        })
      }
    },
  })
}

/**
 * Hook to resend an invite
 *
 * Automatically invalidates the invite list query on success
 * Shows success/error toast notifications
 */
export function useResendInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => resendInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "invites"] })
      toast.success("Invite resent", {
        description: "The invitation has been resent successfully.",
      })
    },
    onError: (error: Error) => {
      if (error instanceof AuthenticationError) {
        toast.error("Session expired", { description: error.message })
      } else if (error instanceof PermissionError) {
        toast.error("Access denied", { description: error.message })
      } else {
        toast.error("Failed to resend invite", {
          description:
            error.message || "An error occurred while resending the invite.",
        })
      }
    },
  })
}

/**
 * Hook to accept an invite (public — no auth required)
 *
 * No toast notifications — the acceptance page handles feedback inline
 */
export function useAcceptInvite() {
  return useMutation({
    mutationFn: (data: InviteAcceptRequest) => acceptInvite(data),
  })
}
