/**
 * Election search URL schema and filter mapping.
 *
 * Extracted from the elections route to satisfy the react-refresh
 * only-export-components lint rule while keeping exports testable.
 *
 * @module lib/election-search
 */

import { z } from "zod"
import type { ElectionFilters } from "@/types/elections"

// ---------------------------------------------------------------------------
// Zod search schema -- defines URL search param types for the elections page
// ---------------------------------------------------------------------------

export const electionSearchSchema = z.object({
  status: z.enum(["active", "finalized"]).optional().catch(undefined),
  type: z
    .enum(["general", "primary", "special", "runoff"])
    .optional()
    .catch(undefined),
  date_from: z.string().optional().catch(undefined),
  date_to: z.string().optional().catch(undefined),
  date_preset: z.enum(["all-time"]).optional().catch(undefined),
  reg_open: z.literal("true").optional().catch(undefined),
  early_voting: z.literal("true").optional().catch(undefined),
  search: z.string().optional().catch(undefined),
  page: z.coerce.number().int().positive().optional().catch(undefined),
})

export type ElectionSearchParams = z.infer<typeof electionSearchSchema>

// ---------------------------------------------------------------------------
// URL param to API filter mapping
// ---------------------------------------------------------------------------

export function mapParamsToApiFilters(
  params: ElectionSearchParams,
  defaultDates: { date_from: string; date_to: string },
): Partial<ElectionFilters> {
  const isAllTime = params.date_preset === "all-time"
  return {
    status: params.status ?? "all",
    election_type: params.type ?? "all",
    date_from: isAllTime ? null : (params.date_from ?? defaultDates.date_from),
    date_to: isAllTime ? null : (params.date_to ?? defaultDates.date_to),
    registration_open: params.reg_open === "true" ? true : undefined,
    early_voting_active: params.early_voting === "true" ? true : undefined,
  }
}
