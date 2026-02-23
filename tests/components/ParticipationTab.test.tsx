import { describe, it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import { render } from "@/test/render"

vi.mock("@/components/elections/ParticipationStatsCard", () => ({
  ParticipationStatsCard: ({ electionId }: { electionId: string }) => (
    <div data-testid="participation-stats-card" data-election-id={electionId}>
      Stats Card
    </div>
  ),
}))

import { ParticipationTab } from "@/components/elections/ParticipationTab"

describe("ParticipationTab", () => {
  it("renders ParticipationStatsCard with election ID", () => {
    render(<ParticipationTab electionId="election-001" />)

    const statsCard = screen.getByTestId("participation-stats-card")
    expect(statsCard).toBeInTheDocument()
    expect(statsCard).toHaveAttribute("data-election-id", "election-001")
  })

  it("does not render voter list (added in Phase 5)", () => {
    render(<ParticipationTab electionId="election-001" />)

    expect(screen.queryByTestId("election-participant-list")).not.toBeInTheDocument()
  })
})
