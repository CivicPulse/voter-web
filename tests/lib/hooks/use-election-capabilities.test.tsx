import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { useElectionCapabilities } from "@/lib/hooks/use-election-capabilities"
import { createWrapper } from "@/test/render"

vi.mock("@/lib/api/elections", () => ({
  getElectionCapabilities: vi.fn(),
}))

import { getElectionCapabilities } from "@/lib/api/elections"

const mockedGetElectionCapabilities = vi.mocked(getElectionCapabilities)

/** Assert all feature flags are false (used for error/loading states) */
function expectAllFlagsFalse(current: ReturnType<typeof useElectionCapabilities>) {
  expect(current.search).toBe(false)
  expect(current.raceCategory).toBe(false)
  expect(current.geographic).toBe(false)
  expect(current.electionDate).toBe(false)
  expect(current.filterOptions).toBe(false)
}

describe("useElectionCapabilities", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns isLoading true initially", () => {
    mockedGetElectionCapabilities.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useElectionCapabilities(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
    expectAllFlagsFalse(result.current)
  })

  it("returns correct flags on successful response", async () => {
    mockedGetElectionCapabilities.mockResolvedValueOnce({
      supported_filters: ["q", "race_category", "county"],
      endpoints: { filter_options: true },
    })

    const { result } = renderHook(() => useElectionCapabilities(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.search).toBe(true)
    expect(result.current.raceCategory).toBe(true)
    expect(result.current.geographic).toBe(true)
    expect(result.current.electionDate).toBe(false)
    expect(result.current.filterOptions).toBe(true)
  })

  it.each([
    ["404 error", Object.assign(new Error("Not Found"), { response: { status: 404 } })],
    ["network error", new Error("Network error")],
  ])("returns all flags false when API throws %s", async (_label, error) => {
    mockedGetElectionCapabilities.mockRejectedValue(error)

    const { result } = renderHook(() => useElectionCapabilities(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false), {
      timeout: 5000,
    })

    expectAllFlagsFalse(result.current)
  })
})
