import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...rest
  }: {
    children: React.ReactNode
    to: string
    [key: string]: unknown
  }) => (
    <a href={to} data-to={to} {...rest}>
      {children}
    </a>
  ),
}))

import { DisambiguationPage } from "@/components/DisambiguationPage"
import type { DisambiguationMatch } from "@/hooks/useDistrictDisambiguation"

describe("DisambiguationPage", () => {
  const matches: DisambiguationMatch[] = [
    {
      districtId: "uuid-bibb-005",
      name: "005",
      boundaryType: "county_commission",
      county: "Bibb",
      stateAbbrev: "ga",
      fullyQualifiedUrl: "/districts/ga/bibb/county-commission/005",
    },
    {
      districtId: "uuid-houston-005",
      name: "005",
      boundaryType: "county_commission",
      county: "Houston",
      stateAbbrev: "ga",
      fullyQualifiedUrl: "/districts/ga/houston/county-commission/005",
    },
  ]

  it("renders the disambiguation title", () => {
    render(
      <DisambiguationPage
        matches={matches}
        typeSlug="county-commission"
        nameSlug="005"
      />,
    )
    expect(screen.getByText("Multiple Districts Found")).toBeInTheDocument()
  })

  it("shows the type and name in the description", () => {
    render(
      <DisambiguationPage
        matches={matches}
        typeSlug="county-commission"
        nameSlug="005"
      />,
    )
    expect(screen.getByText(/county commission 005/i)).toBeInTheDocument()
  })

  it("renders a card for each match", () => {
    render(
      <DisambiguationPage
        matches={matches}
        typeSlug="county-commission"
        nameSlug="005"
      />,
    )
    expect(screen.getByText("Bibb County, Georgia")).toBeInTheDocument()
    expect(screen.getByText("Houston County, Georgia")).toBeInTheDocument()
  })

  it("links each card to its fully qualified URL", () => {
    render(
      <DisambiguationPage
        matches={matches}
        typeSlug="county-commission"
        nameSlug="005"
      />,
    )
    const links = screen.getAllByRole("link")
    expect(links[0]).toHaveAttribute(
      "href",
      "/districts/ga/bibb/county-commission/005",
    )
    expect(links[1]).toHaveAttribute(
      "href",
      "/districts/ga/houston/county-commission/005",
    )
  })

  it("shows state name without county for state-level districts", () => {
    const stateMatch: DisambiguationMatch[] = [
      {
        districtId: "uuid-senate-18",
        name: "018",
        boundaryType: "state_senate",
        county: null,
        stateAbbrev: "ga",
        fullyQualifiedUrl: "/districts/ga/state-senate/018",
      },
    ]
    render(
      <DisambiguationPage
        matches={stateMatch}
        typeSlug="state-senate"
        nameSlug="018"
      />,
    )
    expect(screen.getByText("Georgia")).toBeInTheDocument()
    expect(screen.queryByText(/County/)).not.toBeInTheDocument()
  })
})
