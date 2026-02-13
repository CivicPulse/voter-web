import { api } from "./client"
import type {
  GeocodeResponse,
  PointLookupParams,
  PointLookupResponse,
  VerifyResponse,
} from "@/types/lookup"

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
