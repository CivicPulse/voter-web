import type { CandidateResult } from "@/types/elections"

/** Maps candidate ID to their assigned color */
export type CandidateColorMap = Map<string, { fill: string; border: string }>

/** Shade palettes per party: vivid (rank 0 / top vote-getter) → light */
export const PARTY_SHADE_PALETTES: Record<
  string,
  { fill: string; border: string }[]
> = {
  Dem: [
    { fill: "#2563eb", border: "#1d4ed8" },
    { fill: "#3b82f6", border: "#2563eb" },
    { fill: "#60a5fa", border: "#3b82f6" },
    { fill: "#93c5fd", border: "#60a5fa" },
    { fill: "#bfdbfe", border: "#93c5fd" },
  ],
  Rep: [
    { fill: "#dc2626", border: "#b91c1c" },
    { fill: "#ef4444", border: "#dc2626" },
    { fill: "#f87171", border: "#ef4444" },
    { fill: "#fca5a5", border: "#f87171" },
    { fill: "#fecaca", border: "#fca5a5" },
  ],
  Ind: [
    { fill: "#7c3aed", border: "#6d28d9" },
    { fill: "#8b5cf6", border: "#7c3aed" },
    { fill: "#a78bfa", border: "#8b5cf6" },
    { fill: "#c4b5fd", border: "#a78bfa" },
    { fill: "#ddd6fe", border: "#c4b5fd" },
  ],
  Lib: [
    { fill: "#eab308", border: "#ca8a04" },
    { fill: "#facc15", border: "#eab308" },
    { fill: "#fde047", border: "#facc15" },
    { fill: "#fef08a", border: "#fde047" },
    { fill: "#fef9c3", border: "#fef08a" },
  ],
  Grn: [
    { fill: "#16a34a", border: "#15803d" },
    { fill: "#22c55e", border: "#16a34a" },
    { fill: "#4ade80", border: "#22c55e" },
    { fill: "#86efac", border: "#4ade80" },
    { fill: "#bbf7d0", border: "#86efac" },
  ],
}

const DEFAULT_SHADE_PALETTE: { fill: string; border: string }[] = [
  { fill: "#9ca3af", border: "#6b7280" },
  { fill: "#d1d5db", border: "#9ca3af" },
  { fill: "#e5e7eb", border: "#d1d5db" },
  { fill: "#f3f4f6", border: "#e5e7eb" },
  { fill: "#f9fafb", border: "#f3f4f6" },
]

/**
 * Build a color map assigning each candidate a unique shade based on
 * party affiliation and intra-party vote ranking.
 *
 * Candidates are sorted by descending vote count. Within each party,
 * the top vote-getter gets the most vivid shade (index 0) and
 * subsequent candidates get progressively lighter shades.
 */
export function buildCandidateColorMap(
  candidates: CandidateResult[],
): CandidateColorMap {
  const colorMap: CandidateColorMap = new Map()

  // Sort all candidates by descending vote count (stable)
  const sorted = [...candidates].sort((a, b) => b.vote_count - a.vote_count)

  // Track intra-party index
  const partyIndex = new Map<string, number>()

  for (const candidate of sorted) {
    const party = candidate.political_party
    const idx = partyIndex.get(party) ?? 0
    partyIndex.set(party, idx + 1)

    const palette = PARTY_SHADE_PALETTES[party] ?? DEFAULT_SHADE_PALETTE
    const shade = palette[idx % palette.length]
    colorMap.set(candidate.id, shade)
  }

  return colorMap
}
