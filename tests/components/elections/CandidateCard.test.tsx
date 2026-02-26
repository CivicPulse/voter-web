import { describe, it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import { render } from "@/test/render"
import { CandidateCard } from "@/components/elections/CandidateCard"
import { mockCandidateSummary } from "@/test/mocks/candidates"

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router")
  return {
    ...actual,
    Link: ({ children, ...props }: Record<string, unknown>) => <a {...props}>{children}</a>,
  }
})

describe("CandidateCard", () => {
  it("renders candidate name and party badge", () => {
    const candidate = mockCandidateSummary({
      full_name: "Andrea C. Cooke",
      party: "Dem",
    })
    render(<CandidateCard candidate={candidate} />)

    expect(screen.getByText("Andrea C. Cooke")).toBeInTheDocument()
    expect(screen.getByText("Dem")).toBeInTheDocument()
  })

  it("does not render AvatarImage element when photo_url is null", () => {
    const candidate = mockCandidateSummary({
      full_name: "Andrea C. Cooke",
      photo_url: null,
    })
    const { container } = render(<CandidateCard candidate={candidate} />)

    // When photo_url is null, no <img> tag should be rendered
    const img = container.querySelector("img")
    expect(img).toBeNull()
  })

  it("renders initials fallback when no photo", () => {
    const candidate = mockCandidateSummary({
      full_name: "Andrea C. Cooke",
      photo_url: null,
    })
    render(<CandidateCard candidate={candidate} />)

    // Initials: first char of first name + first char of last name => "AC"
    expect(screen.getByText("AC")).toBeInTheDocument()
  })

  it("shows Incumbent badge when is_incumbent is true", () => {
    const candidate = mockCandidateSummary({ is_incumbent: true })
    render(<CandidateCard candidate={candidate} />)

    expect(screen.getByText("Incumbent")).toBeInTheDocument()
  })

  it("does not show Incumbent badge when is_incumbent is false", () => {
    const candidate = mockCandidateSummary({ is_incumbent: false })
    render(<CandidateCard candidate={candidate} />)

    expect(screen.queryByText("Incumbent")).not.toBeInTheDocument()
  })

  it("shows filing status badge for withdrawn candidate", () => {
    const candidate = mockCandidateSummary({ filing_status: "withdrawn" })
    render(<CandidateCard candidate={candidate} />)

    expect(screen.getByText("Withdrawn")).toBeInTheDocument()
  })

  it("shows filing status badge for disqualified candidate", () => {
    const candidate = mockCandidateSummary({ filing_status: "disqualified" })
    render(<CandidateCard candidate={candidate} />)

    expect(screen.getByText("Disqualified")).toBeInTheDocument()
  })

  it("shows filing status badge for write_in candidate", () => {
    const candidate = mockCandidateSummary({ filing_status: "write_in" })
    render(<CandidateCard candidate={candidate} />)

    expect(screen.getByText("Write-In")).toBeInTheDocument()
  })

  it("does not show filing status badge for qualified candidate", () => {
    const candidate = mockCandidateSummary({ filing_status: "qualified" })
    render(<CandidateCard candidate={candidate} />)

    expect(screen.queryByText("Qualified")).not.toBeInTheDocument()
    expect(screen.queryByText("qualified")).not.toBeInTheDocument()
  })

  it("has opacity-60 for withdrawn candidates", () => {
    const candidate = mockCandidateSummary({ filing_status: "withdrawn" })
    const { container } = render(<CandidateCard candidate={candidate} />)

    const card = container.firstElementChild
    expect(card?.className).toContain("opacity-60")
  })

  it("has opacity-60 for disqualified candidates", () => {
    const candidate = mockCandidateSummary({ filing_status: "disqualified" })
    const { container } = render(<CandidateCard candidate={candidate} />)

    const card = container.firstElementChild
    expect(card?.className).toContain("opacity-60")
  })

  it("does not have opacity-60 for qualified candidates", () => {
    const candidate = mockCandidateSummary({ filing_status: "qualified" })
    const { container } = render(<CandidateCard candidate={candidate} />)

    const card = container.firstElementChild
    expect(card?.className).not.toContain("opacity-60")
  })

  it("renders a link to the candidate detail page", () => {
    const candidate = mockCandidateSummary({
      id: "cand-uuid-001",
      full_name: "Andrea C. Cooke",
    })
    const { container } = render(<CandidateCard candidate={candidate} />)

    const link = container.querySelector("a")
    expect(link).toBeInTheDocument()
    expect(link).toHaveTextContent("Andrea C. Cooke")
    expect(link).toHaveAttribute("to", "/candidates/$candidateId")
  })
})
