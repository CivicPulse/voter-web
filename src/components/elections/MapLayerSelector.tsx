import { Map, BarChart3, Users } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { MapDataLayer } from "@/types/elections"

interface MapLayerSelectorProps {
  activeLayer: MapDataLayer
  onLayerChange: (layer: MapDataLayer) => void
}

const LAYERS: { value: MapDataLayer; label: string; icon: typeof Map }[] = [
  { value: "leading_candidate", label: "Leading Candidate", icon: Users },
  { value: "precincts_reporting", label: "Reporting %", icon: BarChart3 },
  { value: "total_votes", label: "Total Votes", icon: Map },
]

export function MapLayerSelector({
  activeLayer,
  onLayerChange,
}: MapLayerSelectorProps) {
  return (
    <ToggleGroup
      type="single"
      value={activeLayer}
      onValueChange={(value) => {
        if (value) onLayerChange(value as MapDataLayer)
      }}
      className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-sm"
    >
      {LAYERS.map(({ value, label, icon: Icon }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          aria-label={label}
          className="gap-1.5 text-xs px-3"
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
