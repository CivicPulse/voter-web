import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    params,
    ...rest
  }: {
    children: React.ReactNode
    to: string
    params?: Record<string, string>
    [key: string]: unknown
  }) => (
    <a
      href={params ? to.replace("$state", params.state) : to}
      data-to={to}
      {...rest}
    >
      {children}
    </a>
  ),
}))

import { StateSelectionPage } from "@/components/StateSelectionPage"
import type { StateInfo } from "@/hooks/useAvailableStates"

describe("StateSelectionPage", () => {
  const twoStates: StateInfo[] = [
    { abbreviation: "ga", fipsCode: "13", countyCount: 159 },
    { abbreviation: "fl", fipsCode: "12", countyCount: 67 },
  ]

  it("renders the page title", () => {
    render(<StateSelectionPage states={twoStates} />)
    expect(screen.getByText("Select a State")).toBeInTheDocument()
  })

  it("renders a card for each state with full name", () => {
    render(<StateSelectionPage states={twoStates} />)
    expect(screen.getByText("Georgia")).toBeInTheDocument()
    expect(screen.getByText("Florida")).toBeInTheDocument()
  })

  it("shows county counts", () => {
    render(<StateSelectionPage states={twoStates} />)
    expect(screen.getByText("159 counties with data")).toBeInTheDocument()
    expect(screen.getByText("67 counties with data")).toBeInTheDocument()
  })

  it("uses singular 'county' when count is 1", () => {
    const single: StateInfo[] = [
      { abbreviation: "dc", fipsCode: "11", countyCount: 1 },
    ]
    render(<StateSelectionPage states={single} />)
    expect(screen.getByText("1 county with data")).toBeInTheDocument()
  })

  it("links each card to the /$state route", () => {
    render(<StateSelectionPage states={twoStates} />)
    const gaLink = screen.getByText("Georgia").closest("a")
    expect(gaLink).toHaveAttribute("href", "/ga")
    const flLink = screen.getByText("Florida").closest("a")
    expect(flLink).toHaveAttribute("href", "/fl")
  })

  it("renders empty list when no states provided", () => {
    render(<StateSelectionPage states={[]} />)
    expect(screen.getByText("Select a State")).toBeInTheDocument()
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })
})
