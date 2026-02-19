import { useEffect, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import { cn } from "@/lib/utils"
import type { VoterGeocodedLocation } from "@/types/lookup"

const DEFAULT_CENTER: [number, number] = [32.6791, -83.6233]
const DEFAULT_ZOOM = 14

// Official (primary) location pin — blue
const primaryIcon = new L.Icon({
  iconUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9/dist/images/marker-icon.png",
  iconRetinaUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9/dist/images/marker-icon-2x.png",
  shadowUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Non-official location pin — grey
const secondaryIcon = new L.Icon({
  iconUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9/dist/images/marker-icon.png",
  iconRetinaUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9/dist/images/marker-icon-2x.png",
  shadowUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9/dist/images/marker-shadow.png",
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [1, -28],
  shadowSize: [33, 33],
  className: "opacity-60",
})

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

interface GeocodedLocationMapProps {
  locations: VoterGeocodedLocation[]
  className?: string
}

export function GeocodedLocationMap({
  locations,
  className,
}: GeocodedLocationMapProps) {
  const center = useMemo<[number, number]>(() => {
    if (locations.length === 0) return DEFAULT_CENTER
    const primary = locations.find((l) => l.is_primary)
    const loc = primary ?? locations[0]
    return [loc.latitude, loc.longitude]
  }, [locations])

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
      <FitBoundsToLocations locations={locations} />
      {locations.map((loc) => (
        <Marker
          key={loc.id}
          position={[loc.latitude, loc.longitude]}
          icon={loc.is_primary ? primaryIcon : secondaryIcon}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-medium">
                {loc.source_type}
                {loc.is_primary && " (Official)"}
              </p>
              <p className="text-muted-foreground">
                {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
              </p>
              <p className="text-muted-foreground">
                Confidence: {(loc.confidence_score * 100).toFixed(0)}%
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
