import type { FeatureCollection, MultiPolygon, Polygon } from "geojson"

export interface BoundaryDetailResponse {
  id: string
  name: string
  boundary_type: string
  boundary_identifier: string
  source: string
  county: string | null
  effective_date: string | null
  created_at: string
  geometry: Record<string, unknown> | null
  properties: Record<string, unknown> | null
}

export interface BoundaryTypesResponse {
  types: string[]
}

export interface BoundaryFeatureProperties {
  name: string
  boundary_type: string
  boundary_identifier: string
  source: string
  county: string | null
}

export type BoundaryFeatureCollection = FeatureCollection<
  MultiPolygon | Polygon,
  BoundaryFeatureProperties
>
