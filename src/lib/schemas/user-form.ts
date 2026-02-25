import { z } from "zod"

/**
 * Zod schema for user creation form
 *
 * Validates:
 * - Username: 3-50 chars, alphanumeric + underscore
 * - Email: valid email format
 * - Password: min 8 chars, requires letter + number
 * - Confirm password: must match password
 * - Role: one of admin, analyst, viewer
 * - is_active: defaults to true
 */
export const createUserSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must not exceed 50 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      ),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    role: z.enum(["admin", "analyst", "viewer"], {
      message: "Please select a valid role",
    }),
    is_active: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

/**
 * TypeScript type inferred from the Zod schema
 */
export type CreateUserFormValues = z.infer<typeof createUserSchema>

/**
 * Zod schema for user edit form (no username or password fields)
 */
export const editUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "analyst", "viewer"], {
    message: "Please select a valid role",
  }),
  is_active: z.boolean(),
})

/**
 * TypeScript type inferred from the edit user Zod schema
 */
export type EditUserFormValues = z.infer<typeof editUserSchema>

/**
 * Zod schema for invite user form
 *
 * Validates:
 * - Email: valid email format
 * - Role: one of admin, analyst, viewer
 */
export const inviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "analyst", "viewer"], {
    message: "Please select a valid role",
  }),
})

/**
 * TypeScript type inferred from the invite user Zod schema
 */
export type InviteUserFormValues = z.infer<typeof inviteUserSchema>

/**
 * Zod schema for invite acceptance form
 *
 * Validates:
 * - Username: 3-50 chars, alphanumeric + underscore
 * - Password: min 8 chars, requires letter + number
 * - Confirm password: must match password
 */
export const acceptInviteSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must not exceed 50 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

/**
 * TypeScript type inferred from the accept invite Zod schema
 */
export type AcceptInviteFormValues = z.infer<typeof acceptInviteSchema>
