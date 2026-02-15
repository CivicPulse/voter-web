import ky from "ky"
import { AuthenticationError, PermissionError } from "@/types/admin"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"

let isRefreshing = false
let refreshPromise: Promise<void> | null = null

export const api = ky.create({
  prefixUrl: API_BASE_URL,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = localStorage.getItem("access_token")
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`)
        }
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        // Handle 401 - Unauthorized (token expired/invalid)
        if (response.status === 401) {
          // Don't retry auth endpoints to prevent infinite loops
          if (
            request.url.includes("/auth/login") ||
            request.url.includes("/auth/refresh")
          ) {
            return response
          }

          // Dynamic import to avoid circular dependency
          const { useAuthStore } = await import("@/stores/authStore")

          if (!isRefreshing) {
            isRefreshing = true
            refreshPromise = useAuthStore
              .getState()
              .refreshTokens()
              .then(() => {
                isRefreshing = false
                refreshPromise = null
              })
              .catch(() => {
                isRefreshing = false
                refreshPromise = null
                useAuthStore.getState().logout()
                globalThis.location.href = "/login"
                throw new AuthenticationError()
              })
          }

          try {
            await refreshPromise
          } catch (error) {
            throw error instanceof AuthenticationError
              ? error
              : new AuthenticationError()
          }

          // Retry with the new token
          const newToken = localStorage.getItem("access_token")
          if (newToken) {
            request.headers.set("Authorization", `Bearer ${newToken}`)
            return ky(request)
          }

          throw new AuthenticationError()
        }

        // Handle 403 - Forbidden (insufficient permissions)
        if (response.status === 403) {
          throw new PermissionError()
        }

        return response
      },
    ],
  },
  retry: {
    limit: 2,
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
  },
})
