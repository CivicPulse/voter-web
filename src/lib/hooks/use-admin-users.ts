import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUsers, createUser } from "@/lib/api/admin"
import type { CreateUserRequest } from "@/types/admin"
import {
  AuthenticationError,
  PermissionError,
  NetworkError,
} from "@/types/admin"
import { toast } from "sonner"

/**
 * Hook to fetch and cache the list of all users
 * Shows toast notifications for auth/permission/network errors
 */
export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: getUsers,
    staleTime: 30 * 1000, // Cache for 30 seconds
    retry: (failureCount, error) => {
      // Don't retry auth/permission errors
      if (
        error instanceof AuthenticationError ||
        error instanceof PermissionError
      ) {
        if (error instanceof AuthenticationError) {
          toast.error("Session expired", { description: error.message })
        } else {
          toast.error("Access denied", { description: error.message })
        }
        return false
      }

      // Handle network errors
      if (error instanceof NetworkError) {
        toast.warning("Connection issue", {
          description: "Having trouble loading users. Please try again.",
        })
        return failureCount < 1
      }

      return failureCount < 1
    },
  })
}

/**
 * Hook to create a new user
 *
 * Automatically invalidates the user list query on success
 * Shows success/error toast notifications
 */
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateUserRequest) => createUser(data),
    onSuccess: () => {
      // Invalidate and refetch user list
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      toast.success("User created", {
        description: "The user account has been created successfully.",
      })
    },
    onError: (error: Error) => {
      if (error instanceof AuthenticationError) {
        toast.error("Session expired", { description: error.message })
      } else if (error instanceof PermissionError) {
        toast.error("Access denied", { description: error.message })
      } else {
        toast.error("Failed to create user", {
          description: error.message || "An error occurred while creating the user.",
        })
      }
    },
  })
}
