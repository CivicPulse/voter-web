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

// Validates YYYY-MM-DD format without regex to avoid SonarCloud security hotspot
function isISODateString(s: string): boolean {
  if (s.length !== 10 || s[4] !== "-" || s[7] !== "-") return false
  const year = s.slice(0, 4)
  const month = s.slice(5, 7)
  const day = s.slice(8, 10)
  return [year, month, day].every((part) => part.length > 0 && !Number.isNaN(Number(part)))
}

// Reusable schema fragments to reduce duplication.
// NOTE: Zod's .catch() is NOT Promise.catch() — it provides a fallback value
// when parsing fails, ensuring graceful degradation for URL search params.
const optStr = z.string().optional().catch(undefined)
const optDate = z.string().refine(isISODateString).optional().catch(undefined)
const optFlag = z.literal("true").optional().catch(undefined)

export const electionSearchSchema = z.object({
  status: z.enum(["active", "finalized"]).optional().catch(undefined),
  type: z.enum(["general", "primary", "special", "runoff"]).optional().catch(undefined),
  date_from: optDate,
  date_to: optDate,
  date_preset: z.enum(["all-time"]).optional().catch(undefined),
  reg_open: optFlag,
  early_voting: optFlag,
  search: optStr,
  page: z.coerce.number().int().positive().optional().catch(undefined),
  q: optStr,
  race: optStr,
  county: optStr,
  election_date: optDate,
})

export type ElectionSearchParams = z.infer<typeof electionSearchSchema>

// ---------------------------------------------------------------------------
// URL param to API filter mapping
// ---------------------------------------------------------------------------

function resolveDateFilter(
  hasExactDate: boolean,
  isAllTime: boolean,
  paramDate: string | undefined,
  defaultDate: string,
): string | null {
  if (hasExactDate || isAllTime) return null
  return paramDate ?? defaultDate
}

export function mapParamsToApiFilters(
  params: ElectionSearchParams,
  defaultDates: { date_from: string; date_to: string },
): Partial<ElectionFilters> {
  const isAllTime = params.date_preset === "all-time"
  const hasExactDate = !!params.election_date

  const date_from = resolveDateFilter(hasExactDate, isAllTime, params.date_from, defaultDates.date_from)
  const date_to = resolveDateFilter(hasExactDate, isAllTime, params.date_to, defaultDates.date_to)

  return {
    status: params.status ?? "all",
    election_type: params.type ?? "all",
    date_from,
    date_to,
    registration_open: params.reg_open === "true" ? true : undefined,
    early_voting_active: params.early_voting === "true" ? true : undefined,
    q: params.q,
    race_category: params.race,
    county: params.county,
    election_date: params.election_date,
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

/** Format an ISO date string to a short human-readable format (e.g., "Nov 3, 2026") */
export function formatShortDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

/** Race category labels for chip and dropdown display */
export const RACE_CATEGORY_LABELS: Record<string, string> = {
  federal: "Federal",
  state_senate: "State Senate",
  state_house: "State House",
  local: "Local",
}

/** Capitalize first letter of a string */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Truncate a string for chip display, adding ellipsis if needed */
function truncateForChip(value: string, maxLen = 20): string {
  return value.length > maxLen ? value.slice(0, maxLen) + "..." : value
}

/** Build the label for a date preset chip */
function getDatePresetLabel(
  activePreset: DatePresetKey,
  params: ElectionSearchParams,
): string {
  if (activePreset === "custom") {
    return `${params.date_from ?? "?"} to ${params.date_to ?? "?"}`
  }
  return DATE_PRESETS.find((p) => p.key === activePreset)?.label ?? activePreset
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
    filters.push({ key: `Status: ${capitalize(params.status)}`, paramKey: "status" })
  }
  if (params.type) {
    filters.push({ key: `Type: ${capitalize(params.type)}`, paramKey: "type" })
  }
  if (activePreset !== DEFAULT_PRESET) {
    filters.push({ key: `Date: ${getDatePresetLabel(activePreset, params)}`, paramKey: "date_range" })
  }
  if (params.reg_open === "true") {
    filters.push({ key: "Registration open", paramKey: "reg_open" })
  }
  if (params.early_voting === "true") {
    filters.push({ key: "Early voting active", paramKey: "early_voting" })
  }
  if (params.search) {
    filters.push({ key: `Search: "${truncateForChip(params.search)}"`, paramKey: "search" })
  }
  if (params.q) {
    filters.push({ key: `Search: "${truncateForChip(params.q)}"`, paramKey: "q" })
  }
  if (params.race) {
    filters.push({ key: `Race: ${RACE_CATEGORY_LABELS[params.race] ?? params.race}`, paramKey: "race" })
  }
  if (params.county) {
    filters.push({ key: `County: ${params.county}`, paramKey: "county" })
  }
  if (params.election_date) {
    filters.push({ key: `Date: ${formatShortDate(params.election_date)}`, paramKey: "election_date" })
  }

  return filters
}
