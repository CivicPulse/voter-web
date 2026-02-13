import ky from "ky"

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
        if (response.status !== 401) return response

        // Don't retry auth endpoints to prevent infinite loops
        if (
          request.url.includes("/auth/login") ||
          request.url.includes("/auth/refresh")
        ) {
          return response
        }

        // Dynamic import to avoid circular dependency with authStore → auth.ts → client.ts
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
            })
        }

        try {
          await refreshPromise
        } catch {
          return response
        }

        // Retry with the new token
        const newToken = localStorage.getItem("access_token")
        if (newToken) {
          request.headers.set("Authorization", `Bearer ${newToken}`)
          return ky(request)
        }

        return response
      },
    ],
  },
})
