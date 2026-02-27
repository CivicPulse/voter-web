import L from "leaflet"
import { DISTRICT_COLORS } from "@/lib/colors"
import type { VoterGeocodedLocation } from "@/types/lookup"

export interface ProviderColor {
  fill: string
  border: string
  label: string
}

/** Stable color assignments for the 6 known geocoding providers */
export const PROVIDER_COLORS: Record<string, ProviderColor> = {
  nominatim: { fill: "#4363d8", border: "#2e45a0", label: "Nominatim" },
  google:    { fill: "#e6194b", border: "#a01235", label: "Google" },
  photon:    { fill: "#3cb44b", border: "#2a7d34", label: "Photon" },
  census:    { fill: "#f58231", border: "#b55f1e", label: "Census" },
  usps:      { fill: "#911eb4", border: "#6b1685", label: "USPS" },
  manual:    { fill: "#42d4f4", border: "#2a9ab0", label: "Manual" },
}

/**
 * Returns a ProviderColor for a given source_type.
 * Falls back to DISTRICT_COLORS cycling for unknown providers.
 */
export function getProviderColor(sourceType: string, fallbackIndex: number): ProviderColor {
  const key = sourceType.toLowerCase()
  if (key in PROVIDER_COLORS) return PROVIDER_COLORS[key]
  const dc = DISTRICT_COLORS[fallbackIndex % DISTRICT_COLORS.length]
  return {
    fill: dc.fill,
    border: dc.border,
    label: sourceType.charAt(0).toUpperCase() + sourceType.slice(1),
  }
}

/**
 * Creates a Leaflet DivIcon for a provider marker using inline SVG.
 * Primary markers: 24px circle with white outer ring.
 * Secondary markers: 16px circle at 80% opacity.
 */
export function createProviderDivIcon(
  color: ProviderColor,
  isPrimary: boolean,
  matchRingColor?: string,
): L.DivIcon {
  if (isPrimary) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      ${matchRingColor ? `<circle cx="14" cy="14" r="13" fill="none" stroke="${matchRingColor}" stroke-width="3"/>` : ""}
      <circle cx="14" cy="14" r="11" fill="white" stroke="${color.border}" stroke-width="1.5"/>
      <circle cx="14" cy="14" r="8" fill="${color.fill}"/>
    </svg>`
    return L.divIcon({
      html: svg,
      className: "",
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    })
  } else {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" opacity="0.8">
      ${matchRingColor ? `<circle cx="10" cy="10" r="9.5" fill="none" stroke="${matchRingColor}" stroke-width="3"/>` : ""}
      <circle cx="10" cy="10" r="7" fill="${color.fill}" stroke="${color.border}" stroke-width="1.5"/>
    </svg>`
    return L.divIcon({
      html: svg,
      className: "",
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10],
    })
  }
}

const JITTER_THRESHOLD = 0.0001
const JITTER_STEP = 0.00003

/**
 * Applies a small deterministic circular offset to markers that share nearly
 * identical coordinates, so they don't stack on top of each other.
 */
export function applyCoordinateJitter(
  locations: VoterGeocodedLocation[],
): VoterGeocodedLocation[] {
  const result = [...locations]

  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      if (
        Math.abs(result[i].latitude - result[j].latitude) < JITTER_THRESHOLD &&
        Math.abs(result[i].longitude - result[j].longitude) < JITTER_THRESHOLD
      ) {
        // Apply deterministic offset based on index
        const angle = (j * 2 * Math.PI) / result.length
        result[j] = {
          ...result[j],
          latitude: result[j].latitude + JITTER_STEP * Math.sin(angle),
          longitude: result[j].longitude + JITTER_STEP * Math.cos(angle),
        }
      }
    }
  }

  return result
}
