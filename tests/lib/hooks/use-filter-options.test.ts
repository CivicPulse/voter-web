import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { useFilterOptions } from "@/lib/hooks/use-filter-options"
import { createWrapper } from "@/test/render"

vi.mock("@/lib/api/elections", () => ({
  getFilterOptions: vi.fn(),
}))

import { getFilterOptions } from "@/lib/api/elections"

const mockedGetFilterOptions = vi.mocked(getFilterOptions)

const mockFilterOptionsData = {
  race_categories: ["federal", "local"],
  counties: ["Bibb", "Houston"],
  election_dates: ["2026-11-03"],
}

describe("useFilterOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns filter options on successful fetch", async () => {
    mockedGetFilterOptions.mockResolvedValueOnce(mockFilterOptionsData)

    const { result } = renderHook(
      () => useFilterOptions({ status: "all", election_type: "all" }, { filterOptions: true }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toEqual(mockFilterOptionsData)
  })

  it("returns isLoading true while fetching", () => {
    mockedGetFilterOptions.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(
      () => useFilterOptions({}, { filterOptions: true }),
      { wrapper: createWrapper() },
    )

    expect(result.current.isLoading).toBe(true)
  })

  it("returns undefined data on API error", async () => {
    mockedGetFilterOptions.mockRejectedValue(new Error("API error"))

    const { result } = renderHook(
      () => useFilterOptions({}, { filterOptions: true }),
      { wrapper: createWrapper() },
    )

    await waitFor(
      () => expect(result.current.isLoading).toBe(false),
      { timeout: 5000 },
    )

    expect(result.current.data).toBeUndefined()
  })

  it("re-fetches when filters change", async () => {
    mockedGetFilterOptions.mockResolvedValue(mockFilterOptionsData)

    const filtersA = { status: "active" as const }
    const filtersB = { status: "finalized" as const }

    const { result, rerender } = renderHook(
      ({ filters }) => useFilterOptions(filters, { filterOptions: true }),
      {
        wrapper: createWrapper(),
        initialProps: { filters: filtersA },
      },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockedGetFilterOptions).toHaveBeenCalledWith(filtersA)

    rerender({ filters: filtersB })

    await waitFor(() =>
      expect(mockedGetFilterOptions).toHaveBeenCalledWith(filtersB),
    )
  })
})
