import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CandidateResultRow } from "@/components/elections/CandidateResultRow"
import { mockCandidateResult } from "@/test/mocks/elections"
import { buildCandidateColorMap, PARTY_SHADE_PALETTES } from "@/lib/candidate-colors"

describe("CandidateResultRow", () => {
  it("renders candidate name and party", () => {
    const candidate = mockCandidateResult({ name: "Jane Doe", political_party: "Dem" })
    render(<CandidateResultRow candidate={candidate} totalVotes={20000} rank={1} />)

    expect(screen.getByText("Jane Doe")).toBeInTheDocument()
    expect(screen.getByText("Dem")).toBeInTheDocument()
  })

  it("renders vote count and percentage", () => {
    const candidate = mockCandidateResult({ vote_count: 12500 })
    render(<CandidateResultRow candidate={candidate} totalVotes={25000} rank={1} />)

    expect(screen.getByText(/12,500/)).toBeInTheDocument()
    expect(screen.getByText(/50\.0%/)).toBeInTheDocument()
  })

  it("renders rank number", () => {
    const candidate = mockCandidateResult()
    render(<CandidateResultRow candidate={candidate} totalVotes={20000} rank={2} />)

    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("shows vote methods toggle when group_results exist", () => {
    const candidate = mockCandidateResult()
    render(<CandidateResultRow candidate={candidate} totalVotes={20000} rank={1} />)

    expect(screen.getByText("Vote methods")).toBeInTheDocument()
  })

  it("expands to show vote method breakdowns on click", async () => {
    const user = userEvent.setup()
    const candidate = mockCandidateResult()
    render(<CandidateResultRow candidate={candidate} totalVotes={20000} rank={1} />)

    await user.click(screen.getByText("Vote methods"))

    expect(screen.getByText("Election Day")).toBeInTheDocument()
    expect(screen.getByText("Advance Voting")).toBeInTheDocument()
    expect(screen.getByText("Absentee by Mail")).toBeInTheDocument()
  })

  it("hides vote methods toggle when group_results is empty", () => {
    const candidate = mockCandidateResult({ group_results: [] })
    render(<CandidateResultRow candidate={candidate} totalVotes={20000} rank={1} />)

    expect(screen.queryByText("Vote methods")).not.toBeInTheDocument()
  })

  it("handles zero total votes without error", () => {
    const candidate = mockCandidateResult({ vote_count: 0 })
    render(<CandidateResultRow candidate={candidate} totalVotes={0} rank={1} />)

    expect(screen.getByText(/0\.0%/)).toBeInTheDocument()
  })

  it("uses candidate color map shade instead of default party color", () => {
    const candidates = [
      mockCandidateResult({ id: "r1", political_party: "Rep", vote_count: 500 }),
      mockCandidateResult({ id: "r2", name: "Second Rep", political_party: "Rep", vote_count: 200 }),
    ]
    const colorMap = buildCandidateColorMap(candidates)

    const { container } = render(
      <CandidateResultRow
        candidate={candidates[1]}
        totalVotes={700}
        rank={2}
        candidateColorMap={colorMap}
      />,
    )

    // The colored dot should use the second shade, not the default Rep color
    const dot = container.querySelector(".rounded-full")
    expect(dot).toHaveStyle({
      backgroundColor: PARTY_SHADE_PALETTES.Rep[1].fill,
    })
  })
})
