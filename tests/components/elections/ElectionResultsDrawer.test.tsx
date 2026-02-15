import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ElectionResultsDrawer } from "@/components/elections/ElectionResultsDrawer"
import {
  mockElectionResultsResponse,
  mockCountyResult,
  mockCandidateResult,
} from "@/test/mocks/elections"

describe("ElectionResultsDrawer", () => {
  const defaultResults = mockElectionResultsResponse()

  it("renders trigger button", () => {
    render(
      <ElectionResultsDrawer
        open={false}
        onOpenChange={vi.fn()}
        results={defaultResults}
        selectedCounty={null}
        onClearCounty={vi.fn()}
      />,
    )

    expect(screen.getByText("View Results")).toBeInTheDocument()
  })

  it("shows county name in trigger when county is selected", () => {
    render(
      <ElectionResultsDrawer
        open={false}
        onOpenChange={vi.fn()}
        results={defaultResults}
        selectedCounty="Bibb County"
        onClearCounty={vi.fn()}
      />,
    )

    expect(screen.getByText("View Bibb County Results")).toBeInTheDocument()
  })

  it("calls onOpenChange when trigger is clicked", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    render(
      <ElectionResultsDrawer
        open={false}
        onOpenChange={onOpenChange}
        results={defaultResults}
        selectedCounty={null}
        onClearCounty={vi.fn()}
      />,
    )

    await user.click(screen.getByText("View Results"))
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it("shows race-wide results when no county selected and drawer is open", () => {
    render(
      <ElectionResultsDrawer
        open={true}
        onOpenChange={vi.fn()}
        results={defaultResults}
        selectedCounty={null}
        onClearCounty={vi.fn()}
      />,
    )

    expect(screen.getByText("Race-Wide Results")).toBeInTheDocument()
    expect(screen.getByText("Race Results")).toBeInTheDocument()
  })

  it("shows county-specific results when county is selected", () => {
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
      <ElectionResultsDrawer
        open={true}
        onOpenChange={vi.fn()}
        results={results}
        selectedCounty="Bibb County"
        onClearCounty={vi.fn()}
      />,
    )

    // "Bibb County" appears in both drawer title and county panel heading
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
      <ElectionResultsDrawer
        open={true}
        onOpenChange={vi.fn()}
        results={results}
        selectedCounty="Bibb County"
        onClearCounty={onClearCounty}
      />,
    )

    await user.click(screen.getByText("← Back to race-wide results"))
    expect(onClearCounty).toHaveBeenCalledOnce()
  })
})
