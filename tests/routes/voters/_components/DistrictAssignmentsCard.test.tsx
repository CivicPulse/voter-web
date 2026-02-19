import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { DistrictAssignmentsCard } from "@/routes/voters/_components/DistrictAssignmentsCard"
import type { LookupDistrict } from "@/types/lookup"

function mockDistrict(overrides?: Partial<LookupDistrict>): LookupDistrict {
  return {
    boundary_type: "county",
    name: "Bibb County",
    boundary_identifier: "bibb",
    boundary_id: "b-001",
    metadata: {},
    ...overrides,
  }
}

describe("DistrictAssignmentsCard", () => {
  it("shows message when no official location is selected", () => {
    render(
      <DistrictAssignmentsCard
        districts={null}
        hasOfficialLocation={false}
      />,
    )

    expect(
      screen.getByText(
        "District assignments cannot be determined until an official location is selected.",
      ),
    ).toBeInTheDocument()
  })

  it("shows message when official location exists but no districts found", () => {
    render(
      <DistrictAssignmentsCard
        districts={[]}
        hasOfficialLocation={true}
      />,
    )

    expect(
      screen.getByText(
        "No matching districts were found for the official location.",
      ),
    ).toBeInTheDocument()
  })

  it("renders districts grouped by type", () => {
    const districts = [
      mockDistrict({
        boundary_type: "county",
        name: "Bibb County",
        boundary_id: "b-001",
      }),
      mockDistrict({
        boundary_type: "congressional",
        name: "District 2",
        boundary_id: "b-002",
      }),
      mockDistrict({
        boundary_type: "state_senate",
        name: "District 18",
        boundary_id: "b-003",
      }),
    ]
    render(
      <DistrictAssignmentsCard
        districts={districts}
        hasOfficialLocation={true}
      />,
    )

    expect(screen.getByText("County")).toBeInTheDocument()
    expect(screen.getByText("Bibb County")).toBeInTheDocument()
    expect(screen.getByText("Congressional")).toBeInTheDocument()
    expect(screen.getByText("District 2")).toBeInTheDocument()
    expect(screen.getByText("State Senate")).toBeInTheDocument()
    expect(screen.getByText("District 18")).toBeInTheDocument()
  })

  it("renders card title", () => {
    render(
      <DistrictAssignmentsCard
        districts={null}
        hasOfficialLocation={false}
      />,
    )

    expect(screen.getByText("District Assignments")).toBeInTheDocument()
  })

  it("handles unrecognized boundary types", () => {
    const districts = [
      mockDistrict({
        boundary_type: "fire_district",
        name: "Fire District 3",
        boundary_id: "b-010",
      }),
    ]
    render(
      <DistrictAssignmentsCard
        districts={districts}
        hasOfficialLocation={true}
      />,
    )

    expect(screen.getByText("fire district")).toBeInTheDocument()
    expect(screen.getByText("Fire District 3")).toBeInTheDocument()
  })

  it("renders multiple districts within the same type", () => {
    const districts = [
      mockDistrict({
        boundary_type: "school_district",
        name: "Bibb County Schools",
        boundary_id: "b-020",
      }),
      mockDistrict({
        boundary_type: "school_district",
        name: "Macon-Bibb Academy",
        boundary_id: "b-021",
      }),
    ]
    render(
      <DistrictAssignmentsCard
        districts={districts}
        hasOfficialLocation={true}
      />,
    )

    expect(screen.getByText("School District")).toBeInTheDocument()
    expect(screen.getByText("Bibb County Schools")).toBeInTheDocument()
    expect(screen.getByText("Macon-Bibb Academy")).toBeInTheDocument()
  })
})
