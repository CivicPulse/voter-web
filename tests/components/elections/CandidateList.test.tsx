import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen } from "@testing-library/react"
import { render } from "@/test/render"
import {
  mockPaginatedCandidateList,
  mockCandidateSummary,
} from "@/test/mocks/candidates"
import {
  mockElectionResultsResponse,
  mockCandidateResult,
} from "@/test/mocks/elections"

// ---- hook mocks (must come before component import) ----

const mockUseCandidates = vi.fn()
const mockUseCandidateDetail = vi.fn()
const mockUseRaceResults = vi.fn()
const mockUseUserRole = vi.fn()
const mockDeleteMutate = vi.fn()

vi.mock("@/lib/hooks/use-candidates", () => ({
  useCandidates: (...args: unknown[]) => mockUseCandidates(...args),
  useCandidateDetail: (...args: unknown[]) => mockUseCandidateDetail(...args),
}))

vi.mock("@/lib/hooks/use-race-results", () => ({
  useRaceResults: (...args: unknown[]) => mockUseRaceResults(...args),
}))

vi.mock("@/lib/hooks/use-user-role", () => ({
  useUserRole: () => mockUseUserRole(),
}))

vi.mock("@/lib/hooks/use-admin-candidates", () => ({
  useDeleteCandidate: () => ({ mutate: mockDeleteMutate, isPending: false }),
}))

// Mock child components that are not under test
vi.mock("@/components/elections/CandidateCard", () => ({
  CandidateCard: ({ candidate }: { candidate: { full_name: string } }) => (
    <div data-testid="candidate-card">{candidate.full_name}</div>
  ),
}))

vi.mock("@/components/elections/AdminCandidateDialog", () => ({
  AdminCandidateDialog: () => <div data-testid="admin-candidate-dialog" />,
}))

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router")
  return {
    ...actual,
    Link: ({ children, ...props }: Record<string, unknown>) => (
      <a {...props}>{children as React.ReactNode}</a>
    ),
  }
})

import { CandidateList } from "@/components/elections/CandidateList"

// ---- helpers ----

const ELECTION_ID = "550e8400-e29b-41d4-a716-446655440000"
const refetchFn = vi.fn()

function defaultHookValues() {
  mockUseCandidates.mockReturnValue({
    data: mockPaginatedCandidateList(),
    isLoading: false,
    error: null,
    refetch: refetchFn,
  })
  mockUseRaceResults.mockReturnValue({ data: null })
  mockUseUserRole.mockReturnValue({ data: { role: "viewer" } })
  mockUseCandidateDetail.mockReturnValue({ data: null })
}

// ---- tests ----

beforeEach(() => {
  vi.clearAllMocks()
  defaultHookValues()
})

describe("CandidateList", () => {
  it("shows candidates from the API when available", () => {
    render(<CandidateList electionId={ELECTION_ID} />)

    // The paginated mock contains two candidates
    expect(screen.getAllByTestId("candidate-card")).toHaveLength(2)
    expect(screen.getByText("Andrea C. Cooke")).toBeInTheDocument()
    expect(screen.getByText("Robert T. Williams")).toBeInTheDocument()
  })

  it("calls useCandidates with page_size=100", () => {
    render(<CandidateList electionId={ELECTION_ID} />)

    expect(mockUseCandidates).toHaveBeenCalledWith(ELECTION_ID, {
      page_size: 100,
    })
  })

  it("falls back to results candidates when API returns empty", () => {
    mockUseCandidates.mockReturnValue({
      data: { items: [], pagination: { total: 0, page: 1, page_size: 20, total_pages: 0 } },
      isLoading: false,
      error: null,
      refetch: refetchFn,
    })

    const raceData = {
      election: {},
      results: mockElectionResultsResponse({
        candidates: [
          mockCandidateResult({ id: "rc-1", name: "Fallback Candidate", political_party: "Ind" }),
        ],
      }),
    }
    mockUseRaceResults.mockReturnValue({ data: raceData })

    render(<CandidateList electionId={ELECTION_ID} />)

    expect(screen.getByText("Fallback Candidate")).toBeInTheDocument()
  })

  it('shows "Candidates not yet announced" when both sources are empty', () => {
    mockUseCandidates.mockReturnValue({
      data: { items: [], pagination: { total: 0, page: 1, page_size: 20, total_pages: 0 } },
      isLoading: false,
      error: null,
      refetch: refetchFn,
    })
    mockUseRaceResults.mockReturnValue({ data: null })

    render(<CandidateList electionId={ELECTION_ID} />)

    expect(
      screen.getByText("Candidates not yet announced."),
    ).toBeInTheDocument()
  })

  it("shows error state with retry button", async () => {
    const { default: userEvent } = await import("@testing-library/user-event")
    const user = userEvent.setup()

    mockUseCandidates.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("Network error"),
      refetch: refetchFn,
    })

    render(<CandidateList electionId={ELECTION_ID} />)

    expect(screen.getByText("Failed to load candidates.")).toBeInTheDocument()
    const retryBtn = screen.getByRole("button", { name: /retry/i })
    expect(retryBtn).toBeInTheDocument()

    await user.click(retryBtn)
    expect(refetchFn).toHaveBeenCalledTimes(1)
  })

  it("shows skeleton loading state", () => {
    mockUseCandidates.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: refetchFn,
    })

    const { container } = render(<CandidateList electionId={ELECTION_ID} />)

    // Three skeleton pulse elements
    const skeletons = container.querySelectorAll(".animate-pulse")
    expect(skeletons.length).toBe(3)
  })

  it('"Add Candidate" button is visible for admin role', () => {
    mockUseUserRole.mockReturnValue({ data: { role: "admin" } })

    render(<CandidateList electionId={ELECTION_ID} />)

    expect(
      screen.getByRole("button", { name: /add candidate/i }),
    ).toBeInTheDocument()
  })

  it('"Edit" and "Delete" buttons are visible for admin role', () => {
    mockUseUserRole.mockReturnValue({ data: { role: "admin" } })

    render(<CandidateList electionId={ELECTION_ID} />)

    // Two candidates in the mock, each has Edit + Delete
    expect(screen.getByLabelText("Edit Andrea C. Cooke")).toBeInTheDocument()
    expect(screen.getByLabelText("Delete Andrea C. Cooke")).toBeInTheDocument()
    expect(
      screen.getByLabelText("Edit Robert T. Williams"),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText("Delete Robert T. Williams"),
    ).toBeInTheDocument()
  })

  it("admin controls are hidden for non-admin users", () => {
    mockUseUserRole.mockReturnValue({ data: { role: "viewer" } })

    render(<CandidateList electionId={ELECTION_ID} />)

    expect(
      screen.queryByRole("button", { name: /add candidate/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByLabelText("Edit Andrea C. Cooke"),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByLabelText("Delete Andrea C. Cooke"),
    ).not.toBeInTheDocument()
  })

  it("admin controls are hidden for analyst users", () => {
    mockUseUserRole.mockReturnValue({ data: { role: "analyst" } })

    render(<CandidateList electionId={ELECTION_ID} />)

    expect(
      screen.queryByRole("button", { name: /add candidate/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByLabelText("Edit Andrea C. Cooke"),
    ).not.toBeInTheDocument()
  })

  it("sorts candidates by ballot_order then alphabetically", () => {
    const items = [
      mockCandidateSummary({
        id: "c-3",
        full_name: "Zebra Last",
        ballot_order: null,
      }),
      mockCandidateSummary({
        id: "c-2",
        full_name: "Beta Second",
        ballot_order: 2,
      }),
      mockCandidateSummary({
        id: "c-1",
        full_name: "Alpha First",
        ballot_order: 1,
      }),
      mockCandidateSummary({
        id: "c-4",
        full_name: "Alpha NoBallot",
        ballot_order: null,
      }),
    ]

    mockUseCandidates.mockReturnValue({
      data: {
        items,
        pagination: { total: 4, page: 1, page_size: 100, total_pages: 1 },
      },
      isLoading: false,
      error: null,
      refetch: refetchFn,
    })

    render(<CandidateList electionId={ELECTION_ID} />)

    const cards = screen.getAllByTestId("candidate-card")
    expect(cards[0]).toHaveTextContent("Alpha First") // ballot_order 1
    expect(cards[1]).toHaveTextContent("Beta Second") // ballot_order 2
    expect(cards[2]).toHaveTextContent("Alpha NoBallot") // null, alpha
    expect(cards[3]).toHaveTextContent("Zebra Last") // null, zeta
  })
})
