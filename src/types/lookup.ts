// --- Endpoint 1: Address Verification ---

export interface AddressSuggestion {
  formatted_address: string
  confidence: number
}

export interface VerifyResponse {
  suggestions: AddressSuggestion[]
}

// --- Endpoint 2: Address Geocode ---

export interface GeocodeResponse {
  formatted_address: string
  latitude: number
  longitude: number
  metadata: Record<string, string | number | null>
}

// --- Endpoint 3: Point Lookup ---

export interface LookupDistrict {
  boundary_type: string
  name: string
  boundary_identifier: string
  boundary_id: string
  metadata: Record<string, string | number | null>
}

export interface PointLookupResponse {
  districts: LookupDistrict[]
}

export interface PointLookupParams {
  lat: number
  lng: number
  accuracy?: number
}
