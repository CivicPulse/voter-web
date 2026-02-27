import { useEffect, useMemo, useRef, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { VoterGeocodedLocation } from "@/types/lookup"
import type { BoundaryDetailResponse } from "@/types/boundary"
import { useUserRole } from "@/lib/hooks/use-user-role"
import { useUpdateOfficialLocation } from "@/hooks/useAddressLookup"
import {
  getProviderColor,
  createProviderDivIcon,
  applyCoordinateJitter,
  PROVIDER_COLORS,
} from "@/lib/provider-colors"

const DEFAULT_CENTER: [number, number] = [32.6791, -83.6233]
const DEFAULT_ZOOM = 14

interface DragState {
  isDragging: boolean
  pendingLat: number | null
  pendingLng: number | null
  savedLat: number
  savedLng: number
}

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
  voterId?: string
  activeOverlays?: Map<string, BoundaryDetailResponse>
  onLocationSaved?: () => void
  providerMatchStatus?: Map<string, string>
}

export function GeocodedLocationMap({
  locations,
  className,
  voterId,
  onLocationSaved,
}: Readonly<GeocodedLocationMapProps>) {
  const { data: userProfile } = useUserRole()
  const isEditable = userProfile?.role === "admin" || userProfile?.role === "analyst"

  const primaryLocation = useMemo(() => {
    return locations.find((l) => l.is_primary) ?? locations[0] ?? null
  }, [locations])

  const [dragState, setDragState] = useState<DragState>(() => ({
    isDragging: false,
    pendingLat: null,
    pendingLng: null,
    savedLat: primaryLocation?.latitude ?? DEFAULT_CENTER[0],
    savedLng: primaryLocation?.longitude ?? DEFAULT_CENTER[1],
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
      isDragging: false,
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
            const isPrimaryMarker = loc.is_primary
            const draggable = isPrimaryMarker && !!voterId && isEditable

            return (
              <Marker
                key={loc.id}
                position={[loc.latitude, loc.longitude]}
                icon={icon}
                draggable={draggable}
                ref={isPrimaryMarker ? primaryMarkerRef : undefined}
                eventHandlers={
                  draggable
                    ? {
                        dragstart: () => {
                          setDragState((prev) => ({ ...prev, isDragging: true }))
                        },
                        drag: (e) => {
                          const latlng = (e.target as L.Marker).getLatLng()
                          setDragState((prev) => ({
                            ...prev,
                            pendingLat: latlng.lat,
                            pendingLng: latlng.lng,
                          }))
                        },
                        dragend: (e) => {
                          const latlng = (e.target as L.Marker).getLatLng()
                          setDragState((prev) => ({
                            ...prev,
                            isDragging: false,
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

      {dragState.isDragging && dragState.pendingLat !== null && dragState.pendingLng !== null && (
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
