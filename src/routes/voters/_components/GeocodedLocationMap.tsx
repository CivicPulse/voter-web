import { useEffect, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import { cn } from "@/lib/utils"
import type { VoterGeocodedLocation } from "@/types/lookup"
import {
  getProviderColor,
  createProviderDivIcon,
  applyCoordinateJitter,
  PROVIDER_COLORS,
} from "@/lib/provider-colors"

const DEFAULT_CENTER: [number, number] = [32.6791, -83.6233]
const DEFAULT_ZOOM = 14

function FitBoundsToLocations({
  locations,
}: {
  locations: VoterGeocodedLocation[]
}) {
  const map = useMap()

  useEffect(() => {
    if (locations.length === 0) return
    const bounds = L.latLngBounds(
      locations.map((loc) => [loc.latitude, loc.longitude] as [number, number]),
    )
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 })
  }, [map, locations])

  return null
}

function buildLegendDom(
  providers: Array<{ label: string; fill: string }>,
): HTMLElement {
  const container = L.DomUtil.create("div")
  container.style.cssText =
    "background:white;border-radius:6px;padding:8px 10px;font-size:12px;line-height:1.6;box-shadow:0 1px 4px rgba(0,0,0,0.25);max-width:160px;"

  for (const p of providers) {
    const row = L.DomUtil.create("div", "", container)
    row.style.cssText = "display:flex;align-items:center;gap:6px;"

    const dot = L.DomUtil.create("span", "", row)
    dot.style.cssText = `display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.fill};flex-shrink:0;`

    const label = L.DomUtil.create("span", "", row)
    label.style.color = "#333"
    label.textContent = p.label
  }

  return container
}

function MapProviderLegend({
  locations,
}: {
  locations: VoterGeocodedLocation[]
}) {
  const map = useMap()

  useEffect(() => {
    // Compute unique providers in order of first appearance
    const seen = new Set<string>()
    const providers: Array<{ label: string; fill: string }> = []
    let fallbackIndex = 0

    for (const loc of locations) {
      const key = loc.source_type.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        const isKnown = key in PROVIDER_COLORS
        const color = getProviderColor(loc.source_type, isKnown ? 0 : fallbackIndex)
        if (!isKnown) fallbackIndex++
        providers.push({ label: color.label, fill: color.fill })
      }
    }

    if (providers.length === 0) return

    const legend = new L.Control({ position: "bottomleft" })

    legend.onAdd = () => buildLegendDom(providers)

    legend.addTo(map)

    return () => {
      legend.remove()
    }
  }, [map, locations])

  return null
}

interface GeocodedLocationMapProps {
  locations: VoterGeocodedLocation[]
  className?: string
}

export function GeocodedLocationMap({
  locations,
  className,
}: Readonly<GeocodedLocationMapProps>) {
  const center = useMemo<[number, number]>(() => {
    if (locations.length === 0) return DEFAULT_CENTER
    const primary = locations.find((l) => l.is_primary)
    const loc = primary ?? locations[0]
    return [loc.latitude, loc.longitude]
  }, [locations])

  const jitteredLocations = useMemo(
    () => applyCoordinateJitter(locations),
    [locations],
  )

  if (locations.length === 0) return null

  return (
    <MapContainer
      center={center}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom={true}
      className={cn("h-[300px] w-full rounded-lg border", className)}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBoundsToLocations locations={jitteredLocations} />
      <MapProviderLegend locations={locations} />
      {(() => {
        let fallbackIndex = 0
        return jitteredLocations.map((loc) => {
          const key = loc.source_type.toLowerCase()
          const isKnown = key in PROVIDER_COLORS
          const color = getProviderColor(loc.source_type, isKnown ? 0 : fallbackIndex)
          if (!isKnown) fallbackIndex++
          const icon = createProviderDivIcon(color, loc.is_primary)
          return (
            <Marker
              key={loc.id}
              position={[loc.latitude, loc.longitude]}
              icon={icon}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-medium">
                    {color.label}
                    {loc.is_primary && " (Official)"}
                  </p>
                  <p className="text-muted-foreground">
                    {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                  </p>
                  <p className="text-muted-foreground">
                    Confidence:{" "}
                    {loc.confidence_score == null
                      ? "—"
                      : `${(loc.confidence_score * 100).toFixed(0)}%`}
                  </p>
                </div>
              </Popup>
            </Marker>
          )
        })
      })()}
    </MapContainer>
  )
}
