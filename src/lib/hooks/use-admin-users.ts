import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUsers, createUser } from "@/lib/api/admin"
import type { CreateUserRequest } from "@/types/admin"

/**
 * Hook to fetch and cache the list of all users
 */
export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: getUsers,
    staleTime: 30 * 1000, // Cache for 30 seconds
    retry: 1,
  })
}

/**
 * Hook to create a new user
 *
 * Automatically invalidates the user list query on success
 */
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateUserRequest) => createUser(data),
    onSuccess: () => {
      // Invalidate and refetch user list
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    },
  })
}
