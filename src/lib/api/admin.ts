import { api, publicApi } from "@/api/client"
import type {
  AdminUser,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UserListResponse,
  ImportJob,
  ImportListResponse,
  ExportJob,
  ExportListResponse,
  CreateExportRequest,
  InviteCreateRequest,
  InviteListResponse,
  InviteAcceptRequest,
  InviteAcceptResponse,
  Invite,
} from "@/types/admin"

// ============================================================================
// User Management
// ============================================================================

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<AdminUser> {
  return api.get("auth/me").json<AdminUser>()
}

/**
 * List all users (admin-only)
 */
export async function getUsers(): Promise<UserListResponse> {
  return api.get("users").json<UserListResponse>()
}

/**
 * Create a new user (admin-only)
 */
export async function createUser(
  data: CreateUserRequest
): Promise<CreateUserResponse> {
  return api.post("users", { json: data }).json<CreateUserResponse>()
}

/**
 * Update an existing user (admin-only)
 */
export async function updateUser(
  id: string,
  data: UpdateUserRequest
): Promise<AdminUser> {
  return api.patch(`users/${id}`, { json: data }).json<AdminUser>()
}

/**
 * Delete a user (admin-only) — returns 204 No Content
 */
export async function deleteUser(id: string): Promise<void> {
  await api.delete(`users/${id}`)
}

// ============================================================================
// Invite Management
// ============================================================================

/**
 * List all invites (admin-only)
 */
export async function getInvites(): Promise<InviteListResponse> {
  return api.get("users/invites").json<InviteListResponse>()
}

/**
 * Create a new invite (admin-only)
 */
export async function createInvite(
  data: InviteCreateRequest
): Promise<Invite> {
  return api.post("users/invites", { json: data }).json<Invite>()
}

/**
 * Cancel an invite (admin-only) — returns 204 No Content
 */
export async function cancelInvite(id: string): Promise<void> {
  await api.delete(`users/invites/${id}`)
}

/**
 * Resend an invite (admin-only)
 */
export async function resendInvite(id: string): Promise<Invite> {
  return api.post(`users/invites/${id}/resend`).json<Invite>()
}

/**
 * Accept an invite (public — no auth required)
 */
export async function acceptInvite(
  data: InviteAcceptRequest
): Promise<InviteAcceptResponse> {
  return publicApi
    .post("auth/invite/accept", { json: data })
    .json<InviteAcceptResponse>()
}

// ============================================================================
// Import Operations
// ============================================================================

/**
 * List all import jobs
 */
export async function getImportJobs(): Promise<ImportListResponse> {
  return api.get("imports").json<ImportListResponse>()
}

/**
 * Get a specific import job by ID
 */
export async function getImportJob(jobId: string): Promise<ImportJob> {
  return api.get(`imports/${jobId}`).json<ImportJob>()
}

/**
 * Create a voter import job
 */
export async function createVoterImport(file: File): Promise<ImportJob> {
  const formData = new FormData()
  formData.append("file", file)

  return api.post("imports/voters", { body: formData }).json<ImportJob>()
}

/**
 * Create a boundary import job
 */
export async function createBoundaryImport(
  file: File,
  boundaryType?: string
): Promise<ImportJob> {
  const formData = new FormData()
  formData.append("file", file)
  if (boundaryType) {
    formData.append("boundary_type", boundaryType)
  }

  return api.post("imports/boundaries", { body: formData }).json<ImportJob>()
}

// ============================================================================
// Export Operations
// ============================================================================

/**
 * List all export jobs
 */
export async function getExportJobs(): Promise<ExportListResponse> {
  return api.get("exports").json<ExportListResponse>()
}

/**
 * Get a specific export job by ID
 */
export async function getExportJob(jobId: string): Promise<ExportJob> {
  return api.get(`exports/${jobId}`).json<ExportJob>()
}

/**
 * Create an export job
 */
export async function createExport(
  request: CreateExportRequest
): Promise<ExportJob> {
  return api.post("exports", { json: request }).json<ExportJob>()
}

/**
 * Download an export file
 * Returns a Blob that can be used to trigger browser download
 */
export async function downloadExport(jobId: string): Promise<Blob> {
  return api.get(`exports/${jobId}/download`).blob()
}
