import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ElectionResultsSection } from "@/components/elections/ElectionResultsSection"
import {
  mockElectionResultsResponse,
  mockCountyResult,
  mockCandidateResult,
} from "@/test/mocks/elections"

describe("ElectionResultsSection", () => {
  const defaultResults = mockElectionResultsResponse()

  it("shows race-wide results when no county is selected", () => {
    render(
      <ElectionResultsSection
        results={defaultResults}
        selectedCounty={null}
        onClearCounty={vi.fn()}
      />,
    )

    expect(screen.getByText("Race-Wide Results")).toBeInTheDocument()
  })

  it("does not show back link when no county is selected", () => {
    render(
      <ElectionResultsSection
        results={defaultResults}
        selectedCounty={null}
        onClearCounty={vi.fn()}
      />,
    )

    expect(
      screen.queryByText("← Back to race-wide results"),
    ).not.toBeInTheDocument()
  })

  it("shows county-specific results when a county is selected", () => {
    const results = mockElectionResultsResponse({
      county_results: [
        mockCountyResult({
          county_name: "Bibb County",
          candidates: [
            mockCandidateResult({ name: "Jane Doe", vote_count: 6200 }),
          ],
        }),
      ],
    })

    render(
      <ElectionResultsSection
        results={results}
        selectedCounty="Bibb County"
        onClearCounty={vi.fn()}
      />,
    )

    const matches = screen.getAllByText("Bibb County")
    expect(matches.length).toBeGreaterThanOrEqual(1)
    expect(
      screen.getByText("← Back to race-wide results"),
    ).toBeInTheDocument()
  })

  it("calls onClearCounty when back link is clicked", async () => {
    const user = userEvent.setup()
    const onClearCounty = vi.fn()
    const results = mockElectionResultsResponse({
      county_results: [mockCountyResult({ county_name: "Bibb County" })],
    })

    render(
      <ElectionResultsSection
        results={results}
        selectedCounty="Bibb County"
        onClearCounty={onClearCounty}
      />,
    )

    await user.click(screen.getByText("← Back to race-wide results"))
    expect(onClearCounty).toHaveBeenCalledOnce()
  })

  it("falls back to race-wide when selected county is not in results", () => {
    render(
      <ElectionResultsSection
        results={defaultResults}
        selectedCounty="Nonexistent County"
        onClearCounty={vi.fn()}
      />,
    )

    expect(screen.getByText("Race-Wide Results")).toBeInTheDocument()
  })
})
