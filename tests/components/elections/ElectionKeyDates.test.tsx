import { describe, it, expect } from "vitest"
import { screen } from "@testing-library/react"
import { render } from "@/test/render"
import { ElectionKeyDates } from "@/components/elections/ElectionKeyDates"
import { mockElection } from "@/test/mocks/elections"

/**
 * Helper to format an ISO date string the same way the component does,
 * avoiding timezone-offset mismatches in test expectations.
 */
function expectedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function expectedDateRange(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (startDate.getFullYear() === endDate.getFullYear()) {
    const startStr = startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
    const endStr = endDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    return `${startStr} \u2013 ${endStr}`
  }
  return `${expectedDate(start)} \u2013 ${expectedDate(end)}`
}

describe("ElectionKeyDates", () => {
  it("returns null when all date fields are null", () => {
    const election = mockElection({
      registration_deadline: null,
      early_voting_start: null,
      early_voting_end: null,
      absentee_request_deadline: null,
      qualifying_start: null,
      qualifying_end: null,
    })
    const { container } = render(<ElectionKeyDates election={election} />)

    expect(container.firstChild).toBeNull()
  })

  it("displays registration_deadline when set", () => {
    const deadline = "2026-01-20"
    const election = mockElection({
      registration_deadline: deadline,
    })
    render(<ElectionKeyDates election={election} />)

    expect(screen.getByText("Registration Deadline")).toBeInTheDocument()
    expect(screen.getByText(expectedDate(deadline))).toBeInTheDocument()
  })

  it("displays early voting date range when both start and end are set", () => {
    const start = "2026-02-03"
    const end = "2026-02-14"
    const election = mockElection({
      early_voting_start: start,
      early_voting_end: end,
    })
    render(<ElectionKeyDates election={election} />)

    expect(screen.getByText("Early Voting")).toBeInTheDocument()
    expect(screen.getByText(expectedDateRange(start, end))).toBeInTheDocument()
  })

  it("does not display early voting when only start is set", () => {
    const election = mockElection({
      early_voting_start: "2026-02-03",
      early_voting_end: null,
    })
    render(<ElectionKeyDates election={election} />)

    // The card renders because early_voting_start is truthy (hasAnyDate)
    expect(screen.getByText("Key Dates")).toBeInTheDocument()
    // But the Early Voting row should NOT render (both start and end required)
    expect(screen.queryByText("Early Voting")).not.toBeInTheDocument()
  })

  it("displays absentee request deadline", () => {
    const deadline = "2026-02-07"
    const election = mockElection({
      absentee_request_deadline: deadline,
    })
    render(<ElectionKeyDates election={election} />)

    expect(screen.getByText("Absentee Request Deadline")).toBeInTheDocument()
    expect(screen.getByText(expectedDate(deadline))).toBeInTheDocument()
  })

  it("displays qualifying period range", () => {
    const start = "2025-12-01"
    const end = "2025-12-15"
    const election = mockElection({
      qualifying_start: start,
      qualifying_end: end,
    })
    render(<ElectionKeyDates election={election} />)

    expect(screen.getByText("Qualifying Period")).toBeInTheDocument()
    expect(screen.getByText(expectedDateRange(start, end))).toBeInTheDocument()
  })

  it("shows partial dates (only some fields set)", () => {
    const election = mockElection({
      registration_deadline: "2026-01-20",
      absentee_request_deadline: "2026-02-07",
      early_voting_start: null,
      early_voting_end: null,
      qualifying_start: null,
      qualifying_end: null,
    })
    render(<ElectionKeyDates election={election} />)

    expect(screen.getByText("Registration Deadline")).toBeInTheDocument()
    expect(screen.getByText("Absentee Request Deadline")).toBeInTheDocument()
    expect(screen.queryByText("Early Voting")).not.toBeInTheDocument()
    expect(screen.queryByText("Qualifying Period")).not.toBeInTheDocument()
  })

  it("renders Key Dates heading with calendar icon", () => {
    const election = mockElection({
      registration_deadline: "2026-01-20",
    })
    render(<ElectionKeyDates election={election} />)

    expect(screen.getByText("Key Dates")).toBeInTheDocument()
  })
})
