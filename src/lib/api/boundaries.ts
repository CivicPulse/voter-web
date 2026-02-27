import { api } from "@/api/client"
import type { BoundaryDetailResponse, BoundaryListResponse, BoundaryTypesResponse } from "@/types/boundary"

export async function getBoundaries(params?: {
  type?: string
  search?: string
  county?: string
  page?: number
  page_size?: number
}): Promise<BoundaryListResponse> {
  const searchParams: Record<string, string> = {}
  if (params?.type) searchParams.type = params.type
  if (params?.search) searchParams.search = params.search
  if (params?.county) searchParams.county = params.county
  if (params?.page) searchParams.page = String(params.page)
  if (params?.page_size) searchParams.page_size = String(params.page_size)

  return api.get("boundaries", { searchParams }).json<BoundaryListResponse>()
}

export async function getBoundaryTypes(): Promise<BoundaryTypesResponse> {
  return api.get("boundaries/types").json<BoundaryTypesResponse>()
}

export async function getBoundaryDetail(id: string): Promise<BoundaryDetailResponse> {
  return api.get(`boundaries/${id}`).json<BoundaryDetailResponse>()
}
