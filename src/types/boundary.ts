import type { FeatureCollection, MultiPolygon, Polygon } from "geojson"

export interface CountyMetadata {
  geoid: string
  fips_state: string
  fips_county: string
  gnis_code: string | null
  geoid_fq: string
  name: string
  name_lsad: string
  lsad_code: string
  class_fp: string
  mtfcc: string
  csa_code: string | null
  cbsa_code: string | null
  metdiv_code: string | null
  functional_status: string
  land_area_m2: number
  water_area_m2: number
  internal_point_lat: string
  internal_point_lon: string
  land_area_km2: number
  water_area_km2: number
}

export interface PrecinctMetadata {
  precinct_name: string
  precinct_id: string
  precinct_county_name: string
  precinct_fips: string
  precinct_fips_county: string
  precinct_sos_district_id: string
  precinct_sos_id: string
  precinct_county_number: string
  precinct_area: number
}

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
  county_metadata: CountyMetadata | null
  precinct_metadata: PrecinctMetadata | null
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
  // Precinct metadata (present only on county_precinct features)
  precinct_name?: string
  precinct_id?: string
  precinct_county_name?: string
  precinct_fips?: string
  precinct_fips_county?: string
  precinct_sos_district_id?: string
  precinct_sos_id?: string
  precinct_county_number?: string
  precinct_area?: number
}

export type BoundaryFeatureCollection = FeatureCollection<
  MultiPolygon | Polygon,
  BoundaryFeatureProperties
>
