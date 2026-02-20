import { describe, it, expect } from "vitest"
import { screen } from "@testing-library/react"
import { render } from "@/test/render"
import { DistrictAssignmentsCard } from "@/routes/voters/_components/DistrictAssignmentsCard"

const defaultProps = {
  congressional_district: null,
  state_senate_district: null,
  state_house_district: null,
  county_precinct: null,
  precinct: null,
}

describe("DistrictAssignmentsCard", () => {
  it("renders card title", () => {
    render(<DistrictAssignmentsCard {...defaultProps} />)
    expect(screen.getByText("District Assignments")).toBeInTheDocument()
  })

  it("shows message when all district fields are null", () => {
    render(<DistrictAssignmentsCard {...defaultProps} />)
    expect(
      screen.getByText("No district assignments found."),
    ).toBeInTheDocument()
  })

  it("renders non-null district fields with labels", () => {
    render(
      <DistrictAssignmentsCard
        congressional_district="5"
        state_senate_district="18"
        state_house_district="145"
        county_precinct={null}
        precinct={null}
      />,
    )

    expect(screen.getByText("Congressional")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
    expect(screen.getByText("State Senate")).toBeInTheDocument()
    expect(screen.getByText("18")).toBeInTheDocument()
    expect(screen.getByText("State House")).toBeInTheDocument()
    expect(screen.getByText("145")).toBeInTheDocument()
  })

  it("renders county precinct and precinct fields", () => {
    render(
      <DistrictAssignmentsCard
        congressional_district={null}
        state_senate_district={null}
        state_house_district={null}
        county_precinct="0001"
        precinct="007"
      />,
    )

    expect(screen.getByText("County Precinct")).toBeInTheDocument()
    expect(screen.getByText("0001")).toBeInTheDocument()
    expect(screen.getByText("Precinct")).toBeInTheDocument()
    expect(screen.getByText("007")).toBeInTheDocument()
  })

  it("omits null district fields from the display", () => {
    render(
      <DistrictAssignmentsCard
        congressional_district="5"
        state_senate_district={null}
        state_house_district={null}
        county_precinct={null}
        precinct={null}
      />,
    )

    expect(screen.getByText("Congressional")).toBeInTheDocument()
    expect(screen.queryByText("State Senate")).not.toBeInTheDocument()
    expect(screen.queryByText("State House")).not.toBeInTheDocument()
    expect(screen.queryByText("County Precinct")).not.toBeInTheDocument()
    expect(screen.queryByText("Precinct")).not.toBeInTheDocument()
  })

  it("renders all fields when all are non-null", () => {
    render(
      <DistrictAssignmentsCard
        congressional_district="2"
        state_senate_district="12"
        state_house_district="75"
        county_precinct="0042"
        precinct="003"
      />,
    )

    expect(screen.getByText("Congressional")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("State Senate")).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()
    expect(screen.getByText("State House")).toBeInTheDocument()
    expect(screen.getByText("75")).toBeInTheDocument()
    expect(screen.getByText("County Precinct")).toBeInTheDocument()
    expect(screen.getByText("0042")).toBeInTheDocument()
    expect(screen.getByText("Precinct")).toBeInTheDocument()
    expect(screen.getByText("003")).toBeInTheDocument()
  })
})
