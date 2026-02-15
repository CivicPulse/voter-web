import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { CountyResultsPanel } from "@/components/elections/CountyResultsPanel"
import { mockCountyResult, mockCandidateResult } from "@/test/mocks/elections"

describe("CountyResultsPanel", () => {
  it("renders county name", () => {
    const county = mockCountyResult({ county_name: "Bibb County" })
    render(<CountyResultsPanel countyResult={county} />)

    expect(screen.getByText("Bibb County")).toBeInTheDocument()
  })

  it("displays reporting percentage badge", () => {
    const county = mockCountyResult({
      precincts_reporting: 38,
      precincts_participating: 45,
    })
    render(<CountyResultsPanel countyResult={county} />)

    expect(screen.getByText("84% reporting")).toBeInTheDocument()
  })

  it("displays precincts reporting text", () => {
    const county = mockCountyResult({
      precincts_reporting: 38,
      precincts_participating: 45,
    })
    render(<CountyResultsPanel countyResult={county} />)

    expect(screen.getByText(/38 of 45 precincts reporting/)).toBeInTheDocument()
  })

  it("renders candidate rows sorted by vote count descending", () => {
    const county = mockCountyResult({
      candidates: [
        mockCandidateResult({ id: "a", name: "Second Place", vote_count: 100 }),
        mockCandidateResult({ id: "b", name: "First Place", vote_count: 300 }),
      ],
    })
    render(<CountyResultsPanel countyResult={county} />)

    const names = screen.getAllByText(/Place/)
    expect(names[0]).toHaveTextContent("First Place")
    expect(names[1]).toHaveTextContent("Second Place")
  })
})
