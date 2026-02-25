// ============================================================================
// Analysis Run Types
// ============================================================================

export type AnalysisRunStatus =
  | "pending"
  | "processing"
  | "running"
  | "completed"
  | "failed"

export interface TriggerAnalysisRequest {
  county?: string | null
  notes?: string | null
}

export interface AnalysisRun {
  id: string
  status: AnalysisRunStatus
  triggered_by?: string | null
  total_voters_analyzed?: number | null
  match_count?: number | null
  mismatch_count?: number | null
  unable_to_analyze_count?: number | null
  notes?: string | null
  started_at?: string | null
  completed_at?: string | null
  created_at: string
}

export interface PaginationMeta {
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface AnalysisRunListResponse {
  items: AnalysisRun[]
  pagination: PaginationMeta
}

// ============================================================================
// Analysis Result Types
// ============================================================================

export interface MismatchDetail {
  boundary_type: string
  registered: string
  determined: string
}

export type MatchStatus = "match" | "mismatch" | "unable_to_analyze"

export interface VoterSummary {
  id: string
  county?: string | null
  voter_registration_number?: string | null
  status?: string | null
  last_name?: string | null
  first_name?: string | null
  middle_name?: string | null
  residence_city?: string | null
  residence_zipcode?: string | null
  has_district_mismatch?: boolean | null
  present_in_latest_import?: boolean | null
}

export interface AnalysisResult {
  id: string
  analysis_run_id: string
  voter_id: string
  voter_summary?: VoterSummary | null
  determined_boundaries: Record<string, string>
  registered_boundaries: Record<string, string>
  match_status: MatchStatus
  mismatch_details?: MismatchDetail[] | null
  analyzed_at: string
}

export interface AnalysisResultListResponse {
  items: AnalysisResult[]
  pagination: PaginationMeta
}

// ============================================================================
// Type Guards
// ============================================================================

export function isActiveAnalysisRun(run: AnalysisRun): boolean {
  return (
    run.status === "pending" ||
    run.status === "processing" ||
    run.status === "running"
  )
}

export function isTerminalAnalysisRun(run: AnalysisRun): boolean {
  return run.status === "completed" || run.status === "failed"
}

