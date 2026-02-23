import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { render } from "@/test/render"
import { mockVoterHistory, mockVoterParticipationRecord } from "@/test/mocks/voters"
import type { VoterParticipationRecord } from "@/types/voter"

const mockRefetch = vi.fn()
let mockHookReturn: {
  data: VoterParticipationRecord[] | undefined
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

vi.mock("@/hooks/useVoters", () => ({
  useVoterHistory: () => mockHookReturn,
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
    <a
      href={to}
      data-params={JSON.stringify(params)}
      data-testid="election-link"
    >
      {children}
    </a>
  ),
}))

import { VoterHistoryCard } from "@/routes/voters/_components/VoterHistoryCard"

beforeEach(() => {
  vi.clearAllMocks()
  mockHookReturn = {
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: mockRefetch,
  }
})

describe("VoterHistoryCard", () => {
  it("renders card header", () => {
    mockHookReturn.data = []
    render(<VoterHistoryCard voterRegistrationNumber="12345678" />)
    expect(screen.getByText("Election History")).toBeInTheDocument()
  })

  it("shows loading skeleton while fetching", () => {
    mockHookReturn.isLoading = true
    const { container } = render(
      <VoterHistoryCard voterRegistrationNumber="12345678" />,
    )
    // Skeleton elements should be present
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it("shows error state with retry button", async () => {
    mockHookReturn.isError = true
    render(<VoterHistoryCard voterRegistrationNumber="12345678" />)

    expect(
      screen.getByText("Failed to load election history."),
    ).toBeInTheDocument()

    const retryButton = screen.getByRole("button", { name: /retry/i })
    expect(retryButton).toBeInTheDocument()

    await userEvent.click(retryButton)
    expect(mockRefetch).toHaveBeenCalled()
  })

  it("shows empty state when no history exists", () => {
    mockHookReturn.data = []
    render(<VoterHistoryCard voterRegistrationNumber="12345678" />)
    expect(
      screen.getByText("No election history found for this voter."),
    ).toBeInTheDocument()
  })

  it("renders election records with name, date, type badge, and voting method", () => {
    mockHookReturn.data = mockVoterHistory()
    render(<VoterHistoryCard voterRegistrationNumber="12345678" />)

    expect(screen.getByText("US Senate - General")).toBeInTheDocument()
    expect(screen.getByText("General")).toBeInTheDocument()
    expect(screen.getByText(/In Person/)).toBeInTheDocument()

    expect(
      screen.getByText("State House District 145 - Primary"),
    ).toBeInTheDocument()
    expect(screen.getByText("Primary")).toBeInTheDocument()
    expect(screen.getByText(/Early Voting/)).toBeInTheDocument()

    expect(screen.getByText("City Council Special")).toBeInTheDocument()
    expect(screen.getByText("Special")).toBeInTheDocument()
    expect(screen.getByText(/Absentee by Mail/)).toBeInTheDocument()
  })

  it("renders records in most-recent-first order", () => {
    mockHookReturn.data = mockVoterHistory()
    render(<VoterHistoryCard voterRegistrationNumber="12345678" />)

    const links = screen.getAllByTestId("election-link")
    // Data is already sorted most-recent-first from API
    expect(links[0]).toHaveTextContent("US Senate - General")
    expect(links[1]).toHaveTextContent("State House District 145 - Primary")
    expect(links[2]).toHaveTextContent("City Council Special")
  })

  it("renders clickable links to election detail pages", () => {
    mockHookReturn.data = [mockVoterParticipationRecord()]
    render(<VoterHistoryCard voterRegistrationNumber="12345678" />)

    const link = screen.getByTestId("election-link")
    expect(link).toHaveAttribute("href", "/elections/$electionDate/$electionId")
    const params = JSON.parse(link.getAttribute("data-params") ?? "{}")
    expect(params.electionDate).toBe("2024-11-05")
    expect(params.electionId).toBe("a1b2c3d4-e5f6-7890-abcd-ef1234567890")
  })

  it("renders election type filter dropdown", () => {
    mockHookReturn.data = mockVoterHistory()
    render(<VoterHistoryCard voterRegistrationNumber="12345678" />)

    // The select trigger is rendered with combobox role
    const trigger = screen.getByRole("combobox")
    expect(trigger).toBeInTheDocument()
  })

  it("filters by date range", async () => {
    mockHookReturn.data = mockVoterHistory()
    render(<VoterHistoryCard voterRegistrationNumber="12345678" />)

    // Initially all 3 records visible
    expect(screen.getAllByTestId("election-link")).toHaveLength(3)

    // Set date-from to filter out older records
    const dateFromInput = screen.getByLabelText("Date from")
    await userEvent.clear(dateFromInput)
    await userEvent.type(dateFromInput, "2024-01-01")

    // Only 2024 records should remain (2024-11-05 and 2024-05-21)
    expect(screen.getAllByTestId("election-link")).toHaveLength(2)
    expect(screen.queryByText("City Council Special")).not.toBeInTheDocument()
  })

  it("shows no-match message when date range excludes all records", async () => {
    mockHookReturn.data = mockVoterHistory()
    render(<VoterHistoryCard voterRegistrationNumber="12345678" />)

    // Set date range that excludes everything
    const dateFromInput = screen.getByLabelText("Date from")
    await userEvent.clear(dateFromInput)
    await userEvent.type(dateFromInput, "2030-01-01")

    expect(
      screen.getByText("No elections match the current filters."),
    ).toBeInTheDocument()
  })
})
