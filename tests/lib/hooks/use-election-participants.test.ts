import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { useElectionParticipants } from "@/lib/hooks/use-election-participants"
import { createWrapper } from "@/test/render"
import { mockElectionParticipantsResponse } from "@/test/mocks/elections"

vi.mock("@/lib/api/elections", () => ({
  getElectionParticipants: vi.fn(),
}))

import { getElectionParticipants } from "@/lib/api/elections"

const mockedGetElectionParticipants = vi.mocked(getElectionParticipants)

const defaultParams = {
  page: 1,
  pageSize: 25,
}

describe("useElectionParticipants", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns loading state initially", () => {
    mockedGetElectionParticipants.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(
      () => useElectionParticipants("election-001", defaultParams, true),
      { wrapper: createWrapper() },
    )

    expect(result.current.isLoading).toBe(true)
  })

  it("fetches participants and includes all params in query key", async () => {
    const response = mockElectionParticipantsResponse()
    mockedGetElectionParticipants.mockResolvedValueOnce(response)

    const params = {
      page: 2,
      pageSize: 25,
      search: "Jane",
      county: "Bibb",
    }

    const { result } = renderHook(
      () => useElectionParticipants("election-001", params, true),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedGetElectionParticipants).toHaveBeenCalledWith(
      "election-001",
      expect.objectContaining({
        page: 2,
        page_size: 25,
        q: "Jane",
        county: "Bibb",
      }),
    )
    expect(result.current.data).toEqual(response)
  })

  it("does not fetch when enabled=false", () => {
    const { result } = renderHook(
      () => useElectionParticipants("election-001", defaultParams, false),
      { wrapper: createWrapper() },
    )

    expect(mockedGetElectionParticipants).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchStatus).toBe("idle")
  })

  it("does not fetch when electionId is empty string", () => {
    const { result } = renderHook(
      () => useElectionParticipants("", defaultParams, true),
      { wrapper: createWrapper() },
    )

    expect(mockedGetElectionParticipants).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.fetchStatus).toBe("idle")
  })

  it("converts has_district_mismatch 'true' string to boolean true for the API", async () => {
    mockedGetElectionParticipants.mockResolvedValueOnce(
      mockElectionParticipantsResponse(),
    )

    const { result } = renderHook(
      () =>
        useElectionParticipants(
          "election-001",
          { ...defaultParams, has_district_mismatch: "true" },
          true,
        ),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedGetElectionParticipants).toHaveBeenCalledWith(
      "election-001",
      expect.objectContaining({ has_district_mismatch: true }),
    )
  })

  it("converts has_district_mismatch 'false' string to boolean false for the API", async () => {
    mockedGetElectionParticipants.mockResolvedValueOnce(
      mockElectionParticipantsResponse(),
    )

    const { result } = renderHook(
      () =>
        useElectionParticipants(
          "election-001",
          { ...defaultParams, has_district_mismatch: "false" },
          true,
        ),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedGetElectionParticipants).toHaveBeenCalledWith(
      "election-001",
      expect.objectContaining({ has_district_mismatch: false }),
    )
  })

  it("does not pass has_district_mismatch to API when param is undefined", async () => {
    mockedGetElectionParticipants.mockResolvedValueOnce(
      mockElectionParticipantsResponse(),
    )

    const { result } = renderHook(
      () =>
        useElectionParticipants(
          "election-001",
          { ...defaultParams, has_district_mismatch: undefined },
          true,
        ),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const callArgs = mockedGetElectionParticipants.mock.calls[0][1]
    // The hook passes has_district_mismatch: undefined when param is not set
    // (the key is present but value is undefined, so getElectionParticipants
    // won't add it to searchParams because of the !== undefined guard there)
    expect(callArgs?.has_district_mismatch).toBeUndefined()
  })

  it("omits search from API call when search is empty string", async () => {
    mockedGetElectionParticipants.mockResolvedValueOnce(
      mockElectionParticipantsResponse(),
    )

    const { result } = renderHook(
      () =>
        useElectionParticipants(
          "election-001",
          { ...defaultParams, search: "" },
          true,
        ),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const callArgs = mockedGetElectionParticipants.mock.calls[0][1]
    expect(callArgs?.q).toBeUndefined()
  })
})
