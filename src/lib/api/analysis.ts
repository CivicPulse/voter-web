import { api } from "@/api/client"
import type {
  AnalysisRun,
  AnalysisRunListResponse,
  AnalysisResultListResponse,
  TriggerAnalysisRequest,
  MatchStatus,
} from "@/types/analysis"

export async function getAnalysisRuns(params?: {
  status?: string
  page?: number
  page_size?: number
}): Promise<AnalysisRunListResponse> {
  const searchParams: Record<string, string> = {}
  if (params?.status) searchParams.status = params.status
  if (params?.page) searchParams.page = String(params.page)
  if (params?.page_size) searchParams.page_size = String(params.page_size)

  return api
    .get("analysis/runs", { searchParams })
    .json<AnalysisRunListResponse>()
}

export async function getAnalysisRun(runId: string): Promise<AnalysisRun> {
  return api.get(`analysis/runs/${runId}`).json<AnalysisRun>()
}

export async function triggerAnalysisRun(
  request: TriggerAnalysisRequest
): Promise<AnalysisRun> {
  return api.post("analysis/runs", { json: request }).json<AnalysisRun>()
}

export async function getAnalysisResults(
  runId: string,
  params?: {
    match_status?: MatchStatus
    county?: string
    page?: number
    page_size?: number
  }
): Promise<AnalysisResultListResponse> {
  const searchParams: Record<string, string> = {}
  if (params?.match_status) searchParams.match_status = params.match_status
  if (params?.county) searchParams.county = params.county
  if (params?.page) searchParams.page = String(params.page)
  if (params?.page_size) searchParams.page_size = String(params.page_size)

  return api
    .get(`analysis/runs/${runId}/results`, { searchParams })
    .json<AnalysisResultListResponse>()
}
