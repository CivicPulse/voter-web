import { redirect } from "@tanstack/react-router"
import { useAuthStore } from "@/stores/authStore"
import type { UserRole } from "@/types/auth"

/** Redirect to /login if not authenticated. Use in route `beforeLoad`. */
export function requireAuth(currentPath: string) {
  const { isAuthenticated } = useAuthStore.getState()
  if (!isAuthenticated) {
    throw redirect({
      to: "/login",
      search: { redirect: currentPath },
    })
  }
}

/** Redirect if not authenticated or if user lacks one of the required roles. */
export function requireRole(roles: UserRole[], currentPath: string) {
  requireAuth(currentPath)
  const { user } = useAuthStore.getState()
  if (!user || !roles.includes(user.role)) {
    throw redirect({ to: "/" })
  }
}
