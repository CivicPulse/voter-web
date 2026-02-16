import { useCallback, useMemo } from "react"
import { GeoJSON } from "react-leaflet"
import type { Layer, LeafletMouseEvent, PathOptions } from "leaflet"
import type { Feature, MultiPolygon, Polygon } from "geojson"
import type {
  BoundaryFeatureCollection,
  BoundaryFeatureProperties,
} from "@/types/boundary"
import type { Election } from "@/types/elections"
import { electionsForDistrict } from "@/lib/hooks/use-active-elections"
import { escapeHtml } from "@/lib/utils"

// Distinct, colorblind-friendly palette for district overlays
import { DISTRICT_COLORS } from "@/lib/colors"

function getDistrictStyle(index: number, hasElection: boolean): PathOptions {
  const palette = DISTRICT_COLORS[index % DISTRICT_COLORS.length]
  if (hasElection) {
    return {
      color: palette.border,
      weight: 3,
      fillColor: palette.fill,
      fillOpacity: 0.4,
      opacity: 1,
      dashArray: "6 4",
    }
  }
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
  activeElections?: Election[]
  onDistrictDblClick?: (
    featureId: string,
    boundaryType: string,
    name: string,
  ) => void
}

export function OverlayLayer({
  data,
  activeElections,
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

  /** Set of district names (lowercased) that have active elections */
  const electionDistrictNames = useMemo(() => {
    if (!activeElections || activeElections.length === 0) return new Set<string>()
    const names = new Set<string>()
    for (const feature of data.features) {
      const name = feature.properties?.name
      if (name && electionsForDistrict(activeElections, name).length > 0) {
        names.add(name.toLowerCase().trim())
      }
    }
    return names
  }, [activeElections, data.features])

  const hasElectionForName = useCallback(
    (name: string) => electionDistrictNames.has(name.toLowerCase().trim()),
    [electionDistrictNames],
  )

  const style = useCallback(
    (feature?: Feature) => {
      const key = feature?.properties?.boundary_identifier ?? ""
      const name = feature?.properties?.name ?? ""
      const index = featureIndexMap.get(key) ?? 0
      return getDistrictStyle(index, hasElectionForName(name))
    },
    [featureIndexMap, hasElectionForName],
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
      const hasElection = hasElectionForName(props.name)
      const defaultStyle = getDistrictStyle(index, hasElection)

      const electionBadge = hasElection
        ? `<span style="display:inline-flex;align-items:center;gap:3px;margin-top:4px;padding:1px 6px;border-radius:9999px;background:#dcfce7;color:#166534;font-size:11px;font-weight:500;border:1px solid #bbf7d0;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Active election indicator"><path d="m9 12 2 2 4-4"/><path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z"/><path d="M22 19H2"/></svg>
            Active Election
          </span>`
        : ""

      layer.bindPopup(
        `<div class="p-1">
          <p class="font-semibold text-sm">${escapeHtml(displayName)}</p>
          <p class="text-xs text-muted-foreground capitalize">${escapeHtml(typeName)}</p>
          ${electionBadge}
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
    [featureIndexMap, hasElectionForName, onDistrictDblClick],
  )

  return (
    <GeoJSON
      key={`${data.features[0]?.properties?.boundary_type}-${data.features.length}-${electionDistrictNames.size}`}
      data={data}
      style={style}
      onEachFeature={onEachFeature}
    />
  )
}
