import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { render } from "@/test/render"
import { mockElectionParticipantsResponse } from "@/test/mocks/elections"
import type { ParticipantUrlParams } from "@/types/elections"

// Mock TanStack Router's Link so it renders as a plain anchor
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>()
  return {
    ...actual,
    Link: ({
      children,
      to,
      params,
    }: {
      children: React.ReactNode
      to: string
      params?: Record<string, string>
    }) => (
      <a href={`${to}/${params?.voterId ?? ""}`}>{children}</a>
    ),
  }
})

vi.mock("@/lib/hooks/use-election-participants", () => ({
  useElectionParticipants: vi.fn(),
}))

import { useElectionParticipants } from "@/lib/hooks/use-election-participants"
import { ElectionParticipantList } from "@/components/elections/ElectionParticipantList"

const mockedUseElectionParticipants = vi.mocked(useElectionParticipants)

const defaultParams: ParticipantUrlParams = {}

function makeLoadingState() {
  return {
    data: undefined,
    isLoading: true,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useElectionParticipants>
}

function makeSuccessState(
  overrides?: Partial<ReturnType<typeof mockElectionParticipantsResponse>>,
) {
  return {
    data: mockElectionParticipantsResponse(overrides),
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useElectionParticipants>
}

function makeEmptyState(
  paginationOverrides?: Partial<{
    total: number
    page: number
    page_size: number
    total_pages: number
  }>,
) {
  return {
    data: mockElectionParticipantsResponse({
      items: [],
      pagination: {
        total: 0,
        page: 1,
        page_size: 25,
        total_pages: 0,
        ...paginationOverrides,
      },
    }),
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useElectionParticipants>
}

describe("ElectionParticipantList", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders loading skeleton when loading", () => {
    mockedUseElectionParticipants.mockReturnValue(makeLoadingState())

    render(
      <ElectionParticipantList
        electionId="election-001"
        params={defaultParams}
        onUpdate={vi.fn()}
      />,
    )

    // The skeleton renders divs with "animate-pulse" class (shadcn Skeleton)
    const skeletons = document.querySelectorAll(".animate-pulse")
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("renders table rows when data is loaded", async () => {
    mockedUseElectionParticipants.mockReturnValue(makeSuccessState())

    render(
      <ElectionParticipantList
        electionId="election-001"
        params={defaultParams}
        onUpdate={vi.fn()}
      />,
    )

    // The mock response has 2 participants: Jane Doe and John Smith
    expect(screen.getByText("Jane Doe")).toBeInTheDocument()
    expect(screen.getByText("John Smith")).toBeInTheDocument()
  })

  it("shows 'No participants found for this election.' when no items and no active filters", () => {
    mockedUseElectionParticipants.mockReturnValue(makeEmptyState())

    render(
      <ElectionParticipantList
        electionId="election-001"
        params={defaultParams}
        onUpdate={vi.fn()}
      />,
    )

    expect(
      screen.getByText("No participants found for this election."),
    ).toBeInTheDocument()
  })

  it("shows 'No voters match the current filters.' when no items and p_county is set", () => {
    mockedUseElectionParticipants.mockReturnValue(makeEmptyState())

    render(
      <ElectionParticipantList
        electionId="election-001"
        params={{ p_county: "Bibb" }}
        onUpdate={vi.fn()}
      />,
    )

    expect(
      screen.getByText("No voters match the current filters."),
    ).toBeInTheDocument()
  })

  it("shows 'No voters match the current filters.' when no items and p_q is set", () => {
    mockedUseElectionParticipants.mockReturnValue(makeEmptyState())

    render(
      <ElectionParticipantList
        electionId="election-001"
        params={{ p_q: "Jane" }}
        onUpdate={vi.fn()}
      />,
    )

    expect(
      screen.getByText("No voters match the current filters."),
    ).toBeInTheDocument()
  })

  it("calls onUpdate with p_page incremented when Next button is clicked", async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()

    mockedUseElectionParticipants.mockReturnValue(
      makeSuccessState({
        pagination: { total: 100, page: 1, page_size: 25, total_pages: 4 },
      }),
    )

    render(
      <ElectionParticipantList
        electionId="election-001"
        params={defaultParams}
        onUpdate={onUpdate}
      />,
    )

    await user.click(screen.getByRole("button", { name: /next/i }))
    expect(onUpdate).toHaveBeenCalledWith({ p_page: 2 })
  })

  it("calls onUpdate with p_page decremented when Previous button is clicked", async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()

    mockedUseElectionParticipants.mockReturnValue(
      makeSuccessState({
        pagination: { total: 100, page: 3, page_size: 25, total_pages: 4 },
      }),
    )

    render(
      <ElectionParticipantList
        electionId="election-001"
        params={{ p_page: 3 }}
        onUpdate={onUpdate}
      />,
    )

    await user.click(screen.getByRole("button", { name: /previous/i }))
    expect(onUpdate).toHaveBeenCalledWith({ p_page: 2 })
  })

  it("Previous button is disabled on page 1", () => {
    mockedUseElectionParticipants.mockReturnValue(
      makeSuccessState({
        pagination: { total: 100, page: 1, page_size: 25, total_pages: 4 },
      }),
    )

    render(
      <ElectionParticipantList
        electionId="election-001"
        params={defaultParams}
        onUpdate={vi.fn()}
      />,
    )

    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled()
  })

  it("Next button is disabled on the last page", () => {
    mockedUseElectionParticipants.mockReturnValue(
      makeSuccessState({
        pagination: { total: 100, page: 4, page_size: 25, total_pages: 4 },
      }),
    )

    render(
      <ElectionParticipantList
        electionId="election-001"
        params={{ p_page: 4 }}
        onUpdate={vi.fn()}
      />,
    )

    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled()
  })
})
