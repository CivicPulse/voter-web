import ky from "ky"
import { AuthenticationError, PermissionError } from "@/types/admin"
import { rateLimitedFetch } from "@/api/rate-limited-fetch"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"

let isRefreshing = false
let refreshPromise: Promise<void> | null = null

export const api = ky.create({
  prefixUrl: API_BASE_URL,
  fetch: rateLimitedFetch,
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
    limit: 3,
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
    afterStatusCodes: [429, 503],
    maxRetryAfter: 60_000,
    backoffLimit: 30_000,
    delay: (attemptCount: number) =>
      Math.min(1000 * 2 ** (attemptCount - 1), 30_000),
    jitter: true,
  },
})

/**
 * Public API client for endpoints accessible without authentication.
 *
 * Attaches the JWT token opportunistically (if available) but does NOT
 * redirect to /login on 401 or throw PermissionError on 403.
 */
export const publicApi = ky.create({
  prefixUrl: API_BASE_URL,
  fetch: rateLimitedFetch,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = localStorage.getItem("access_token")
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`)
        }
      },
    ],
  },
  retry: {
    limit: 3,
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
    afterStatusCodes: [429, 503],
    maxRetryAfter: 60_000,
    backoffLimit: 30_000,
    delay: (attemptCount: number) =>
      Math.min(1000 * 2 ** (attemptCount - 1), 30_000),
    jitter: true,
  },
})
