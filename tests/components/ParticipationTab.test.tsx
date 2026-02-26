import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen } from "@testing-library/react"
import { render } from "@/test/render"

const mockUseUserRole = vi.fn()

vi.mock("@/lib/hooks/use-user-role", () => ({
  useUserRole: () => mockUseUserRole(),
}))

vi.mock("@/routes/elections/$electionDate", () => ({
  Route: {
    useSearch: () => ({}),
    fullPath: "/elections/$electionDate",
  },
}))

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router")
  return {
    ...actual,
    useNavigate: () => () => vi.fn(),
  }
})

vi.mock("@/components/elections/ParticipationStatsCard", () => ({
  ParticipationStatsCard: ({ electionId }: { electionId: string }) => (
    <div data-testid="participation-stats-card" data-election-id={electionId}>
      Stats Card
    </div>
  ),
}))

vi.mock("@/components/elections/ElectionParticipantList", () => ({
  ElectionParticipantList: ({ electionId }: { electionId: string }) => (
    <div data-testid="election-participant-list" data-election-id={electionId}>
      Participant List
    </div>
  ),
}))

import { ParticipationTab } from "@/components/elections/ParticipationTab"

beforeEach(() => {
  vi.clearAllMocks()
  mockUseUserRole.mockReturnValue({ data: { role: "viewer" } })
})

describe("ParticipationTab", () => {
  it("renders ParticipationStatsCard with election ID", () => {
    render(<ParticipationTab electionId="election-001" />)

    const statsCard = screen.getByTestId("participation-stats-card")
    expect(statsCard).toBeInTheDocument()
    expect(statsCard).toHaveAttribute("data-election-id", "election-001")
  })

  it("renders ElectionParticipantList for admin role", () => {
    mockUseUserRole.mockReturnValue({ data: { role: "admin" } })
    render(<ParticipationTab electionId="election-001" />)

    expect(screen.getByTestId("election-participant-list")).toBeInTheDocument()
  })

  it("renders ElectionParticipantList for analyst role", () => {
    mockUseUserRole.mockReturnValue({ data: { role: "analyst" } })
    render(<ParticipationTab electionId="election-001" />)

    expect(screen.getByTestId("election-participant-list")).toBeInTheDocument()
  })

  it("does NOT render ElectionParticipantList for viewer role", () => {
    mockUseUserRole.mockReturnValue({ data: { role: "viewer" } })
    render(<ParticipationTab electionId="election-001" />)

    expect(screen.queryByTestId("election-participant-list")).not.toBeInTheDocument()
  })

  it("does NOT render ElectionParticipantList when user profile is undefined", () => {
    mockUseUserRole.mockReturnValue({ data: undefined })
    render(<ParticipationTab electionId="election-001" />)

    expect(screen.queryByTestId("election-participant-list")).not.toBeInTheDocument()
  })

  it("unmounts (not hides) the participant list for viewer role", () => {
    mockUseUserRole.mockReturnValue({ data: { role: "viewer" } })
    const { container } = render(<ParticipationTab electionId="election-001" />)

    // Verify there's no hidden element either
    const hiddenList = container.querySelector("[data-testid='election-participant-list']")
    expect(hiddenList).toBeNull()
  })
})
