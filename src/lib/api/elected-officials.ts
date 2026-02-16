import { api } from "@/api/client"
import type {
  ElectedOfficialDetailResponse,
  PaginatedElectedOfficialResponse,
} from "@/types/elected-officials"

/**
 * Get elected officials for a specific district.
 * Public endpoint — no authentication required.
 */
export async function getElectedOfficialsByDistrict(
  boundaryType: string,
  districtIdentifier: string,
): Promise<ElectedOfficialDetailResponse[]> {
  const normalizedId =
    districtIdentifier.replace(/^0+/, "") || districtIdentifier
  return api
    .get("elected-officials/by-district", {
      searchParams: {
        boundary_type: boundaryType,
        district_identifier: normalizedId,
      },
    })
    .json<ElectedOfficialDetailResponse[]>()
}

/**
 * List elected officials filtered by boundary type.
 * Public endpoint — no authentication required.
 */
export async function getElectedOfficialsByBoundaryType(
  boundaryType: string,
): Promise<PaginatedElectedOfficialResponse> {
  return api
    .get("elected-officials", {
      searchParams: {
        boundary_type: boundaryType,
        page_size: "100",
      },
    })
    .json<PaginatedElectedOfficialResponse>()
}
