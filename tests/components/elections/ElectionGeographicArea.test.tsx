import { describe, it, expect } from "vitest"
import { screen } from "@testing-library/react"
import { render } from "@/test/render"
import { ElectionGeographicArea } from "@/components/elections/ElectionGeographicArea"
import { mockElection } from "@/test/mocks/elections"

describe("ElectionGeographicArea", () => {
  it("renders the district string", () => {
    const election = mockElection({
      district: "State Senate - District 18",
    })
    render(<ElectionGeographicArea election={election} />)

    expect(
      screen.getByText("State Senate - District 18"),
    ).toBeInTheDocument()
  })

  it("renders the Geographic Area heading", () => {
    const election = mockElection()
    render(<ElectionGeographicArea election={election} />)

    expect(screen.getByText("Geographic Area")).toBeInTheDocument()
  })

  it("renders different district values", () => {
    const election = mockElection({
      district: "US Senate - Georgia",
    })
    render(<ElectionGeographicArea election={election} />)

    expect(screen.getByText("US Senate - Georgia")).toBeInTheDocument()
  })
})
