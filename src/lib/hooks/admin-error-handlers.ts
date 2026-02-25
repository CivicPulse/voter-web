import { toast } from "sonner"
import {
  AuthenticationError,
  PermissionError,
  NetworkError,
} from "@/types/admin"

/**
 * Creates an onError handler for admin mutation hooks.
 *
 * Handles AuthenticationError, PermissionError, and generic errors
 * with appropriate toast notifications.
 *
 * @param action - A label describing the failed action (e.g., "send invite")
 */
export function handleAdminMutationError(action: string) {
  return (error: Error) => {
    if (error instanceof AuthenticationError) {
      toast.error("Session expired", { description: error.message })
    } else if (error instanceof PermissionError) {
      toast.error("Access denied", { description: error.message })
    } else {
      toast.error(`Failed to ${action}`, {
        description:
          error.message || `An error occurred while trying to ${action}.`,
      })
    }
  }
}

/**
 * Retry function for admin query hooks.
 *
 * Skips retries for auth/permission errors (with toast), retries
 * network errors once with a warning toast, and retries other
 * errors once.
 *
 * @param resourceName - Human-readable label for the resource (e.g., "invites")
 */
export function createAdminQueryRetry(resourceName: string) {
  return (failureCount: number, error: Error): boolean => {
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
        description: `Having trouble loading ${resourceName}. Please try again.`,
      })
      return failureCount < 1
    }

    return failureCount < 1
  }
}
