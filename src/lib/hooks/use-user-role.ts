import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/stores/authStore"
import { getCurrentUser } from "@/lib/api/admin"

/**
 * Hook to fetch and cache the current user's role
 *
 * This hook fetches the user profile from the API and stores the role
 * in the Zustand auth store for easy access throughout the app.
 *
 * @returns TanStack Query result with user data including role
 */
export function useUserRole() {
  const { accessToken, setUserRole } = useAuthStore()

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const user = await getCurrentUser()
      setUserRole(user.role)
      return user
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: !!accessToken,
    retry: 1,
  })
}
