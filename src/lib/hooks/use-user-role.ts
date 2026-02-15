import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/authStore"
import { getCurrentUser } from "@/lib/api/admin"
import { AuthenticationError, PermissionError } from "@/types/admin"

/**
 * Hook to fetch and cache the current user's role
 *
 * This hook fetches the user profile from the API and stores the role
 * in the Zustand auth store for easy access throughout the app.
 *
 * Handles errors:
 * - 401 (AuthenticationError): Clears role, triggers logout flow via API client
 * - 403 (PermissionError): Clears role, hides admin UI
 * - Network errors: Retries automatically via TanStack Query
 *
 * @returns TanStack Query result with user data including role
 */
export function useUserRole() {
  const { accessToken, setUserRole, logout } = useAuthStore()

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        const user = await getCurrentUser()
        setUserRole(user.role)
        return user
      } catch (error) {
        // Clear role on any error
        setUserRole(null)

        // Handle specific error types
        if (error instanceof AuthenticationError) {
          // Token refresh already attempted by API client, logout fully
          logout()
          throw error
        }

        if (error instanceof PermissionError) {
          // User lost admin privileges, just clear role (don't logout)
          throw error
        }

        // Re-throw other errors for TanStack Query to handle
        throw error
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: !!accessToken,
    retry: (failureCount, error) => {
      // Don't retry auth/permission errors
      if (
        error instanceof AuthenticationError ||
        error instanceof PermissionError
      ) {
        return false
      }
      // Retry network errors up to once
      return failureCount < 1
    },
  })
}
