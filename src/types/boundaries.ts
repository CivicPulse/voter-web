import type { FeatureCollection, MultiPolygon, Polygon } from "geojson"

export interface CountyProperties {
  name: string
  boundary_type: string
  boundary_identifier: string
  source: string
  county: string
}

export type CountyFeatureCollection = FeatureCollection<
  MultiPolygon | Polygon,
  CountyProperties
>
