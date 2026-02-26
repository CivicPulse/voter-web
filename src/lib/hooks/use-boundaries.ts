import { useQuery } from "@tanstack/react-query"
import { getBoundaries, getBoundaryTypes } from "@/lib/api/boundaries"
import { AuthenticationError, PermissionError } from "@/types/admin"
import { toast } from "sonner"

export function useBoundaries(params?: {
  type?: string
  search?: string
  page_size?: number
}) {
  const { type, search, page_size } = params ?? {}
  const enabled = !!type || (search?.length ?? 0) >= 2

  return useQuery({
    queryKey: ["boundaries", { type, search, page_size }],
    queryFn: () => getBoundaries({ type, search, page_size }),
    enabled,
    staleTime: 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof AuthenticationError || error instanceof PermissionError) {
        if (error instanceof AuthenticationError) {
          toast.error("Session expired", { description: error.message })
        } else {
          toast.error("Access denied", { description: error.message })
        }
        return false
      }
      return failureCount < 1
    },
  })
}

export function useBoundaryTypes() {
  return useQuery({
    queryKey: ["boundary-types"],
    queryFn: getBoundaryTypes,
    staleTime: 5 * 60 * 1000,
    select: (data) => data.types,
  })
}
