import { AuthenticationError, PermissionError, NetworkError } from "@/types/admin"
import { toast } from "sonner"

export function adminQueryRetry(failureCount: number, error: Error): boolean {
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
        id: "admin-network-connection-issue",
        description:
          "Having trouble connecting. Will keep trying in the background.",
      })
    }
    return failureCount < 2
  }

  return failureCount < 2
}
