import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { createTestQueryClient } from "@/test/render"
import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import {
  useVoterSearch,
  useVoterDetail,
  useVoterFilters,
  useTriggerVoterGeocode,
  useDeleteGeocodedLocation,
} from "@/hooks/useVoters"
import {
  mockVoterSearchResponse,
  mockVoterDetail,
  mockVoterFilterOptions,
} from "@/test/mocks/voters"

vi.mock("@/api/voters", () => ({
  searchVoters: vi.fn(),
  getVoterDetail: vi.fn(),
  getVoterFilters: vi.fn(),
  triggerVoterGeocode: vi.fn(),
  deleteGeocodedLocation: vi.fn(),
}))

import {
  searchVoters,
  getVoterDetail,
  getVoterFilters,
  triggerVoterGeocode,
  deleteGeocodedLocation,
} from "@/api/voters"

const mockedSearchVoters = vi.mocked(searchVoters)
const mockedGetVoterDetail = vi.mocked(getVoterDetail)
const mockedGetVoterFilters = vi.mocked(getVoterFilters)
const mockedTriggerVoterGeocode = vi.mocked(triggerVoterGeocode)
const mockedDeleteGeocodedLocation = vi.mocked(deleteGeocodedLocation)

function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useVoterSearch", () => {
  it("fetches voter search results with params", async () => {
    const response = mockVoterSearchResponse()
    mockedSearchVoters.mockResolvedValue(response)

    const { result } = renderHook(
      () => useVoterSearch({ q: "Smith" }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(response)
    expect(mockedSearchVoters).toHaveBeenCalledWith({ q: "Smith" })
  })

  it("fetches with empty params", async () => {
    const response = mockVoterSearchResponse()
    mockedSearchVoters.mockResolvedValue(response)

    const { result } = renderHook(
      () => useVoterSearch({}),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedSearchVoters).toHaveBeenCalledWith({})
  })
})

describe("useVoterDetail", () => {
  it("fetches voter detail when voterId is provided", async () => {
    const detail = mockVoterDetail()
    mockedGetVoterDetail.mockResolvedValue(detail)

    const { result } = renderHook(
      () => useVoterDetail("v-001"),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(detail)
    expect(mockedGetVoterDetail).toHaveBeenCalledWith("v-001")
  })

  it("does not fetch when voterId is null", () => {
    const { result } = renderHook(
      () => useVoterDetail(null),
      { wrapper: createWrapper() },
    )

    expect(result.current.fetchStatus).toBe("idle")
    expect(mockedGetVoterDetail).not.toHaveBeenCalled()
  })
})

describe("useVoterFilters", () => {
  it("fetches filter options without county", async () => {
    const filters = mockVoterFilterOptions()
    mockedGetVoterFilters.mockResolvedValue(filters)

    const { result } = renderHook(
      () => useVoterFilters(),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(filters)
    expect(mockedGetVoterFilters).toHaveBeenCalledWith(undefined)
  })

  it("fetches filter options with county", async () => {
    const filters = mockVoterFilterOptions({
      county_precincts: ["BI1", "BI2"],
      county_commission_districts: ["1", "2"],
      school_board_districts: ["1"],
    })
    mockedGetVoterFilters.mockResolvedValue(filters)

    const { result } = renderHook(
      () => useVoterFilters("Bibb"),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(filters)
    expect(mockedGetVoterFilters).toHaveBeenCalledWith("Bibb")
  })
})

describe("useTriggerVoterGeocode", () => {
  it("triggers geocoding and invalidates geocoded-locations queries", async () => {
    mockedTriggerVoterGeocode.mockResolvedValue(undefined)

    const wrapper = createWrapper()
    const { result } = renderHook(
      () => useTriggerVoterGeocode("v-001"),
      { wrapper },
    )

    result.current.mutate(undefined)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedTriggerVoterGeocode).toHaveBeenCalledWith("v-001")
  })
})

describe("useDeleteGeocodedLocation", () => {
  it("deletes a geocoded location and invalidates queries", async () => {
    mockedDeleteGeocodedLocation.mockResolvedValue(undefined)

    const wrapper = createWrapper()
    const { result } = renderHook(
      () => useDeleteGeocodedLocation("v-001"),
      { wrapper },
    )

    result.current.mutate("loc-001")
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedDeleteGeocodedLocation).toHaveBeenCalledWith("v-001", "loc-001")
  })
})
