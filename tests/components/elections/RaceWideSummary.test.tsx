import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { RaceWideSummary } from "@/components/elections/RaceWideSummary"
import {
  mockElectionResultsResponse,
  mockCandidateResult,
} from "@/test/mocks/elections"

describe("RaceWideSummary", () => {
  it("displays reporting percentage badge", () => {
    const results = mockElectionResultsResponse({
      total_precincts_reporting: 50,
      total_precincts_participating: 100,
    })

    render(<RaceWideSummary results={results} />)

    expect(screen.getByText("50% reporting")).toBeInTheDocument()
  })

  it("displays precinct counts and total votes", () => {
    const results = mockElectionResultsResponse({
      total_precincts_reporting: 25,
      total_precincts_participating: 50,
      candidates: [
        mockCandidateResult({ vote_count: 1000 }),
        mockCandidateResult({ vote_count: 800 }),
      ],
    })

    render(<RaceWideSummary results={results} />)

    expect(screen.getByText(/25 of 50 precincts reporting/)).toBeInTheDocument()
    expect(screen.getByText(/1,800 total votes/)).toBeInTheDocument()
  })

  it("renders candidates sorted by vote count descending", () => {
    const results = mockElectionResultsResponse({
      candidates: [
        mockCandidateResult({ name: "Low Votes", vote_count: 100 }),
        mockCandidateResult({ name: "High Votes", vote_count: 500 }),
        mockCandidateResult({ name: "Mid Votes", vote_count: 300 }),
      ],
    })

    render(<RaceWideSummary results={results} />)

    const names = screen.getAllByText(/Votes$/)
    expect(names[0]).toHaveTextContent("High Votes")
    expect(names[1]).toHaveTextContent("Mid Votes")
    expect(names[2]).toHaveTextContent("Low Votes")
  })

  it("handles zero total votes gracefully", () => {
    const results = mockElectionResultsResponse({
      total_precincts_reporting: 0,
      total_precincts_participating: 10,
      candidates: [
        mockCandidateResult({ vote_count: 0 }),
      ],
    })

    render(<RaceWideSummary results={results} />)

    expect(screen.getByText("0% reporting")).toBeInTheDocument()
    expect(screen.getByText(/0 total votes/)).toBeInTheDocument()
  })
})
