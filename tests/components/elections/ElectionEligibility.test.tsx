import { describe, it, expect } from "vitest"
import { screen } from "@testing-library/react"
import { render } from "@/test/render"
import { ElectionEligibility } from "@/components/elections/ElectionEligibility"
import { mockElection } from "@/test/mocks/elections"

describe("ElectionEligibility", () => {
  it("shows eligibility_description when provided", () => {
    const election = mockElection({
      eligibility_description: "Must be 18 years or older",
      district: "State Senate - District 18",
    })
    render(<ElectionEligibility election={election} />)

    expect(screen.getByText("Must be 18 years or older")).toBeInTheDocument()
  })

  it("falls back to 'Registered voters in {district}' when eligibility_description is null", () => {
    const election = mockElection({
      eligibility_description: null,
      district: "State Senate - District 18",
    })
    render(<ElectionEligibility election={election} />)

    expect(
      screen.getByText("Registered voters in State Senate - District 18"),
    ).toBeInTheDocument()
  })

  it("shows generic fallback when both eligibility_description and district are empty", () => {
    const election = mockElection({
      eligibility_description: null,
      district: "",
    })
    render(<ElectionEligibility election={election} />)

    expect(
      screen.getByText(
        "Contact your local election office for eligibility details",
      ),
    ).toBeInTheDocument()
  })

  it("renders the Eligibility heading", () => {
    const election = mockElection()
    render(<ElectionEligibility election={election} />)

    expect(screen.getByText("Eligibility")).toBeInTheDocument()
  })

  it("prefers eligibility_description over district fallback", () => {
    const election = mockElection({
      eligibility_description: "Only residents of precinct 5",
      district: "State Senate - District 18",
    })
    render(<ElectionEligibility election={election} />)

    expect(screen.getByText("Only residents of precinct 5")).toBeInTheDocument()
    expect(
      screen.queryByText(/Registered voters in/),
    ).not.toBeInTheDocument()
  })
})
