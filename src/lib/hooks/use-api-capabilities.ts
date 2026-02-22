import { useQuery } from "@tanstack/react-query"

interface ApiCapabilities {
  canEditUser: boolean
  canDeleteUser: boolean
  isLoading: boolean
}

async function fetchApiCapabilities(): Promise<Omit<ApiCapabilities, "isLoading">> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined

  // When VITE_API_BASE_URL is a relative path (e.g. /api/v1), use a relative
  // URL so the Vite dev-server proxy can forward it to the backend.
  // When it's an absolute URL (e.g. https://api.example.com/api/v1), strip
  // the /api/v1 suffix to reach the API root where /openapi.json is served.
  const openApiUrl =
    !baseUrl || baseUrl.startsWith("/")
      ? "/openapi.json"
      : `${baseUrl.replace(/\/api\/v1\/?$/, "")}/openapi.json`

  let response: Response
  try {
    response = await fetch(openApiUrl)
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(
        `[useApiCapabilities] Network error fetching OpenAPI spec from "${openApiUrl}". ` +
          `Check that the dev server is running and VITE_API_BASE_URL is correct.`,
        err
      )
    }
    throw err
  }

  if (!response.ok) {
    if (import.meta.env.DEV) {
      console.warn(
        `[useApiCapabilities] Failed to fetch OpenAPI spec from "${openApiUrl}" ` +
          `(HTTP ${response.status}). User management features will be hidden. ` +
          `Verify that VITE_API_BASE_URL is set correctly and the API is reachable.`
      )
    }
    throw new Error(`Failed to fetch OpenAPI spec: ${response.status}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await response.json()
  const paths = data?.paths ?? {}
  const userPath = paths["/api/v1/users/{user_id}"] ?? {}

  return {
    canEditUser: userPath.patch !== undefined,
    canDeleteUser: userPath.delete !== undefined,
  }
}

/**
 * Hook to check which user management capabilities the API supports.
 *
 * Fetches /openapi.json once per session and checks for PATCH/DELETE on
 * /api/v1/users/{user_id}. Returns false for both if the spec is unavailable.
 * Exposes `isLoading` so consumers can defer rendering until resolved.
 *
 * TODO: Remove this capability guard once voter-api adds
 *       PATCH and DELETE /api/v1/users/{user_id} endpoints.
 */
export function useApiCapabilities(): ApiCapabilities {
  const { data, isPending } = useQuery({
    queryKey: ["api-capabilities"],
    queryFn: fetchApiCapabilities,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  return {
    ...(data ?? { canEditUser: false, canDeleteUser: false }),
    isLoading: isPending,
  }
}
