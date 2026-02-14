// --- Endpoint 1: Address Verification ---

export interface AddressSuggestion {
  address: string
  latitude: number
  longitude: number
  confidence_score: number
}

export interface AddressValidation {
  present_components: string[]
  missing_components: string[]
  malformed_components: string[]
}

export interface VerifyResponse {
  input_address: string
  normalized_address: string
  is_well_formed: boolean
  validation: AddressValidation
  suggestions: AddressSuggestion[]
}

// --- Endpoint 2: Address Geocode ---

export interface GeocodeResponse {
  formatted_address: string
  latitude: number
  longitude: number
  confidence: number
  metadata: Record<string, string | number | boolean | null>
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
  latitude: number
  longitude: number
  accuracy: number | null
  districts: LookupDistrict[]
}

export interface PointLookupParams {
  lat: number
  lng: number
  accuracy?: number
}

// --- Endpoint 4: Batch Geocoding ---

export interface BatchGeocodeRequest {
  county?: string
  provider?: string
  force_regeocode?: boolean
}

export interface BatchGeocodeJob {
  id: string
  status: "pending" | "running" | "completed" | "failed"
  total_records: number
  processed: number
  succeeded: number
  failed: number
  cache_hits: number
  started_at: string | null
  completed_at: string | null
  created_at: string
}

// --- Endpoint 6: Cache Stats ---

export interface CacheStats {
  [provider: string]: {
    count: number
    earliest: string
    latest: string
  }
}

// --- Endpoints 7–9: Voter Geocoded Locations ---

export interface VoterGeocodedLocation {
  id: string
  voter_id: string
  latitude: number
  longitude: number
  confidence_score: number
  source_type: string
  is_primary: boolean
  input_address: string
  geocoded_at: string
}

export interface ManualLocationRequest {
  latitude: number
  longitude: number
  source_type: "manual" | "field-survey"
  set_as_primary?: boolean
}
