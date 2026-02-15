/**
 * Admin feature type definitions
 *
 * This module provides comprehensive TypeScript types for admin operations including:
 * - User management (list, create)
 * - Import jobs (voters, boundaries)
 * - Export jobs (data exports)
 * - Form validation schemas
 * - API request/response contracts
 *
 * @module types/admin
 */

import type { UserRole } from "./auth"

// ============================================================================
// Job Status Types - Discriminated Unions for Type-Safe State Management
// ============================================================================

/**
 * Status enum for import and export jobs.
 * Used as discriminant property for job state unions.
 */
export type JobStatus = "pending" | "processing" | "completed" | "failed"

/**
 * Import type discriminant for categorizing import operations.
 */
export type ImportType = "voters" | "boundaries"

/**
 * Export type discriminant for categorizing export operations.
 */
export type ExportType = "voters" | "boundaries" | "full_database"

// ============================================================================
// User Management Types
// ============================================================================

/**
 * Extended user profile for admin user management operations.
 * Includes all fields from UserProfile plus admin-specific metadata.
 */
export interface AdminUser {
  /** Unique user identifier (UUID) */
  id: string
  /** Username for authentication */
  username: string
  /** User email address */
  email: string
  /** User role determining access permissions */
  role: UserRole
  /** Whether the user account is active */
  is_active: boolean
  /** ISO 8601 timestamp of account creation */
  created_at: string
  /** ISO 8601 timestamp of last successful login, null if never logged in */
  last_login_at: string | null
}

/**
 * Request payload for creating a new user.
 * Password must meet API security requirements.
 */
export interface CreateUserRequest {
  /** Unique username (alphanumeric, underscores, hyphens allowed) */
  username: string
  /** Valid email address */
  email: string
  /** User password (minimum 8 characters, API enforces complexity) */
  password: string
  /** Role assignment for the new user */
  role: UserRole
  /** Whether the user should be active immediately (defaults to true) */
  is_active?: boolean
}

/**
 * Response from user creation endpoint.
 * Returns the created user without password field.
 */
export interface CreateUserResponse extends AdminUser {}

/**
 * Response from user list endpoint.
 * Returns array of all users (admin-only operation).
 */
export interface UserListResponse {
  /** Array of all users in the system */
  users: AdminUser[]
  /** Total count of users (may differ from array length if pagination is added) */
  total: number
}

// ============================================================================
// Import Job Types - Discriminated Union by Status
// ============================================================================

/**
 * Base import job properties shared across all job states.
 */
interface ImportJobBase {
  /** Unique job identifier (UUID) */
  id: string
  /** Original filename of uploaded file */
  filename: string
  /** Type of import operation */
  import_type: ImportType
  /** ISO 8601 timestamp when job was created */
  created_at: string
}

/**
 * Import job in pending state - queued but not yet started.
 */
export interface ImportJobPending extends ImportJobBase {
  status: "pending"
  started_at: null
  completed_at: null
  error_message: null
  /** Progress metrics (null until processing starts) */
  total_records: null
  processed_records: null
  failed_records: null
}

/**
 * Import job currently processing.
 * Includes progress metrics for monitoring.
 */
export interface ImportJobProcessing extends ImportJobBase {
  status: "processing"
  /** ISO 8601 timestamp when processing started */
  started_at: string
  completed_at: null
  error_message: null
  /** Total number of records to process */
  total_records: number
  /** Number of records processed so far */
  processed_records: number
  /** Number of records that failed validation/import */
  failed_records: number
}

/**
 * Import job successfully completed.
 * All records processed, may include failed record count.
 */
export interface ImportJobCompleted extends ImportJobBase {
  status: "completed"
  /** ISO 8601 timestamp when processing started */
  started_at: string
  /** ISO 8601 timestamp when processing completed */
  completed_at: string
  error_message: null
  /** Total number of records processed */
  total_records: number
  /** Equal to total_records for completed jobs */
  processed_records: number
  /** Number of records that failed validation (may be > 0 even on success) */
  failed_records: number
}

/**
 * Import job failed due to error.
 * Contains error message for troubleshooting.
 */
export interface ImportJobFailed extends ImportJobBase {
  status: "failed"
  /** ISO 8601 timestamp when processing started (may be null if failed before start) */
  started_at: string | null
  /** ISO 8601 timestamp when job failed */
  completed_at: string
  /** Detailed error message describing failure cause */
  error_message: string
  /** Partial progress if job failed mid-processing (null if failed before start) */
  total_records: number | null
  processed_records: number | null
  failed_records: number | null
}

/**
 * Discriminated union of all import job states.
 * Use `job.status` to narrow type in conditional blocks.
 *
 * @example
 * ```typescript
 * function getJobProgress(job: ImportJob): number | null {
 *   if (job.status === 'processing') {
 *     return (job.processed_records / job.total_records) * 100
 *   }
 *   if (job.status === 'completed') {
 *     return 100
 *   }
 *   return null
 * }
 * ```
 */
export type ImportJob =
  | ImportJobPending
  | ImportJobProcessing
  | ImportJobCompleted
  | ImportJobFailed

/**
 * Request payload for creating a voter import job.
 * File must be CSV format, validated client-side.
 */
export interface CreateVoterImportRequest {
  /** CSV file containing voter data (max 100MB) */
  file: File
}

/**
 * Request payload for creating a boundary import job.
 * File must be GeoJSON or Shapefile (zipped), validated client-side.
 */
export interface CreateBoundaryImportRequest {
  /** GeoJSON or zipped Shapefile containing boundary geometries (max 100MB) */
  file: File
  /** Boundary type identifier (e.g., 'county', 'precinct', 'congressional_district') */
  boundary_type: string
}

/**
 * Response from import job creation endpoint.
 * Returns initial job state (always pending).
 */
export interface CreateImportResponse extends ImportJobPending {}

/**
 * Response from import job status endpoint.
 * Returns current job state.
 */
export interface GetImportResponse extends ImportJob {}

/**
 * Response from import job list endpoint.
 * Returns all import jobs, sorted by created_at descending.
 */
export interface ImportListResponse {
  /** Array of all import jobs */
  jobs: ImportJob[]
  /** Total count of import jobs */
  total: number
}

// ============================================================================
// Export Job Types - Discriminated Union by Status
// ============================================================================

/**
 * Base export job properties shared across all job states.
 */
interface ExportJobBase {
  /** Unique job identifier (UUID) */
  id: string
  /** Type of export operation */
  export_type: ExportType
  /** ISO 8601 timestamp when job was created */
  created_at: string
}

/**
 * Export job in pending state - queued but not yet started.
 */
export interface ExportJobPending extends ExportJobBase {
  status: "pending"
  started_at: null
  completed_at: null
  error_message: null
  download_url: null
}

/**
 * Export job currently processing.
 */
export interface ExportJobProcessing extends ExportJobBase {
  status: "processing"
  /** ISO 8601 timestamp when processing started */
  started_at: string
  completed_at: null
  error_message: null
  download_url: null
}

/**
 * Export job successfully completed.
 * Includes signed download URL with expiration.
 */
export interface ExportJobCompleted extends ExportJobBase {
  status: "completed"
  /** ISO 8601 timestamp when processing started */
  started_at: string
  /** ISO 8601 timestamp when processing completed */
  completed_at: string
  error_message: null
  /** Signed URL for downloading export file (time-limited) */
  download_url: string
}

/**
 * Export job failed due to error.
 * Contains error message for troubleshooting.
 */
export interface ExportJobFailed extends ExportJobBase {
  status: "failed"
  /** ISO 8601 timestamp when processing started (may be null if failed before start) */
  started_at: string | null
  /** ISO 8601 timestamp when job failed */
  completed_at: string
  /** Detailed error message describing failure cause */
  error_message: string
  download_url: null
}

/**
 * Discriminated union of all export job states.
 * Use `job.status` to narrow type in conditional blocks.
 *
 * @example
 * ```typescript
 * function canDownload(job: ExportJob): boolean {
 *   return job.status === 'completed' && job.download_url !== null
 * }
 * ```
 */
export type ExportJob =
  | ExportJobPending
  | ExportJobProcessing
  | ExportJobCompleted
  | ExportJobFailed

/**
 * Request payload for creating an export job.
 */
export interface CreateExportRequest {
  /** Type of data to export */
  export_type: ExportType
  /** Optional filters for export (format depends on export_type) */
  filters?: Record<string, unknown>
}

/**
 * Response from export job creation endpoint.
 * Returns initial job state (always pending).
 */
export interface CreateExportResponse extends ExportJobPending {}

/**
 * Response from export job status endpoint.
 * Returns current job state.
 */
export interface GetExportResponse extends ExportJob {}

/**
 * Response from export job list endpoint.
 * Returns all export jobs, sorted by created_at descending.
 */
export interface ExportListResponse {
  /** Array of all export jobs */
  jobs: ExportJob[]
  /** Total count of export jobs */
  total: number
}

// ============================================================================
// Permission Error Types
// ============================================================================

/**
 * Error response when user lacks required permissions.
 * Returned with HTTP 403 Forbidden status.
 */
export interface PermissionError {
  /** Error type identifier */
  error: "permission_denied" | "insufficient_role"
  /** Human-readable error message */
  message: string
  /** Required role for the attempted operation */
  required_role?: UserRole
  /** User's current role */
  current_role?: UserRole
}

/**
 * Error response when authentication token is invalid or expired.
 * Returned with HTTP 401 Unauthorized status.
 */
export interface AuthenticationError {
  /** Error type identifier */
  error: "unauthorized" | "token_expired" | "invalid_token"
  /** Human-readable error message */
  message: string
}

/**
 * Generic API error response structure.
 * Used for validation errors, server errors, etc.
 */
export interface ApiError {
  /** HTTP status code */
  status: number
  /** Error type or code */
  error: string
  /** Human-readable error message */
  message: string
  /** Additional error details (e.g., validation field errors) */
  details?: Record<string, unknown>
}

// ============================================================================
// Form Schema Types (for React Hook Form + Zod)
// ============================================================================

/**
 * Form values for user creation form.
 * Matches CreateUserRequest but may include additional UI-only fields.
 */
export interface UserFormValues {
  username: string
  email: string
  password: string
  confirmPassword: string
  role: UserRole
  is_active: boolean
}

/**
 * Form values for voter import upload.
 */
export interface VoterImportFormValues {
  file: File | null
}

/**
 * Form values for boundary import upload.
 */
export interface BoundaryImportFormValues {
  file: File | null
  boundary_type: string
}

/**
 * Form values for export request.
 */
export interface ExportFormValues {
  export_type: ExportType
  filters?: Record<string, unknown>
}

// ============================================================================
// Utility Types for Conditional Rendering
// ============================================================================

/**
 * Type guard to check if job is in active state (pending or processing).
 * Used to determine if polling should be active.
 *
 * @example
 * ```typescript
 * const shouldPoll = isActiveJob(job)
 * ```
 */
export function isActiveJob(job: ImportJob | ExportJob): boolean {
  return job.status === "pending" || job.status === "processing"
}

/**
 * Type guard to check if job is in terminal state (completed or failed).
 * Used to determine if polling should stop.
 */
export function isTerminalJob(job: ImportJob | ExportJob): boolean {
  return job.status === "completed" || job.status === "failed"
}

/**
 * Type guard to narrow ImportJob to failed state.
 */
export function isFailedImport(job: ImportJob): job is ImportJobFailed {
  return job.status === "failed"
}

/**
 * Type guard to narrow ExportJob to completed state.
 */
export function isCompletedExport(job: ExportJob): job is ExportJobCompleted {
  return job.status === "completed"
}

/**
 * Extract progress percentage from import job (0-100).
 * Returns null for non-processing jobs.
 */
export function getImportProgress(job: ImportJob): number | null {
  if (job.status === "processing" && job.total_records > 0) {
    return (job.processed_records / job.total_records) * 100
  }
  if (job.status === "completed") {
    return 100
  }
  return null
}

// ============================================================================
// File Validation Types
// ============================================================================

/**
 * Maximum file size for uploads (100MB in bytes).
 */
export const MAX_FILE_SIZE = 100 * 1024 * 1024

/**
 * Accepted MIME types and extensions for voter import files.
 */
export const VOTER_FILE_TYPES = ["text/csv", "application/csv", ".csv"] as const

/**
 * Accepted MIME types and extensions for boundary import files.
 */
export const BOUNDARY_FILE_TYPES = [
  "application/geo+json",
  "application/json",
  ".geojson",
  ".json",
  "application/zip",
  "application/x-zip-compressed",
  ".zip",
] as const

/**
 * File validation error types.
 */
export interface FileValidationError {
  type: "size" | "type" | "unknown"
  message: string
  maxSize?: number
  actualSize?: number
  allowedTypes?: readonly string[]
  actualType?: string
}

/**
 * File validation result.
 * Success returns true, failure returns error details.
 */
export type FileValidationResult = true | FileValidationError
