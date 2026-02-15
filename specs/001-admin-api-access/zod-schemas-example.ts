/**
 * Example Zod schemas for admin feature forms
 *
 * These schemas demonstrate how to create runtime validation that aligns
 * with the TypeScript types defined in src/types/admin.ts.
 *
 * These are examples for reference - actual implementations should be
 * placed in appropriate locations (e.g., src/lib/schemas/admin.ts)
 *
 * @module schemas/admin
 */

import { z } from "zod"
import {
  MAX_FILE_SIZE,
  VOTER_FILE_TYPES,
  BOUNDARY_FILE_TYPES,
  type UserFormValues,
  type VoterImportFormValues,
  type BoundaryImportFormValues,
  type ExportFormValues,
} from "@/types/admin"

// ============================================================================
// User Management Schemas
// ============================================================================

/**
 * Zod schema for user creation form.
 * Validates username, email, password, and includes password confirmation.
 *
 * Type inference: z.infer<typeof userFormSchema> matches UserFormValues
 */
export const userFormSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must be less than 50 characters")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Username can only contain letters, numbers, underscores, and hyphens"
      ),

    email: z
      .string()
      .email("Invalid email address")
      .max(255, "Email must be less than 255 characters"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters")
      .regex(
        /[A-Z]/,
        "Password must contain at least one uppercase letter"
      )
      .regex(
        /[a-z]/,
        "Password must contain at least one lowercase letter"
      )
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),

    confirmPassword: z.string(),

    role: z.enum(["admin", "analyst", "viewer"], {
      errorMap: () => ({ message: "Please select a valid role" }),
    }),

    is_active: z.boolean().default(true),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

// Type assertion to ensure schema infers correct type
const _userFormTypeCheck: z.infer<typeof userFormSchema> = {} as UserFormValues

// ============================================================================
// File Upload Schemas
// ============================================================================

/**
 * File validation helper for Zod schemas.
 * Checks file type by MIME type and extension.
 */
function validateFileType(file: File, allowedTypes: readonly string[]): boolean {
  return allowedTypes.some((type) => {
    if (type.startsWith(".")) {
      // Extension check
      return file.name.toLowerCase().endsWith(type.toLowerCase())
    }
    // MIME type check
    return file.type === type
  })
}

/**
 * Zod schema for voter import file upload.
 * Validates CSV file type and 100MB size limit.
 */
export const voterImportSchema = z.object({
  file: z
    .instanceof(File, { message: "Please select a file" })
    .refine(
      (file) => file.size > 0,
      "File is empty"
    )
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      {
        message: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        params: { maxSize: MAX_FILE_SIZE },
      }
    )
    .refine(
      (file) => validateFileType(file, VOTER_FILE_TYPES),
      {
        message: "File must be in CSV format (.csv)",
        params: { allowedTypes: VOTER_FILE_TYPES },
      }
    )
    .nullable(),
})

const _voterImportTypeCheck: z.infer<typeof voterImportSchema> = {} as VoterImportFormValues

/**
 * Zod schema for boundary import file upload.
 * Validates GeoJSON or Shapefile (zip) format and 100MB size limit.
 */
export const boundaryImportSchema = z.object({
  file: z
    .instanceof(File, { message: "Please select a file" })
    .refine(
      (file) => file.size > 0,
      "File is empty"
    )
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      {
        message: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        params: { maxSize: MAX_FILE_SIZE },
      }
    )
    .refine(
      (file) => validateFileType(file, BOUNDARY_FILE_TYPES),
      {
        message: "File must be GeoJSON (.geojson, .json) or zipped Shapefile (.zip)",
        params: { allowedTypes: BOUNDARY_FILE_TYPES },
      }
    )
    .nullable(),

  boundary_type: z
    .string()
    .min(1, "Boundary type is required")
    .max(100, "Boundary type must be less than 100 characters"),
})

const _boundaryImportTypeCheck: z.infer<typeof boundaryImportSchema> = {} as BoundaryImportFormValues

// ============================================================================
// Export Schemas
// ============================================================================

/**
 * Zod schema for export request form.
 * Validates export type and optional filters.
 */
export const exportFormSchema = z.object({
  export_type: z.enum(["voters", "boundaries", "full_database"], {
    errorMap: () => ({ message: "Please select a valid export type" }),
  }),

  filters: z
    .record(z.unknown())
    .optional()
    .describe("Optional filters for the export (format depends on export_type)"),
})

const _exportFormTypeCheck: z.infer<typeof exportFormSchema> = {} as ExportFormValues

// ============================================================================
// Confirmation Dialog Schemas
// ============================================================================

/**
 * Schema for user creation confirmation dialog.
 * Extracts fields that need confirmation (elevated roles).
 */
export const userConfirmationSchema = z.object({
  username: z.string(),
  email: z.string(),
  role: z.enum(["admin", "analyst", "viewer"]),
})

/**
 * Schema for import confirmation dialog.
 * Displays file details before triggering import.
 */
export const importConfirmationSchema = z.object({
  filename: z.string(),
  fileSize: z.number(),
  importType: z.enum(["voters", "boundaries"]),
})

// ============================================================================
// Helper Functions for Form Validation
// ============================================================================

/**
 * Format file size for display in error messages and confirmations.
 *
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "15.2 MB", "3.8 KB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Get user-friendly file type description.
 *
 * @param importType Import type discriminant
 * @returns Human-readable description
 */
export function getFileTypeDescription(importType: "voters" | "boundaries"): string {
  switch (importType) {
    case "voters":
      return "CSV file (.csv)"
    case "boundaries":
      return "GeoJSON (.geojson, .json) or zipped Shapefile (.zip)"
  }
}

/**
 * Get allowed file extensions for file input accept attribute.
 *
 * @param importType Import type discriminant
 * @returns Accept attribute value for <input type="file">
 */
export function getFileInputAccept(importType: "voters" | "boundaries"): string {
  switch (importType) {
    case "voters":
      return ".csv,text/csv,application/csv"
    case "boundaries":
      return ".geojson,.json,application/geo+json,application/json,.zip,application/zip"
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example: User creation form with validation
 *
 * ```typescript
 * import { useForm } from "react-hook-form"
 * import { zodResolver } from "@hookform/resolvers/zod"
 * import { userFormSchema } from "@/lib/schemas/admin"
 *
 * function UserCreateForm() {
 *   const form = useForm<UserFormValues>({
 *     resolver: zodResolver(userFormSchema),
 *     defaultValues: {
 *       is_active: true,
 *     },
 *   })
 *
 *   const onSubmit = async (values: UserFormValues) => {
 *     // Remove UI-only field
 *     const { confirmPassword, ...request } = values
 *
 *     // Call API
 *     const response = await api
 *       .post("users", { json: request })
 *       .json<CreateUserResponse>()
 *
 *     // Handle response
 *   }
 *
 *   return (
 *     <Form {...form}>
 *       <form onSubmit={form.handleSubmit(onSubmit)}>
 *         <FormField name="username" ... />
 *         <FormField name="email" ... />
 *         <FormField name="password" ... />
 *         <FormField name="confirmPassword" ... />
 *         <FormField name="role" ... />
 *         <FormField name="is_active" ... />
 *         <Button type="submit">Create User</Button>
 *       </form>
 *     </Form>
 *   )
 * }
 * ```
 */

/**
 * Example: Voter import with file validation
 *
 * ```typescript
 * import { useForm } from "react-hook-form"
 * import { zodResolver } from "@hookform/resolvers/zod"
 * import { voterImportSchema } from "@/lib/schemas/admin"
 *
 * function VoterImportDialog() {
 *   const [showConfirm, setShowConfirm] = useState(false)
 *   const [selectedFile, setSelectedFile] = useState<File | null>(null)
 *
 *   const form = useForm<VoterImportFormValues>({
 *     resolver: zodResolver(voterImportSchema),
 *   })
 *
 *   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
 *     const file = e.target.files?.[0]
 *     if (!file) return
 *
 *     // Validate using Zod schema
 *     const result = voterImportSchema.safeParse({ file })
 *
 *     if (!result.success) {
 *       // Show validation errors
 *       form.setError("file", {
 *         message: result.error.errors[0].message,
 *       })
 *       return
 *     }
 *
 *     // File is valid, show confirmation
 *     setSelectedFile(file)
 *     setShowConfirm(true)
 *   }
 *
 *   const onConfirm = async () => {
 *     if (!selectedFile) return
 *
 *     const formData = new FormData()
 *     formData.append("file", selectedFile)
 *
 *     const response = await api
 *       .post("imports/voters", { body: formData })
 *       .json<CreateImportResponse>()
 *
 *     // Handle response
 *     setShowConfirm(false)
 *   }
 *
 *   return (
 *     <>
 *       <input
 *         type="file"
 *         accept={getFileInputAccept("voters")}
 *         onChange={handleFileSelect}
 *       />
 *
 *       <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
 *         <DialogContent>
 *           <DialogHeader>
 *             <DialogTitle>Confirm Import</DialogTitle>
 *           </DialogHeader>
 *           <div>
 *             <p>File: {selectedFile?.name}</p>
 *             <p>Size: {formatFileSize(selectedFile?.size ?? 0)}</p>
 *             <p>Type: Voter Import (CSV)</p>
 *           </div>
 *           <DialogFooter>
 *             <Button variant="outline" onClick={() => setShowConfirm(false)}>
 *               Cancel
 *             </Button>
 *             <Button onClick={onConfirm}>Confirm Import</Button>
 *           </DialogFooter>
 *         </DialogContent>
 *       </Dialog>
 *     </>
 *   )
 * }
 * ```
 */

/**
 * Example: Real-time file validation feedback
 *
 * ```typescript
 * function FileUploadInput({ importType }: { importType: "voters" | "boundaries" }) {
 *   const [fileError, setFileError] = useState<string | null>(null)
 *
 *   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 *     const file = e.target.files?.[0]
 *     if (!file) {
 *       setFileError(null)
 *       return
 *     }
 *
 *     // Immediate validation feedback
 *     if (file.size > MAX_FILE_SIZE) {
 *       setFileError(
 *         `File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`
 *       )
 *       return
 *     }
 *
 *     const allowedTypes = importType === "voters" ? VOTER_FILE_TYPES : BOUNDARY_FILE_TYPES
 *     if (!validateFileType(file, allowedTypes)) {
 *       setFileError(`Invalid file type. Expected: ${getFileTypeDescription(importType)}`)
 *       return
 *     }
 *
 *     // File is valid
 *     setFileError(null)
 *     // Proceed with upload...
 *   }
 *
 *   return (
 *     <div>
 *       <input
 *         type="file"
 *         accept={getFileInputAccept(importType)}
 *         onChange={handleFileChange}
 *       />
 *       {fileError && (
 *         <p className="text-sm text-destructive mt-1">{fileError}</p>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
