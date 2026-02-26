import { api, publicApi } from "@/api/client"
import { AuthenticationError, PermissionError } from "@/types/admin"
import { HTTPError } from "ky"
import type {
  PaginatedCandidateListResponse,
  CandidateDetail,
  CandidateListParams,
  CreateCandidateRequest,
  UpdateCandidateRequest,
  CreateCandidateLinkRequest,
  CandidateLink,
} from "@/types/candidates"

// ============================================================================
// Helpers
// ============================================================================

async function withTypedAuthErrors<T>(request: Promise<T>): Promise<T> {
  try {
    return await request
  } catch (error) {
    if (error instanceof HTTPError) {
      if (error.response.status === 401) throw new AuthenticationError()
      if (error.response.status === 403) throw new PermissionError()
    }
    throw error
  }
}

// ============================================================================
// Public Endpoints (No Authentication Required)
// ============================================================================

/** List candidates for an election */
export async function getCandidates(
  electionId: string,
  params?: CandidateListParams,
): Promise<PaginatedCandidateListResponse> {
  const searchParams: Record<string, string> = {}
  if (params?.status) searchParams.status = params.status
  if (params?.page) searchParams.page = String(params.page)
  if (params?.page_size) searchParams.page_size = String(params.page_size)

  return withTypedAuthErrors(
    publicApi
      .get(`elections/${electionId}/candidates`, { searchParams })
      .json<PaginatedCandidateListResponse>(),
  )
}

/** Get full candidate detail */
export async function getCandidateDetail(
  candidateId: string,
): Promise<CandidateDetail> {
  return withTypedAuthErrors(
    publicApi.get(`candidates/${candidateId}`).json<CandidateDetail>(),
  )
}

// ============================================================================
// Admin Endpoints (Requires admin Role)
// ============================================================================

/** Create a candidate for an election */
export async function createCandidate(
  electionId: string,
  data: CreateCandidateRequest,
): Promise<CandidateDetail> {
  return api
    .post(`elections/${electionId}/candidates`, { json: data })
    .json<CandidateDetail>()
}

/** Update a candidate */
export async function updateCandidate(
  candidateId: string,
  data: UpdateCandidateRequest,
): Promise<CandidateDetail> {
  return api
    .patch(`candidates/${candidateId}`, { json: data })
    .json<CandidateDetail>()
}

/** Delete a candidate */
export async function deleteCandidate(candidateId: string): Promise<void> {
  await api.delete(`candidates/${candidateId}`)
}

/** Add a link to a candidate */
export async function createCandidateLink(
  candidateId: string,
  data: CreateCandidateLinkRequest,
): Promise<CandidateLink> {
  return api
    .post(`candidates/${candidateId}/links`, { json: data })
    .json<CandidateLink>()
}

/** Delete a link from a candidate */
export async function deleteCandidateLink(
  candidateId: string,
  linkId: string,
): Promise<void> {
  await api.delete(`candidates/${candidateId}/links/${linkId}`)
}
