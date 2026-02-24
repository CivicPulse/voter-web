import { describe, it, expect, vi, beforeEach } from "vitest"
import { waitFor } from "@testing-library/react"
import { renderHook } from "@/test/render"
import { useElectionParticipants } from "@/lib/hooks/use-election-participants"
import { mockElectionParticipantsResponse } from "@/test/mocks/elections"

vi.mock("@/lib/api/elections", () => ({
  getElectionParticipants: vi.fn(),
}))

import { getElectionParticipants } from "@/lib/api/elections"

const mockedGetParticipants = vi.mocked(getElectionParticipants)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("useElectionParticipants", () => {
  it("fetches participants with pagination params", async () => {
    const response = mockElectionParticipantsResponse()
    mockedGetParticipants.mockResolvedValue(response)

    const { result } = renderHook(
      () =>
        useElectionParticipants(
          "election-001",
          { page: 1, pageSize: 25, search: "" },
          true,
        ),

    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(response)
    expect(mockedGetParticipants).toHaveBeenCalledWith("election-001", {
      page: 1,
      page_size: 25,
      q: undefined,
    })
  })

  it("passes search param when provided", async () => {
    const response = mockElectionParticipantsResponse()
    mockedGetParticipants.mockResolvedValue(response)

    const { result } = renderHook(
      () =>
        useElectionParticipants(
          "election-001",
          { page: 1, pageSize: 25, search: "Jane" },
          true,
        ),

    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedGetParticipants).toHaveBeenCalledWith("election-001", {
      page: 1,
      page_size: 25,
      q: "Jane",
    })
  })

  it("does not fetch when enabled is false", () => {
    const { result } = renderHook(
      () =>
        useElectionParticipants(
          "election-001",
          { page: 1, pageSize: 25, search: "" },
          false,
        ),

    )

    expect(result.current.fetchStatus).toBe("idle")
    expect(mockedGetParticipants).not.toHaveBeenCalled()
  })

  it("returns loading state while fetching", () => {
    mockedGetParticipants.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(
      () =>
        useElectionParticipants(
          "election-001",
          { page: 1, pageSize: 25, search: "" },
          true,
        ),

    )

    expect(result.current.isLoading).toBe(true)
  })

  it("returns error state on failure", async () => {
    mockedGetParticipants.mockRejectedValue(new Error("Forbidden"))

    const { result } = renderHook(
      () =>
        useElectionParticipants(
          "election-001",
          { page: 1, pageSize: 25, search: "" },
          true,
        ),

    )

    await waitFor(
      () => expect(result.current.isError).toBe(true),
      { timeout: 3000 },
    )
  })
})
