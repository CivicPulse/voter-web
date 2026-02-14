import { api } from "./client"
import type {
  BatchGeocodeJob,
  BatchGeocodeRequest,
  CacheStats,
  GeocodeResponse,
  ManualLocationRequest,
  PointLookupParams,
  PointLookupResponse,
  VerifyResponse,
  VoterGeocodedLocation,
} from "@/types/lookup"

// --- Address verification & geocoding ---

export async function verifyAddress(
  address: string,
): Promise<VerifyResponse> {
  return api
    .get("geocoding/verify", { searchParams: { address } })
    .json<VerifyResponse>()
}

export async function geocodeAddress(
  address: string,
): Promise<GeocodeResponse> {
  return api
    .get("geocoding/geocode", { searchParams: { address } })
    .json<GeocodeResponse>()
}

export async function pointLookup(
  params: PointLookupParams,
): Promise<PointLookupResponse> {
  const searchParams: Record<string, string> = {
    lat: String(params.lat),
    lng: String(params.lng),
  }
  if (params.accuracy !== undefined) {
    searchParams.accuracy = String(params.accuracy)
  }

  return api
    .get("geocoding/point-lookup", { searchParams })
    .json<PointLookupResponse>()
}

// --- Batch geocoding (Admin) ---

export async function startBatchGeocode(
  request: BatchGeocodeRequest = {},
): Promise<BatchGeocodeJob> {
  return api
    .post("geocoding/batch", { json: request })
    .json<BatchGeocodeJob>()
}

export async function getBatchGeocodeStatus(
  jobId: string,
): Promise<BatchGeocodeJob> {
  return api
    .get(`geocoding/status/${jobId}`)
    .json<BatchGeocodeJob>()
}

// --- Cache stats ---

export async function getCacheStats(): Promise<CacheStats> {
  return api.get("geocoding/cache/stats").json<CacheStats>()
}

// --- Voter geocoded locations ---

export async function getVoterGeocodedLocations(
  voterId: string,
): Promise<VoterGeocodedLocation[]> {
  return api
    .get(`voters/${voterId}/geocoded-locations`)
    .json<VoterGeocodedLocation[]>()
}

export async function addManualLocation(
  voterId: string,
  request: ManualLocationRequest,
): Promise<VoterGeocodedLocation> {
  return api
    .post(`voters/${voterId}/geocoded-locations/manual`, { json: request })
    .json<VoterGeocodedLocation>()
}

export async function setPrimaryLocation(
  voterId: string,
  locationId: string,
): Promise<VoterGeocodedLocation> {
  return api
    .put(`voters/${voterId}/geocoded-locations/${locationId}/set-primary`)
    .json<VoterGeocodedLocation>()
}
