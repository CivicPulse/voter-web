import { describe, it, expect } from "vitest"
import { screen } from "@testing-library/react"
import { render } from "@/test/render"
import { ElectionMetadata } from "@/components/elections/ElectionMetadata"
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

describe("ElectionMetadata", () => {
  it("displays formatted date", () => {
    const electionDate = "2026-02-17"
    const election = mockElection({
      election_date: electionDate,
    })
    render(<ElectionMetadata election={election} />)

    expect(screen.getByText("Date")).toBeInTheDocument()
    expect(screen.getByText(expectedDate(electionDate))).toBeInTheDocument()
  })

  it("capitalizes election type", () => {
    const election = mockElection({
      election_type: "special",
    })
    render(<ElectionMetadata election={election} />)

    expect(screen.getByText("Type")).toBeInTheDocument()
    expect(screen.getByText("Special")).toBeInTheDocument()
  })

  it("capitalizes general election type", () => {
    const election = mockElection({
      election_type: "general",
    })
    render(<ElectionMetadata election={election} />)

    expect(screen.getByText("General")).toBeInTheDocument()
  })

  it("shows Active status badge when status is active", () => {
    const election = mockElection({ status: "active" })
    render(<ElectionMetadata election={election} />)

    expect(screen.getByText("Status")).toBeInTheDocument()
    expect(screen.getByText("Active")).toBeInTheDocument()
  })

  it("shows Finalized status badge when status is finalized", () => {
    const election = mockElection({ status: "finalized" })
    render(<ElectionMetadata election={election} />)

    expect(screen.getByText("Finalized")).toBeInTheDocument()
  })

  it("shows data_source_url as external link when present", () => {
    const election = mockElection({
      data_source_url: "https://results.sos.ga.gov/api/test",
    })
    render(<ElectionMetadata election={election} />)

    expect(screen.getByText("Data Source")).toBeInTheDocument()
    const link = screen.getByRole("link", { name: /View Source/ })
    expect(link).toHaveAttribute(
      "href",
      "https://results.sos.ga.gov/api/test",
    )
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("hides data_source_url link when null", () => {
    const election = mockElection({
      data_source_url: undefined,
    })
    render(<ElectionMetadata election={election} />)

    expect(screen.queryByText("Data Source")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: /View Source/ }),
    ).not.toBeInTheDocument()
  })
})
