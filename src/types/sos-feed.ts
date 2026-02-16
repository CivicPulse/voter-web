import type { ElectionFormValues } from "@/lib/schemas/election-form"
import type { ElectionType } from "@/types/elections"

/** Raw shape from SOS JSON feed (nullable fields reflect wire format) */
export interface SosFeedRawResponse {
  electionDate: string | null
  electionName: string | null
  createdAt: string | null
  results: SosFeedResults | null
  /** Intentionally untyped — unused in current implementation */
  localResults: unknown[]
}

/** Validated SOS feed response — guaranteed to have required fields */
export interface SosFeedResponse {
  electionDate: string
  electionName: string
  createdAt: string | null
  results: SosFeedResults
  /** Intentionally untyped — unused in current implementation */
  localResults: unknown[]
}

export interface SosFeedResults {
  id: string
  name: string
  ballotItems: SosFeedBallotItem[] | null
  /** Intentionally untyped — unused in current implementation */
  reportingStatuses: unknown[]
}

export interface SosFeedBallotItem {
  type: string | null
  id: string
  name: string | null
  contestType: string | null
  precinctsParticipating: number | null
  precinctsReporting: number | null
  /** Intentionally untyped — unused in current implementation */
  ballotOptions: unknown[]
}

/** Fields that can be auto-filled from the SOS feed */
export type AutoFillableField = Extract<
  keyof ElectionFormValues,
  "name" | "election_date" | "election_type" | "district"
>

/** Shape of the auto-fill result */
export interface SosAutoFillResult {
  name: string
  election_date: string
  election_type: ElectionType | null
  district: string
}
