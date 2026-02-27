import { useEffect, useMemo, useRef, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from "react-leaflet"
import type { Geometry as GeoJSONGeometry } from "geojson"
import L from "leaflet"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { VoterGeocodedLocation } from "@/types/lookup"
import type { OfficialLocation } from "@/types/voter"
import type { BoundaryDetailResponse } from "@/types/boundary"
import { useUserRole } from "@/lib/hooks/use-user-role"
import { useUpdateOfficialLocation } from "@/hooks/useAddressLookup"
import {
  getProviderColor,
  createProviderDivIcon,
  createPrimaryLocationDivIcon,
  applyCoordinateJitter,
  applyOfficialLocationJitter,
  PRIMARY_LOCATION_COLOR,
  PROVIDER_COLORS,
} from "@/lib/provider-colors"
import { DISTRICT_COLORS } from "@/lib/colors"

const DEFAULT_CENTER: [number, number] = [32.6791, -83.6233]
const DEFAULT_ZOOM = 14

interface DragState {
  pendingLat: number | null
  pendingLng: number | null
  savedLat: number
  savedLng: number
}

function FitBoundsToLocations({
  locations,
  officialLocation,
}: {
  locations: VoterGeocodedLocation[]
  officialLocation?: OfficialLocation | null
}) {
  const map = useMap()

  useEffect(() => {
    if (locations.length === 0) return
    const points: [number, number][] = locations.map((loc) => [loc.latitude, loc.longitude])
    if (officialLocation) {
      points.push([officialLocation.latitude, officialLocation.longitude])
    }
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 })
  }, [map, locations, officialLocation])

  return null
}

const SVG_NS = "http://www.w3.org/2000/svg"

function createPinSvgElement(fill: string, border: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg")
  svg.setAttribute("width", "10")
  svg.setAttribute("height", "13")
  svg.setAttribute("viewBox", "0 0 32 40")
  svg.style.cssText = "flex-shrink:0;display:inline-block;"

  const path = document.createElementNS(SVG_NS, "path")
  path.setAttribute("d", "M16 2 C8 2 2 8 2 16 C2 26 16 38 16 38 C16 38 30 26 30 16 C30 8 24 2 16 2 Z")
  path.setAttribute("fill", fill)
  path.setAttribute("stroke", border)
  path.setAttribute("stroke-width", "2")
  svg.appendChild(path)

  const circle = document.createElementNS(SVG_NS, "circle")
  circle.setAttribute("cx", "16")
  circle.setAttribute("cy", "16")
  circle.setAttribute("r", "6")
  circle.setAttribute("fill", "white")
  svg.appendChild(circle)

  return svg
}

function buildLegendDom(
  providers: Array<{ label: string; fill: string; shape?: "circle" | "square" | "pin" }>,
): HTMLElement {
  const container = L.DomUtil.create("div")
  container.style.cssText =
    "background:white;border-radius:6px;padding:8px 10px;font-size:12px;line-height:1.6;box-shadow:0 1px 4px rgba(0,0,0,0.25);max-width:180px;"

  for (const p of providers) {
    const row = L.DomUtil.create("div", "", container)
    row.style.cssText = "display:flex;align-items:center;gap:6px;"

    if (p.shape === "pin") {
      const pinWrapper = L.DomUtil.create("span", "", row)
      pinWrapper.style.cssText = "display:inline-flex;align-items:center;flex-shrink:0;"
      pinWrapper.appendChild(createPinSvgElement(p.fill, PRIMARY_LOCATION_COLOR.border))
    } else {
      const dot = L.DomUtil.create("span", "", row)
      const isSquare = p.shape === "square"
      dot.style.cssText = `display:inline-block;width:10px;height:10px;border-radius:${isSquare ? "2px" : "50%"};background:${p.fill};flex-shrink:0;`
    }

    const label = L.DomUtil.create("span", "", row)
    label.style.color = "#333"
    label.textContent = p.label
  }

  return container
}

function MapProviderLegend({
  locations,
  activeOverlays,
  showOfficialLocation,
}: {
  locations: VoterGeocodedLocation[]
  activeOverlays?: Map<string, BoundaryDetailResponse>
  showOfficialLocation?: boolean
}) {
  const map = useMap()

  useEffect(() => {
    // Compute unique providers in order of first appearance
    const seen = new Set<string>()
    const items: Array<{ label: string; fill: string; shape?: "circle" | "square" | "pin" }> = []
    let fallbackIndex = 0

    // Primary Location first
    if (showOfficialLocation) {
      items.push({ label: PRIMARY_LOCATION_COLOR.label, fill: PRIMARY_LOCATION_COLOR.fill, shape: "pin" })
    }

    for (const loc of locations) {
      const key = loc.source_type.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        const isKnown = key in PROVIDER_COLORS
        const color = getProviderColor(loc.source_type, isKnown ? 0 : fallbackIndex)
        if (!isKnown) fallbackIndex++
        items.push({ label: color.label, fill: color.fill, shape: "circle" })
      }
    }

    // Add overlay district entries
    if (activeOverlays && activeOverlays.size > 0) {
      let overlayIndex = 0
      for (const [, boundary] of activeOverlays) {
        const dc = DISTRICT_COLORS[overlayIndex % DISTRICT_COLORS.length]
        items.push({ label: boundary.name, fill: dc.fill, shape: "square" })
        overlayIndex++
      }
    }

    if (items.length === 0) return

    const legend = new L.Control({ position: "bottomleft" })

    legend.onAdd = () => buildLegendDom(items)

    legend.addTo(map)

    return () => {
      legend.remove()
    }
  }, [map, locations, activeOverlays])

  return null
}

interface GeocodedLocationMapProps {
  locations: VoterGeocodedLocation[]
  officialLocation?: OfficialLocation | null
  className?: string
  voterId?: string
  activeOverlays?: Map<string, BoundaryDetailResponse>
  onLocationSaved?: () => void
  providerMatchStatus?: Map<string, string>
}

export function GeocodedLocationMap({
  locations,
  officialLocation,
  className,
  voterId,
  activeOverlays,
  onLocationSaved,
  providerMatchStatus,
}: Readonly<GeocodedLocationMapProps>) {
  const { data: userProfile } = useUserRole()
  const isEditable = userProfile?.role === "admin" || userProfile?.role === "analyst"

  const primaryLocation = useMemo(() => {
    return locations.find((l) => l.is_primary) ?? locations[0] ?? null
  }, [locations])

  const [dragState, setDragState] = useState<DragState>(() => ({
    pendingLat: null,
    pendingLng: null,
    savedLat: officialLocation?.latitude ?? primaryLocation?.latitude ?? DEFAULT_CENTER[0],
    savedLng: officialLocation?.longitude ?? primaryLocation?.longitude ?? DEFAULT_CENTER[1],
  }))

  const primaryMarkerRef = useRef<L.Marker | null>(null)

  const updateOfficialLocation = useUpdateOfficialLocation(voterId ?? "")
  const { isPending } = updateOfficialLocation

  const center = useMemo<[number, number]>(() => {
    if (locations.length === 0) return DEFAULT_CENTER
    const loc = primaryLocation ?? locations[0]
    return [loc.latitude, loc.longitude]
  }, [locations, primaryLocation])

  const jitteredLocations = useMemo(
    () => applyCoordinateJitter(locations),
    [locations],
  )

  const handleSave = async () => {
    if (dragState.pendingLat === null || dragState.pendingLng === null || !voterId) return
    try {
      await updateOfficialLocation.mutateAsync({
        latitude: dragState.pendingLat,
        longitude: dragState.pendingLng,
      })
      setDragState((prev) => ({
        ...prev,
        savedLat: prev.pendingLat!,
        savedLng: prev.pendingLng!,
        pendingLat: null,
        pendingLng: null,
      }))
      onLocationSaved?.()
    } catch {
      // Snap marker back to saved position
      if (primaryMarkerRef.current) {
        primaryMarkerRef.current.setLatLng([dragState.savedLat, dragState.savedLng])
      }
      setDragState((prev) => ({
        ...prev,
        pendingLat: null,
        pendingLng: null,
      }))
      toast.error("Failed to save location")
    }
  }

  const handleReset = () => {
    if (primaryMarkerRef.current) {
      primaryMarkerRef.current.setLatLng([dragState.savedLat, dragState.savedLng])
    }
    setDragState((prev) => ({
      ...prev,
      pendingLat: null,
      pendingLng: null,
    }))
  }

  if (locations.length === 0) return null

  return (
    <div>
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        className={cn(
          "h-[300px] w-full rounded-lg border",
          dragState.pendingLat !== null && "border-yellow-400 border-dashed",
          className,
        )}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBoundsToLocations locations={jitteredLocations} officialLocation={officialLocation} />
        <MapProviderLegend locations={locations} activeOverlays={activeOverlays} showOfficialLocation={!!officialLocation} />
        {officialLocation && (() => {
          const [offLat, offLng] = applyOfficialLocationJitter(
            officialLocation.latitude,
            officialLocation.longitude,
            jitteredLocations,
          )
          const officialIcon = createPrimaryLocationDivIcon()
          const draggable = !!voterId && isEditable
          return (
            <Marker
              key="official-location"
              position={
                dragState.pendingLat !== null && dragState.pendingLng !== null
                  ? [dragState.pendingLat, dragState.pendingLng]
                  : [offLat, offLng]
              }
              icon={officialIcon}
              draggable={draggable}
              ref={primaryMarkerRef}
              eventHandlers={
                draggable
                  ? {
                      dragend: (e) => {
                        const latlng = (e.target as L.Marker).getLatLng()
                        setDragState((prev) => ({
                          ...prev,
                          pendingLat: latlng.lat,
                          pendingLng: latlng.lng,
                        }))
                      },
                    }
                  : undefined
              }
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-medium">Primary Location</p>
                  <p className="text-muted-foreground">
                    {officialLocation.latitude.toFixed(6)}, {officialLocation.longitude.toFixed(6)}
                  </p>
                  <p className="text-muted-foreground">Source: {officialLocation.source}</p>
                  {officialLocation.is_override && (
                    <p className="text-amber-600 font-medium">Override</p>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })()}
        {(() => {
          let fallbackIndex = 0
          return jitteredLocations.map((loc) => {
            const key = loc.source_type.toLowerCase()
            const isKnown = key in PROVIDER_COLORS
            const color = getProviderColor(loc.source_type, isKnown ? 0 : fallbackIndex)
            if (!isKnown) fallbackIndex++
            // Determine match ring color for non-primary markers
            let matchRingColor: string | undefined
            if (!loc.is_primary && providerMatchStatus) {
              const status = providerMatchStatus.get(loc.source_type)
              if (status === "all-match") matchRingColor = "#3cb44b"
              else if (status === "any-mismatch") matchRingColor = "#e6194b"
              else if (status === "mixed") matchRingColor = "#f58231"
            }
            const icon = createProviderDivIcon(color, loc.is_primary, matchRingColor)

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
                      {loc.is_primary && " (Primary provider)"}
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
        {activeOverlays &&
          [...activeOverlays.entries()].map(([id, boundary], index) => {
            if (!boundary.geometry) return null
            const dc = DISTRICT_COLORS[index % DISTRICT_COLORS.length]
            return (
              <GeoJSON
                key={id}
                data={boundary.geometry as unknown as GeoJSONGeometry}
                style={{
                  fillColor: dc.fill,
                  color: dc.border,
                  weight: 2,
                  opacity: 0.9,
                  fillOpacity: 0.2,
                }}
              >
                <Popup>{boundary.name}</Popup>
              </GeoJSON>
            )
          })}
      </MapContainer>

      {dragState.pendingLat !== null && dragState.pendingLng !== null && (
        <div className="text-xs text-muted-foreground mt-1">
          Lat: {dragState.pendingLat.toFixed(6)}, Lng: {dragState.pendingLng.toFixed(6)}
        </div>
      )}

      {dragState.pendingLat !== null && (
        <div className="flex gap-2 mt-2">
          <Button onClick={handleSave} disabled={isPending} size="sm">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save location
          </Button>
          <Button variant="ghost" onClick={handleReset} disabled={isPending} size="sm">
            Reset
          </Button>
        </div>
      )}
    </div>
  )
}
