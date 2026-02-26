import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { useCandidates, useCandidateDetail } from "@/lib/hooks/use-candidates"
import { createTestQueryClient } from "@/test/render"
import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import {
  mockPaginatedCandidateList,
  mockCandidateDetail,
} from "@/test/mocks/candidates"

vi.mock("@/lib/api/candidates", () => ({
  getCandidates: vi.fn(),
  getCandidateDetail: vi.fn(),
}))

import { getCandidates, getCandidateDetail } from "@/lib/api/candidates"

const mockedGetCandidates = vi.mocked(getCandidates)
const mockedGetCandidateDetail = vi.mocked(getCandidateDetail)

function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe("useCandidates", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches a paginated list of candidates", async () => {
    const mockResponse = mockPaginatedCandidateList()
    mockedGetCandidates.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(
      () => useCandidates("elec-001"),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.items).toHaveLength(2)
    expect(result.current.data?.items[0].full_name).toBe("Andrea C. Cooke")
    expect(result.current.data?.pagination.total).toBe(2)
  })

  it("returns loading state initially", () => {
    mockedGetCandidates.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(
      () => useCandidates("elec-001"),
      { wrapper: createWrapper() },
    )

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it("returns error state on failure", async () => {
    mockedGetCandidates.mockRejectedValue(new Error("Network error"))

    const { result } = renderHook(
      () => useCandidates("elec-001"),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isError).toBe(true), {
      timeout: 5000,
    })
    expect(result.current.error).toBeDefined()
  })

  it("does not fetch when electionId is empty string", () => {
    renderHook(
      () => useCandidates(""),
      { wrapper: createWrapper() },
    )

    expect(mockedGetCandidates).not.toHaveBeenCalled()
  })

  it("passes params through to the API", async () => {
    mockedGetCandidates.mockResolvedValueOnce(mockPaginatedCandidateList())

    const params = { status: "qualified" as const, page: 2, page_size: 10 }
    renderHook(
      () => useCandidates("elec-001", params),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(mockedGetCandidates).toHaveBeenCalled())

    expect(mockedGetCandidates).toHaveBeenCalledWith("elec-001", params)
  })
})

describe("useCandidateDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches full candidate detail", async () => {
    const mockDetail = mockCandidateDetail()
    mockedGetCandidateDetail.mockResolvedValueOnce(mockDetail)

    const { result } = renderHook(
      () => useCandidateDetail("cand-uuid-001"),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.full_name).toBe("Andrea C. Cooke")
    expect(result.current.data?.bio).toBe(
      "Community advocate and former city council member.",
    )
    expect(result.current.data?.links).toHaveLength(2)
  })

  it("does not fetch when candidateId is empty string", () => {
    renderHook(
      () => useCandidateDetail(""),
      { wrapper: createWrapper() },
    )

    expect(mockedGetCandidateDetail).not.toHaveBeenCalled()
  })
})
