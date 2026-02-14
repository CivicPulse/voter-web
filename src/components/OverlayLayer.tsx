import { useCallback, useMemo } from "react"
import { GeoJSON } from "react-leaflet"
import type { Layer, LeafletMouseEvent, PathOptions } from "leaflet"
import type { Feature, MultiPolygon, Polygon } from "geojson"
import type {
  BoundaryFeatureCollection,
  BoundaryFeatureProperties,
} from "@/types/boundary"

function escapeHtml(str: string): string {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

// Distinct, colorblind-friendly palette for district overlays
const DISTRICT_COLORS = [
  { fill: "#e6194b", border: "#a01235" }, // red
  { fill: "#3cb44b", border: "#2a7d34" }, // green
  { fill: "#4363d8", border: "#2e45a0" }, // blue
  { fill: "#f58231", border: "#b55f1e" }, // orange
  { fill: "#911eb4", border: "#6b1685" }, // purple
  { fill: "#42d4f4", border: "#2a9ab0" }, // cyan
  { fill: "#f032e6", border: "#a822a0" }, // magenta
  { fill: "#bfef45", border: "#8ab530" }, // lime
  { fill: "#fabed4", border: "#b58898" }, // pink
  { fill: "#dcbeff", border: "#9a85b5" }, // lavender
  { fill: "#ffe119", border: "#b5a012" }, // yellow
  { fill: "#aaffc3", border: "#78b58a" }, // mint
  { fill: "#808000", border: "#5a5a00" }, // olive
  { fill: "#ffd8b1", border: "#b5987c" }, // apricot
  { fill: "#000075", border: "#000050" }, // navy
  { fill: "#a9a9a9", border: "#757575" }, // grey
]

function getDistrictStyle(index: number): PathOptions {
  const palette = DISTRICT_COLORS[index % DISTRICT_COLORS.length]
  return {
    color: palette.border,
    weight: 1.5,
    fillColor: palette.fill,
    fillOpacity: 0.25,
    opacity: 0.9,
  }
}

const OVERLAY_HOVER_STYLE: PathOptions = {
  weight: 3,
  fillOpacity: 0.45,
  opacity: 1,
}

interface OverlayLayerProps {
  data: BoundaryFeatureCollection
  onDistrictDblClick?: (
    featureId: string,
    boundaryType: string,
    name: string,
  ) => void
}

export function OverlayLayer({
  data,
  onDistrictDblClick,
}: Readonly<OverlayLayerProps>) {
  const featureIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    data.features.forEach((f, i) => {
      const key = f.properties?.boundary_identifier ?? String(i)
      map.set(key, i)
    })
    return map
  }, [data])

  const style = useCallback(
    (feature?: Feature) => {
      const key = feature?.properties?.boundary_identifier ?? ""
      const index = featureIndexMap.get(key) ?? 0
      return getDistrictStyle(index)
    },
    [featureIndexMap],
  )

  const onEachFeature = useCallback(
    (
      feature: Feature<MultiPolygon | Polygon, BoundaryFeatureProperties>,
      layer: Layer,
    ) => {
      const props = feature.properties
      const displayName =
        props.precinct_name || props.name || props.boundary_identifier
      const typeName = props.boundary_type.replaceAll("_", " ")
      const key = props.boundary_identifier ?? ""
      const index = featureIndexMap.get(key) ?? 0
      const defaultStyle = getDistrictStyle(index)

      layer.bindPopup(
        `<div class="p-1">
          <p class="font-semibold text-sm">${escapeHtml(displayName)}</p>
          <p class="text-xs text-muted-foreground capitalize">${escapeHtml(typeName)}</p>
        </div>`,
      )

      layer.on({
        mouseover: (e: LeafletMouseEvent) => {
          e.target.setStyle(OVERLAY_HOVER_STYLE)
          e.target.bringToFront()
        },
        mouseout: (e: LeafletMouseEvent) => {
          e.target.setStyle(defaultStyle)
        },
        dblclick: () => {
          if (onDistrictDblClick && feature.id) {
            onDistrictDblClick(
              String(feature.id),
              props.boundary_type,
              props.name,
            )
          }
        },
      })
    },
    [featureIndexMap, onDistrictDblClick],
  )

  return (
    <GeoJSON
      key={`${data.features[0]?.properties?.boundary_type}-${data.features.length}`}
      data={data}
      style={style}
      onEachFeature={onEachFeature}
    />
  )
}
