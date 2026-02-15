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
