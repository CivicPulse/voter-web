import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { CertificationBadge } from "@/components/elections/CertificationBadge"

describe("CertificationBadge", () => {
  it("renders 'Unofficial Results' for active elections", () => {
    render(<CertificationBadge status="active" />)
    expect(screen.getByText("Unofficial Results")).toBeInTheDocument()
  })

  it("renders 'Official Results' for finalized elections", () => {
    render(<CertificationBadge status="finalized" />)
    expect(screen.getByText("Official Results")).toBeInTheDocument()
  })

  it("applies yellow styling for active status", () => {
    const { container } = render(<CertificationBadge status="active" />)
    const badge = container.querySelector("[class*='yellow']")
    expect(badge).toBeInTheDocument()
  })

  it("applies green styling for finalized status", () => {
    const { container } = render(<CertificationBadge status="finalized" />)
    const badge = container.querySelector("[class*='green']")
    expect(badge).toBeInTheDocument()
  })
})
