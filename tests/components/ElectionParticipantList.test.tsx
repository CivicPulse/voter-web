import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { render } from "@/test/render"
import {
  mockElectionParticipantsResponse,
  mockElectionParticipant,
} from "@/test/mocks/elections"
import type { ElectionParticipantsResponse } from "@/types/elections"

const mockRefetch = vi.fn()
let mockHookReturn: {
  data: ElectionParticipantsResponse | undefined
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

vi.mock("@/lib/hooks/use-election-participants", () => ({
  useElectionParticipants: () => mockHookReturn,
}))

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    params,
  }: {
    children: React.ReactNode
    to: string
    params?: Record<string, string>
  }) => (
    <a href={to} data-params={JSON.stringify(params)} data-testid="voter-link">
      {children}
    </a>
  ),
}))

import { ElectionParticipantList } from "@/components/elections/ElectionParticipantList"

beforeEach(() => {
  vi.clearAllMocks()
  mockHookReturn = {
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: mockRefetch,
  }
})

describe("ElectionParticipantList", () => {
  it("renders Voter List heading and search input", () => {
    mockHookReturn.data = mockElectionParticipantsResponse()
    render(<ElectionParticipantList electionId="election-001" />)

    expect(screen.getByText("Voter List")).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText("Search by name or registration #"),
    ).toBeInTheDocument()
  })

  it("shows loading skeleton while fetching", () => {
    mockHookReturn.isLoading = true
    const { container } = render(
      <ElectionParticipantList electionId="election-001" />,
    )
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("shows error state with retry button", async () => {
    mockHookReturn.isError = true
    render(<ElectionParticipantList electionId="election-001" />)

    expect(
      screen.getByText("Failed to load participant list."),
    ).toBeInTheDocument()

    const retryButton = screen.getByRole("button", { name: /retry/i })
    await userEvent.click(retryButton)
    expect(mockRefetch).toHaveBeenCalled()
  })

  it("renders table with correct columns", () => {
    mockHookReturn.data = mockElectionParticipantsResponse()
    render(<ElectionParticipantList electionId="election-001" />)

    expect(screen.getByText("Registration #")).toBeInTheDocument()
    expect(screen.getByText("County")).toBeInTheDocument()
    expect(screen.getByText("Voting Method")).toBeInTheDocument()
  })

  it("renders participant rows with correct data", () => {
    mockHookReturn.data = mockElectionParticipantsResponse()
    render(<ElectionParticipantList electionId="election-001" />)

    expect(screen.getByText("12345678")).toBeInTheDocument()
    expect(screen.getByText("Bibb")).toBeInTheDocument()

    expect(screen.getByText("87654321")).toBeInTheDocument()
    expect(screen.getByText("Houston")).toBeInTheDocument()
  })

  it("renders registration as link when voter_id is present", () => {
    mockHookReturn.data = mockElectionParticipantsResponse({
      items: [mockElectionParticipant()],
      pagination: { total: 1, page: 1, page_size: 25, total_pages: 1 },
    })
    render(<ElectionParticipantList electionId="election-001" />)

    const link = screen.getByTestId("voter-link")
    expect(link).toHaveAttribute("href", "/voters/$voterId")
    const params = JSON.parse(link.getAttribute("data-params") ?? "{}")
    expect(params.voterId).toBe("e99ba779-9d57-4d0f-b520-63f9095c2391")
    expect(link).toHaveTextContent("12345678")
  })

  it("renders registration as plain text when voter_id is null", () => {
    mockHookReturn.data = mockElectionParticipantsResponse({
      items: [mockElectionParticipant({ voter_id: null })],
      pagination: { total: 1, page: 1, page_size: 25, total_pages: 1 },
    })
    render(<ElectionParticipantList electionId="election-001" />)

    expect(screen.getByText("12345678")).toBeInTheDocument()
    expect(screen.queryByTestId("voter-link")).not.toBeInTheDocument()
  })

  it("renders pagination controls", () => {
    mockHookReturn.data = mockElectionParticipantsResponse()
    render(<ElectionParticipantList electionId="election-001" />)

    expect(screen.getByText(/Page 1 of 3,?140/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled()
    expect(screen.getByRole("button", { name: /next/i })).toBeEnabled()
  })

  it("shows empty state when no participants", () => {
    mockHookReturn.data = mockElectionParticipantsResponse({
      items: [],
      pagination: { total: 0, page: 1, page_size: 25, total_pages: 0 },
    })
    render(<ElectionParticipantList electionId="election-001" />)

    expect(
      screen.getByText("No participants found for this election."),
    ).toBeInTheDocument()
  })

  it("has search input that accepts text", async () => {
    mockHookReturn.data = mockElectionParticipantsResponse()
    render(<ElectionParticipantList electionId="election-001" />)

    const searchInput = screen.getByPlaceholderText(
      "Search by name or registration #",
    )
    await userEvent.type(searchInput, "Jane")
    expect(searchInput).toHaveValue("Jane")
  })

  it("has data-testid for integration testing", () => {
    mockHookReturn.data = mockElectionParticipantsResponse()
    render(<ElectionParticipantList electionId="election-001" />)

    expect(screen.getByTestId("election-participant-list")).toBeInTheDocument()
  })
})
