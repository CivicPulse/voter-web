/**
 * Format a number as a locale-aware integer with commas.
 */
export function formatNumber(value: number | null): string {
  if (value === null) return "N/A"
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 })
}

/**
 * Format a number as US currency (no cents).
 */
export function formatCurrency(value: number | null): string {
  if (value === null) return "N/A"
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  })
}

/**
 * Format a number as a percentage with one decimal place.
 * Expects value in 0-100 scale.
 */
export function formatPercent(value: number | null): string {
  if (value === null) return "N/A"
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

/**
 * Format a decimal number with one decimal place.
 */
export function formatDecimal(value: number | null): string {
  if (value === null) return "N/A"
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}
