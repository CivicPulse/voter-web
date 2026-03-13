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
import { DATE_PRESETS, DEFAULT_PRESET } from "@/lib/date-presets"
import type { DatePresetKey } from "@/lib/date-presets"

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

// ---------------------------------------------------------------------------
// Active filter derivation (for filter chip display)
// ---------------------------------------------------------------------------

/** Represents a single active (non-default) filter for chip display */
export interface ActiveFilter {
  /** Human-readable label for the chip */
  key: string
  /** Which URL param this filter corresponds to (for removal) */
  paramKey: string
}

/** Capitalize first letter of a string */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Compute the list of active (non-default) filters from URL params.
 * Pure function — suitable for unit testing without rendering.
 */
export function deriveActiveFilters(
  params: ElectionSearchParams,
  activePreset: DatePresetKey,
): ActiveFilter[] {
  const filters: ActiveFilter[] = []

  if (params.status) {
    filters.push({
      key: `Status: ${capitalize(params.status)}`,
      paramKey: "status",
    })
  }
  if (params.type) {
    filters.push({
      key: `Type: ${capitalize(params.type)}`,
      paramKey: "type",
    })
  }
  if (activePreset !== DEFAULT_PRESET && activePreset !== "next-3-months") {
    const label =
      activePreset === "custom"
        ? `${params.date_from ?? "?"} to ${params.date_to ?? "?"}`
        : (DATE_PRESETS.find((p) => p.key === activePreset)?.label ??
          activePreset)
    filters.push({ key: `Date: ${label}`, paramKey: "date_range" })
  }
  if (params.reg_open === "true") {
    filters.push({ key: "Registration open", paramKey: "reg_open" })
  }
  if (params.early_voting === "true") {
    filters.push({ key: "Early voting active", paramKey: "early_voting" })
  }
  if (params.search) {
    const truncated =
      params.search.length > 20
        ? params.search.slice(0, 20) + "..."
        : params.search
    filters.push({ key: `Search: "${truncated}"`, paramKey: "search" })
  }

  return filters
}
