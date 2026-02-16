import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import {
  useAdminElections,
  useAdminElectionDetail,
  useCreateElection,
  useUpdateElection,
  useRefreshElection,
} from "@/lib/hooks/use-admin-elections"
import { createTestQueryClient } from "@/test/render"
import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import {
  mockPaginatedElectionList,
  mockElection,
  mockRefreshResponse,
} from "@/test/mocks/elections"
import {
  AuthenticationError,
  PermissionError,
  NetworkError,
} from "@/types/admin"

vi.mock("@/lib/api/elections", () => ({
  getElections: vi.fn(),
  getElectionDetail: vi.fn(),
  createElection: vi.fn(),
  updateElection: vi.fn(),
  refreshElection: vi.fn(),
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

import {
  getElections,
  getElectionDetail,
  createElection,
  updateElection,
  refreshElection,
} from "@/lib/api/elections"
import { toast } from "sonner"

const mockedGetElections = vi.mocked(getElections)
const mockedGetElectionDetail = vi.mocked(getElectionDetail)
const mockedCreateElection = vi.mocked(createElection)
const mockedUpdateElection = vi.mocked(updateElection)
const mockedRefreshElection = vi.mocked(refreshElection)

function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe("useAdminElections", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches the elections list", async () => {
    const mockData = mockPaginatedElectionList()
    mockedGetElections.mockResolvedValueOnce(mockData)

    const { result } = renderHook(() => useAdminElections(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedGetElections).toHaveBeenCalledWith({ page_size: 100 })
    expect(result.current.data?.elections).toHaveLength(3)
  })

  it("returns error state on failure", async () => {
    mockedGetElections.mockRejectedValue(new Error("API error"))

    const { result } = renderHook(() => useAdminElections(), {
      wrapper: createWrapper(),
    })

    await waitFor(
      () => expect(result.current.isError).toBe(true),
      { timeout: 5000 },
    )
  })

  it("does not retry on AuthenticationError and shows toast", async () => {
    const authError = new AuthenticationError()
    mockedGetElections.mockRejectedValue(authError)

    const { result } = renderHook(() => useAdminElections(), {
      wrapper: createWrapper(),
    })

    await waitFor(
      () => expect(result.current.isError).toBe(true),
      { timeout: 5000 },
    )

    expect(toast.error).toHaveBeenCalledWith(
      "Session expired",
      expect.objectContaining({ description: authError.message }),
    )
    expect(mockedGetElections).toHaveBeenCalledTimes(1)
  })

  it("does not retry on PermissionError and shows toast", async () => {
    const permError = new PermissionError()
    mockedGetElections.mockRejectedValue(permError)

    const { result } = renderHook(() => useAdminElections(), {
      wrapper: createWrapper(),
    })

    await waitFor(
      () => expect(result.current.isError).toBe(true),
      { timeout: 5000 },
    )

    expect(toast.error).toHaveBeenCalledWith(
      "Access denied",
      expect.objectContaining({ description: permError.message }),
    )
    expect(mockedGetElections).toHaveBeenCalledTimes(1)
  })

  it("shows warning toast on NetworkError", async () => {
    const netError = new NetworkError()
    mockedGetElections.mockRejectedValue(netError)

    const { result } = renderHook(() => useAdminElections(), {
      wrapper: createWrapper(),
    })

    await waitFor(
      () => expect(result.current.isError).toBe(true),
      { timeout: 5000 },
    )

    expect(toast.warning).toHaveBeenCalledWith(
      "Connection issue",
      expect.any(Object),
    )
  })
})

describe("useAdminElectionDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches a single election detail", async () => {
    const election = mockElection()
    mockedGetElectionDetail.mockResolvedValueOnce(election)

    const { result } = renderHook(
      () => useAdminElectionDetail("election-123"),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedGetElectionDetail).toHaveBeenCalledWith("election-123")
    expect(result.current.data?.name).toBe("State Senate District 18 Special")
  })

  it("does not fetch when electionId is empty", () => {
    renderHook(() => useAdminElectionDetail(""), {
      wrapper: createWrapper(),
    })

    expect(mockedGetElectionDetail).not.toHaveBeenCalled()
  })

  it("does not retry on AuthenticationError", async () => {
    const authError = new AuthenticationError()
    mockedGetElectionDetail.mockRejectedValue(authError)

    const { result } = renderHook(
      () => useAdminElectionDetail("election-123"),
      { wrapper: createWrapper() },
    )

    await waitFor(
      () => expect(result.current.isError).toBe(true),
      { timeout: 5000 },
    )

    expect(toast.error).toHaveBeenCalledWith(
      "Session expired",
      expect.objectContaining({ description: authError.message }),
    )
    expect(mockedGetElectionDetail).toHaveBeenCalledTimes(1)
  })

  it("does not retry on PermissionError", async () => {
    const permError = new PermissionError()
    mockedGetElectionDetail.mockRejectedValue(permError)

    const { result } = renderHook(
      () => useAdminElectionDetail("election-123"),
      { wrapper: createWrapper() },
    )

    await waitFor(
      () => expect(result.current.isError).toBe(true),
      { timeout: 5000 },
    )

    expect(toast.error).toHaveBeenCalledWith(
      "Access denied",
      expect.objectContaining({ description: permError.message }),
    )
    expect(mockedGetElectionDetail).toHaveBeenCalledTimes(1)
  })
})

describe("useCreateElection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("creates an election and shows success toast", async () => {
    const newElection = mockElection()
    mockedCreateElection.mockResolvedValueOnce(newElection)

    const { result } = renderHook(() => useCreateElection(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      name: "Test Election",
      election_date: "2026-03-01",
      election_type: "special",
      district: "Test District",
      data_source_url: "https://example.com/results",
      refresh_interval_seconds: 120,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedCreateElection).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith("Election created", expect.any(Object))
  })

  it("shows error toast on generic failure", async () => {
    mockedCreateElection.mockRejectedValueOnce(new Error("Duplicate"))

    const { result } = renderHook(() => useCreateElection(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      name: "Test",
      election_date: "2026-03-01",
      election_type: "special",
      district: "Test",
      data_source_url: "https://example.com",
      refresh_interval_seconds: 120,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(toast.error).toHaveBeenCalledWith(
      "Failed to create election",
      expect.any(Object),
    )
  })

  it("shows session expired toast on AuthenticationError", async () => {
    mockedCreateElection.mockRejectedValueOnce(new AuthenticationError())

    const { result } = renderHook(() => useCreateElection(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      name: "Test",
      election_date: "2026-03-01",
      election_type: "special",
      district: "Test",
      data_source_url: "https://example.com",
      refresh_interval_seconds: 120,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(toast.error).toHaveBeenCalledWith("Session expired", expect.any(Object))
  })

  it("shows access denied toast on PermissionError", async () => {
    mockedCreateElection.mockRejectedValueOnce(new PermissionError())

    const { result } = renderHook(() => useCreateElection(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      name: "Test",
      election_date: "2026-03-01",
      election_type: "special",
      district: "Test",
      data_source_url: "https://example.com",
      refresh_interval_seconds: 120,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(toast.error).toHaveBeenCalledWith("Access denied", expect.any(Object))
  })
})

describe("useUpdateElection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("updates an election and shows success toast", async () => {
    const updated = mockElection({ name: "Updated Name" })
    mockedUpdateElection.mockResolvedValueOnce(updated)

    const { result } = renderHook(() => useUpdateElection(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      electionId: "election-123",
      data: { name: "Updated Name" },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedUpdateElection).toHaveBeenCalledWith("election-123", {
      name: "Updated Name",
    })
    expect(toast.success).toHaveBeenCalledWith("Election updated", expect.any(Object))
  })

  it("shows session expired toast on AuthenticationError", async () => {
    mockedUpdateElection.mockRejectedValueOnce(new AuthenticationError())

    const { result } = renderHook(() => useUpdateElection(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      electionId: "election-123",
      data: { name: "Updated" },
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(toast.error).toHaveBeenCalledWith("Session expired", expect.any(Object))
  })

  it("shows access denied toast on PermissionError", async () => {
    mockedUpdateElection.mockRejectedValueOnce(new PermissionError())

    const { result } = renderHook(() => useUpdateElection(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      electionId: "election-123",
      data: { name: "Updated" },
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(toast.error).toHaveBeenCalledWith("Access denied", expect.any(Object))
  })

  it("shows generic error toast on other failures", async () => {
    mockedUpdateElection.mockRejectedValueOnce(new Error("Server error"))

    const { result } = renderHook(() => useUpdateElection(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      electionId: "election-123",
      data: { name: "Updated" },
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(toast.error).toHaveBeenCalledWith(
      "Failed to update election",
      expect.any(Object),
    )
  })
})

describe("useRefreshElection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("triggers refresh and shows success toast with stats", async () => {
    const refreshData = mockRefreshResponse({
      counties_updated: 10,
      precincts_reporting: 80,
      precincts_participating: 100,
    })
    mockedRefreshElection.mockResolvedValueOnce(refreshData)

    const { result } = renderHook(() => useRefreshElection(), {
      wrapper: createWrapper(),
    })

    result.current.mutate("election-123")

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedRefreshElection).toHaveBeenCalledWith("election-123")
    expect(toast.success).toHaveBeenCalledWith(
      "Election refreshed",
      expect.objectContaining({
        description: expect.stringContaining("10 counties updated"),
      }),
    )
  })

  it("shows session expired toast on AuthenticationError", async () => {
    mockedRefreshElection.mockRejectedValueOnce(new AuthenticationError())

    const { result } = renderHook(() => useRefreshElection(), {
      wrapper: createWrapper(),
    })

    result.current.mutate("election-123")

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(toast.error).toHaveBeenCalledWith("Session expired", expect.any(Object))
  })

  it("shows access denied toast on PermissionError", async () => {
    mockedRefreshElection.mockRejectedValueOnce(new PermissionError())

    const { result } = renderHook(() => useRefreshElection(), {
      wrapper: createWrapper(),
    })

    result.current.mutate("election-123")

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(toast.error).toHaveBeenCalledWith("Access denied", expect.any(Object))
  })

  it("shows generic error toast on other failures", async () => {
    mockedRefreshElection.mockRejectedValueOnce(new Error("Timeout"))

    const { result } = renderHook(() => useRefreshElection(), {
      wrapper: createWrapper(),
    })

    result.current.mutate("election-123")

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(toast.error).toHaveBeenCalledWith(
      "Failed to refresh election",
      expect.any(Object),
    )
  })
})
