/**
 * Date preset definitions and resolution for the elections list date filter.
 *
 * Presets provide user-friendly date range shortcuts. The URL stores resolved
 * date_from/date_to values (not the preset key) so shared URLs are stable.
 *
 * @module lib/date-presets
 */

/** All supported date preset keys */
export type DatePresetKey =
  | "next-3-months"
  | "next-6-months"
  | "this-year"
  | "last-30-days"
  | "last-6-months"
  | "last-year"
  | "all-time"
  | "custom"

/** A date preset option for the dropdown */
export interface DatePreset {
  key: DatePresetKey
  label: string
}

/** Ordered list of date presets for the dropdown */
export const DATE_PRESETS: DatePreset[] = [
  { key: "next-3-months", label: "Next 3 months" },
  { key: "next-6-months", label: "Next 6 months" },
  { key: "this-year", label: "This year" },
  { key: "last-30-days", label: "Last 30 days" },
  { key: "last-6-months", label: "Last 6 months" },
  { key: "last-year", label: "Last year" },
  { key: "all-time", label: "All time" },
  { key: "custom", label: "Custom range" },
]

/** The default preset applied when no date params are in the URL */
export const DEFAULT_PRESET: DatePresetKey = "next-3-months"

/** Format a Date to YYYY-MM-DD string using local date parts (timezone-safe) */
function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/**
 * Resolve a preset key to concrete date_from / date_to values.
 *
 * "all-time" and "custom" return both values undefined (no date filtering).
 * All other presets return ISO date strings (YYYY-MM-DD).
 */
export function resolvePreset(
  key: DatePresetKey,
): { date_from?: string; date_to?: string } {
  const today = new Date()

  switch (key) {
    case "next-3-months": {
      const end = new Date(today)
      end.setMonth(end.getMonth() + 3)
      return { date_from: formatDate(today), date_to: formatDate(end) }
    }
    case "next-6-months": {
      const end = new Date(today)
      end.setMonth(end.getMonth() + 6)
      return { date_from: formatDate(today), date_to: formatDate(end) }
    }
    case "this-year":
      return {
        date_from: `${today.getFullYear()}-01-01`,
        date_to: `${today.getFullYear()}-12-31`,
      }
    case "last-30-days": {
      const start = new Date(today)
      start.setDate(start.getDate() - 30)
      return { date_from: formatDate(start), date_to: formatDate(today) }
    }
    case "last-6-months": {
      const start = new Date(today)
      start.setMonth(start.getMonth() - 6)
      return { date_from: formatDate(start), date_to: formatDate(today) }
    }
    case "last-year": {
      const year = today.getFullYear() - 1
      return { date_from: `${year}-01-01`, date_to: `${year}-12-31` }
    }
    case "all-time":
    case "custom":
      return { date_from: undefined, date_to: undefined }
  }
}

/**
 * Reverse-match a pair of date strings against all presets.
 *
 * Returns the matching preset key, or "custom" if no preset matches.
 */
export function matchPreset(
  date_from?: string,
  date_to?: string,
): DatePresetKey {
  // Check each non-special preset for an exact match
  const checkableKeys: DatePresetKey[] = [
    "next-3-months",
    "next-6-months",
    "this-year",
    "last-30-days",
    "last-6-months",
    "last-year",
  ]

  for (const key of checkableKeys) {
    const resolved = resolvePreset(key)
    if (resolved.date_from === date_from && resolved.date_to === date_to) {
      return key
    }
  }

  return "custom"
}

/**
 * Convenience function returning the default date range (Next 3 months)
 * with both values guaranteed to be defined strings.
 */
export function getDefaultDateRange(): { date_from: string; date_to: string } {
  const resolved = resolvePreset(DEFAULT_PRESET)
  if (!resolved.date_from || !resolved.date_to) {
    throw new Error(
      `DEFAULT_PRESET "${DEFAULT_PRESET}" must resolve to concrete dates`,
    )
  }
  return { date_from: resolved.date_from, date_to: resolved.date_to }
}
