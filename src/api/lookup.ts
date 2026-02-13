import { api } from "./client"
import type { LookupResponse, LookupSearchParams } from "@/types/lookup"

export async function fetchAddressLookup(
  params: LookupSearchParams,
): Promise<LookupResponse> {
  const searchParams: Record<string, string> = {}

  if (params.address) {
    searchParams.address = params.address
  }
  if (params.lat !== undefined && params.lng !== undefined) {
    searchParams.lat = String(params.lat)
    searchParams.lng = String(params.lng)
  }

  return api
    .get("geocoding/lookup", { searchParams })
    .json<LookupResponse>()
}
