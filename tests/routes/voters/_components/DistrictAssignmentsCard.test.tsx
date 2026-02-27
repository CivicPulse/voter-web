import { describe, it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { render } from "@/test/render"
import { DistrictAssignmentsCard } from "@/routes/voters/_components/DistrictAssignmentsCard"
import { mockNullDistricts } from "@/test/mocks/voters"
import type { DistrictVerificationResult } from "@/lib/district-comparison"
import type { BatchBoundaryCheckResponse } from "@/types/voter"

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

  describe("verification badge", () => {
    it('shows "All verified" when all checkable districts match', () => {
      const verification: DistrictVerificationResult = {
        comparisons: [
          { registeredKey: "congressional_district", label: "Congressional", registeredValue: "5", geographicValue: "5", status: "match" },
          { registeredKey: "state_senate_district", label: "State Senate", registeredValue: "18", geographicValue: "18", status: "match" },
        ],
        matchCount: 2,
        mismatchCount: 0,
        lowConfidence: false,
      }
      render(
        <DistrictAssignmentsCard
          districts={{ ...nullDistricts, congressional_district: "5", state_senate_district: "18" }}
          verification={verification}
        />,
      )
      expect(screen.getByText("All verified")).toBeInTheDocument()
    })

    it('shows "X/Y verified" when some districts lack geographic data', () => {
      const verification: DistrictVerificationResult = {
        comparisons: [
          { registeredKey: "congressional_district", label: "Congressional", registeredValue: "5", geographicValue: "5", status: "match" },
          { registeredKey: "state_senate_district", label: "State Senate", registeredValue: "18", geographicValue: null, status: "no_geographic_data" },
          { registeredKey: "state_house_district", label: "State House", registeredValue: "145", geographicValue: null, status: "no_geographic_data" },
        ],
        matchCount: 1,
        mismatchCount: 0,
        lowConfidence: false,
      }
      render(
        <DistrictAssignmentsCard
          districts={{ ...nullDistricts, congressional_district: "5", state_senate_district: "18", state_house_district: "145" }}
          verification={verification}
        />,
      )
      expect(screen.getByText("1/3 verified")).toBeInTheDocument()
    })

    it("shows mismatch count when mismatches exist", () => {
      const verification: DistrictVerificationResult = {
        comparisons: [
          { registeredKey: "congressional_district", label: "Congressional", registeredValue: "5", geographicValue: "8", status: "mismatch" },
        ],
        matchCount: 0,
        mismatchCount: 1,
        lowConfidence: false,
      }
      render(
        <DistrictAssignmentsCard
          districts={{ ...nullDistricts, congressional_district: "5" }}
          verification={verification}
        />,
      )
      expect(screen.getByText("1 mismatch")).toBeInTheDocument()
    })
  })

  describe("match status badge", () => {
    it("shows Match badge when matchStatus is match", () => {
      render(
        <DistrictAssignmentsCard
          districts={{ ...nullDistricts, congressional_district: "5" }}
          matchStatus="match"
        />,
      )
      expect(screen.getByText("Match")).toBeInTheDocument()
    })

    it("shows Mismatch badge when matchStatus starts with mismatch", () => {
      render(
        <DistrictAssignmentsCard
          districts={{ ...nullDistricts, congressional_district: "5" }}
          matchStatus="mismatch-minor"
        />,
      )
      expect(screen.getByText("Mismatch")).toBeInTheDocument()
    })

    it("shows Not Geocoded badge when matchStatus is not-geocoded", () => {
      render(
        <DistrictAssignmentsCard
          districts={{ ...nullDistricts, congressional_district: "5" }}
          matchStatus="not-geocoded"
        />,
      )
      expect(screen.getByText("Not Geocoded")).toBeInTheDocument()
    })

    it("shows informational message for not-geocoded status", () => {
      render(
        <DistrictAssignmentsCard
          districts={{ ...nullDistricts, congressional_district: "5" }}
          matchStatus="not-geocoded"
        />,
      )
      expect(
        screen.getByText(
          "This voter has not been geocoded yet. Geocode the voter to enable district verification.",
        ),
      ).toBeInTheDocument()
    })

    it("shows Unable to Analyze badge for unable-to-analyze status", () => {
      render(
        <DistrictAssignmentsCard
          districts={{ ...nullDistricts, congressional_district: "5" }}
          matchStatus="unable-to-analyze"
        />,
      )
      expect(screen.getByText("Unable to Analyze")).toBeInTheDocument()
    })
  })

  describe("checkedAt timestamp", () => {
    it("shows checked date when checkedAt is provided", () => {
      render(
        <DistrictAssignmentsCard
          districts={{ ...nullDistricts, congressional_district: "5" }}
          checkedAt="2026-02-25T10:30:00Z"
        />,
      )
      expect(screen.getByText(/Checked/)).toBeInTheDocument()
    })

    it("does not show checked date when checkedAt is not provided", () => {
      render(
        <DistrictAssignmentsCard
          districts={{ ...nullDistricts, congressional_district: "5" }}
        />,
      )
      expect(screen.queryByText(/Checked/)).not.toBeInTheDocument()
    })
  })

  describe("provider × district comparison matrix", () => {
    const districts = {
      ...mockNullDistricts(),
      congressional_district: "5",
      state_senate_district: "18",
    }

    const verification: DistrictVerificationResult = {
      comparisons: [
        {
          registeredKey: "congressional_district",
          label: "Congressional",
          registeredValue: "5",
          geographicValue: "5",
          status: "match",
          boundaryId: null,
        },
        {
          registeredKey: "state_senate_district",
          label: "State Senate",
          registeredValue: "18",
          geographicValue: "20",
          status: "mismatch",
          boundaryId: null,
        },
      ],
      matchCount: 1,
      mismatchCount: 1,
      lowConfidence: false,
    }

    const providerResults: BatchBoundaryCheckResponse = {
      voter_id: "v-001",
      checked_at: "2026-02-27T10:00:00Z",
      total_locations: 2,
      total_districts: 2,
      provider_summary: [
        { source_type: "nominatim", latitude: 32.84, longitude: -83.63, confidence_score: 0.95, districts_matched: 2, districts_checked: 2 },
        { source_type: "census", latitude: 32.85, longitude: -83.64, confidence_score: 0.90, districts_matched: 0, districts_checked: 2 },
      ],
      districts: [
        {
          boundary_id: null,
          boundary_type: "congressional",
          boundary_identifier: "5",
          has_geometry: true,
          providers: [
            { source_type: "nominatim", is_contained: true },
            { source_type: "census", is_contained: false },
          ],
        },
        {
          boundary_id: null,
          boundary_type: "state_senate",
          boundary_identifier: "18",
          has_geometry: true,
          providers: [
            { source_type: "nominatim", is_contained: true },
            // census absent → renders "—"
          ],
        },
      ],
    }

    it("renders matrix table when providerResults is provided", () => {
      render(
        <DistrictAssignmentsCard
          districts={districts}
          verification={verification}
          providerResults={providerResults}
        />,
      )
      // Table headers use source_type from provider_summary
      expect(screen.getByText("District")).toBeInTheDocument()
      expect(screen.getByText("Registered")).toBeInTheDocument()
      expect(screen.getByText("Primary")).toBeInTheDocument()
      expect(screen.getByText("nominatim")).toBeInTheDocument()
      expect(screen.getByText("census")).toBeInTheDocument()
    })

    it("renders matrix table when providerResultsLoading is true", () => {
      render(
        <DistrictAssignmentsCard
          districts={districts}
          verification={verification}
          providerResults={undefined}
          providerResultsLoading={true}
        />,
      )
      expect(screen.getByText("District")).toBeInTheDocument()
      expect(screen.getByText("Registered")).toBeInTheDocument()
    })

    it("shows contained badge for matching provider cell", () => {
      render(
        <DistrictAssignmentsCard
          districts={districts}
          verification={verification}
          providerResults={providerResults}
        />,
      )
      // nominatim congressional is_contained=true → boundary_identifier "5" in green badge
      // Multiple "5"s appear: Registered col, Primary col match, nominatim match cell
      const fiveBadges = screen.getAllByText("5")
      expect(fiveBadges.length).toBeGreaterThan(1)
    })

    it("shows badge for non-contained provider cell (mismatch)", () => {
      render(
        <DistrictAssignmentsCard
          districts={districts}
          verification={verification}
          providerResults={providerResults}
        />,
      )
      // census congressional is_contained=false → renders red badge with boundary_identifier "5"
      // Registered col + nominatim match + census mismatch all show "5"
      const fiveBadges = screen.getAllByText("5")
      expect(fiveBadges.length).toBeGreaterThanOrEqual(3)
    })

    it("shows dash when provider has no entry for a district", () => {
      render(
        <DistrictAssignmentsCard
          districts={districts}
          verification={verification}
          providerResults={providerResults}
        />,
      )
      // census is absent from state_senate providers → "—"
      const dashes = screen.getAllByText("—")
      expect(dashes.length).toBeGreaterThan(0)
    })

    it("shows skeleton when loading and no results yet", () => {
      render(
        <DistrictAssignmentsCard
          districts={districts}
          verification={verification}
          providerResults={undefined}
          providerResultsLoading={true}
        />,
      )
      // Skeleton renders with data-slot="skeleton"
      const skeletons = document.querySelectorAll("[data-slot='skeleton']")
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it("does not render matrix when providerResults is undefined and not loading", () => {
      render(
        <DistrictAssignmentsCard
          districts={districts}
          verification={verification}
          providerResults={undefined}
          providerResultsLoading={false}
        />,
      )
      expect(screen.queryByText("District")).not.toBeInTheDocument()
      expect(screen.queryByText("Registered")).not.toBeInTheDocument()
    })

    it("shows error banner when providerResultsError is true", () => {
      render(
        <DistrictAssignmentsCard
          districts={districts}
          verification={verification}
          providerResults={null}
          providerResultsError={true}
          onRetryProviderCheck={vi.fn()}
        />,
      )
      expect(screen.getByText("Could not load provider district data.")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument()
    })

    it("calls onRetryProviderCheck when Retry button is clicked", async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      render(
        <DistrictAssignmentsCard
          districts={districts}
          verification={verification}
          providerResults={null}
          providerResultsError={true}
          onRetryProviderCheck={onRetry}
        />,
      )
      await user.click(screen.getByRole("button", { name: "Retry" }))
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it("shows dashes in provider columns when error and providerResults is null", () => {
      render(
        <DistrictAssignmentsCard
          districts={districts}
          verification={verification}
          providerResults={null}
          providerResultsError={true}
        />,
      )
      // Table still renders but no provider columns (no results)
      expect(screen.getByText("District")).toBeInTheDocument()
    })
  })
})
