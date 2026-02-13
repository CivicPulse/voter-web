export interface LookupDistrict {
  boundary_type: string
  name: string
  boundary_identifier: string
  boundary_id: string
  metadata: Record<string, string | number | null>
}

export interface GeocodedAddress {
  formatted_address: string
  latitude: number
  longitude: number
}

export interface LookupResponse {
  geocoded_address: GeocodedAddress | null
  districts: LookupDistrict[]
}

export interface LookupSearchParams {
  address?: string
  lat?: number
  lng?: number
}
