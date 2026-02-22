import { useQuery } from "@tanstack/react-query"

interface ApiCapabilities {
  canEditUser: boolean
  canDeleteUser: boolean
}

async function fetchApiCapabilities(): Promise<ApiCapabilities> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined
  // Strip /api/v1 suffix to get the API root (e.g. http://localhost:8000)
  const apiRoot = baseUrl?.replace(/\/api\/v1\/?$/, "") ?? "http://localhost:8000"

  const response = await fetch(`${apiRoot}/openapi.json`)
  if (!response.ok) {
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
 *
 * TODO: Remove this capability guard once voter-api adds
 *       PATCH and DELETE /api/v1/users/{user_id} endpoints.
 */
export function useApiCapabilities(): ApiCapabilities {
  const { data } = useQuery({
    queryKey: ["api-capabilities"],
    queryFn: fetchApiCapabilities,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  return data ?? { canEditUser: false, canDeleteUser: false }
}
