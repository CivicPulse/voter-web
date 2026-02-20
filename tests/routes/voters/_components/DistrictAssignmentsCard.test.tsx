import { describe, it, expect } from "vitest"
import { screen } from "@testing-library/react"
import { render } from "@/test/render"
import { DistrictAssignmentsCard } from "@/routes/voters/_components/DistrictAssignmentsCard"
import { mockNullDistricts } from "@/test/mocks/voters"

const nullDistricts = mockNullDistricts()

describe("DistrictAssignmentsCard", () => {
  it("renders card title", () => {
    render(<DistrictAssignmentsCard districts={{...nullDistricts}} />)
    expect(screen.getByText("District Assignments")).toBeInTheDocument()
  })

  it("shows message when all district fields are null", () => {
    render(<DistrictAssignmentsCard districts={{...nullDistricts}} />)
    expect(
      screen.getByText("No district assignments found."),
    ).toBeInTheDocument()
  })

  it("renders non-null district fields with labels", () => {
    render(
      <DistrictAssignmentsCard
        districts={{...nullDistricts, congressional_district: "5", state_senate_district: "18", state_house_district: "145"}}
      />,
    )

    expect(screen.getByText("Congressional")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
    expect(screen.getByText("State Senate")).toBeInTheDocument()
    expect(screen.getByText("18")).toBeInTheDocument()
    expect(screen.getByText("State House")).toBeInTheDocument()
    expect(screen.getByText("145")).toBeInTheDocument()
  })

  it("renders county precinct with description", () => {
    render(
      <DistrictAssignmentsCard
        districts={{...nullDistricts, county_precinct: "HO1", county_precinct_description: "HOWARD 7"}}
      />,
    )

    expect(screen.getByText("County Precinct")).toBeInTheDocument()
    expect(screen.getByText("HO1")).toBeInTheDocument()
    expect(screen.getByText("HOWARD 7")).toBeInTheDocument()
  })

  it("renders additional district types", () => {
    render(
      <DistrictAssignmentsCard
        districts={{...nullDistricts, judicial_district: "MACO", county_commission_district: "1", school_board_district: "6", city_council_district: "3", municipal_school_board_district: "2"}}
      />,
    )

    expect(screen.getByText("Judicial")).toBeInTheDocument()
    expect(screen.getByText("MACO")).toBeInTheDocument()
    expect(screen.getByText("County Commission")).toBeInTheDocument()
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("School Board")).toBeInTheDocument()
    expect(screen.getByText("6")).toBeInTheDocument()
    expect(screen.getByText("City Council")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("Municipal School Board")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("omits null district fields from the display", () => {
    render(
      <DistrictAssignmentsCard
        districts={{...nullDistricts, congressional_district: "5"}}
      />,
    )

    expect(screen.getByText("Congressional")).toBeInTheDocument()
    expect(screen.queryByText("State Senate")).not.toBeInTheDocument()
    expect(screen.queryByText("State House")).not.toBeInTheDocument()
    expect(screen.queryByText("Judicial")).not.toBeInTheDocument()
    expect(screen.queryByText("County Commission")).not.toBeInTheDocument()
    expect(screen.queryByText("School Board")).not.toBeInTheDocument()
    expect(screen.queryByText("County Precinct")).not.toBeInTheDocument()
  })

  it("renders all fields when all are non-null", () => {
    render(
      <DistrictAssignmentsCard
        districts={{
          congressional_district: "8",
          state_senate_district: "12",
          state_house_district: "75",
          judicial_district: "MACO",
          county_commission_district: "1",
          school_board_district: "6",
          city_council_district: "3",
          municipal_school_board_district: "4",
          county_precinct: "0042",
          county_precinct_description: "TEST PRECINCT",
          municipal_precinct: "003",
          municipal_precinct_description: "MUNICIPAL 3",
        }}
      />,
    )

    expect(screen.getByText("Congressional")).toBeInTheDocument()
    expect(screen.getByText("8")).toBeInTheDocument()
    expect(screen.getByText("State Senate")).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()
    expect(screen.getByText("State House")).toBeInTheDocument()
    expect(screen.getByText("75")).toBeInTheDocument()
    expect(screen.getByText("Judicial")).toBeInTheDocument()
    expect(screen.getByText("MACO")).toBeInTheDocument()
    expect(screen.getByText("County Commission")).toBeInTheDocument()
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("School Board")).toBeInTheDocument()
    expect(screen.getByText("6")).toBeInTheDocument()
    expect(screen.getByText("City Council")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("Municipal School Board")).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()
    expect(screen.getByText("County Precinct")).toBeInTheDocument()
    expect(screen.getByText("0042")).toBeInTheDocument()
    expect(screen.getByText("TEST PRECINCT")).toBeInTheDocument()
    expect(screen.getByText("Municipal Precinct")).toBeInTheDocument()
    expect(screen.getByText("003")).toBeInTheDocument()
    expect(screen.getByText("MUNICIPAL 3")).toBeInTheDocument()
  })
})
