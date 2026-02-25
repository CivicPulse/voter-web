import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { VoterTable } from "@/routes/voters/_components/VoterTable"
import { mockVoterSearchResponse, mockVoterSummary } from "@/test/mocks/voters"

const mockNavigate = vi.fn()

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to, params, ...props }: Record<string, unknown>) => (
    <a
      href={`${to}/${(params as Record<string, string>)?.voterId ?? ""}`}
      {...props}
    >
      {children as React.ReactNode}
    </a>
  ),
}))

describe("VoterTable", () => {
  it("renders voter rows with correct columns", () => {
    const data = mockVoterSearchResponse()
    render(<VoterTable data={data} params={{}} />)

    expect(screen.getByText("Smith, Jane")).toBeInTheDocument()
    expect(screen.getByText("Smith, John")).toBeInTheDocument()
    expect(screen.getByText("Smithson, Robert")).toBeInTheDocument()
    expect(screen.getByText("Bibb")).toBeInTheDocument()
    expect(screen.getByText("Fulton")).toBeInTheDocument()
    expect(screen.getByText("GA-12345678")).toBeInTheDocument()
  })

  it("shows status badges", () => {
    const data = mockVoterSearchResponse()
    render(<VoterTable data={data} params={{}} />)

    const activeBadges = screen.getAllByText("Active")
    expect(activeBadges.length).toBe(2)
    expect(screen.getByText("Inactive")).toBeInTheDocument()
  })

  it("renders links to voter detail page", () => {
    const data = mockVoterSearchResponse()
    render(<VoterTable data={data} params={{}} />)

    const link = screen.getByText("Smith, Jane")
    expect(link.closest("a")).toHaveAttribute(
      "href",
      expect.stringContaining("v-001"),
    )
  })

  it("shows empty state when no voters found", () => {
    const data = mockVoterSearchResponse({ voters: [], total: 0 })
    render(<VoterTable data={data} params={{}} />)

    expect(
      screen.getByText("No voters found matching your search criteria."),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Try adjusting your search query or filters."),
    ).toBeInTheDocument()
  })

  it("navigates on sort header click", async () => {
    const user = userEvent.setup()
    const data = mockVoterSearchResponse()
    render(<VoterTable data={data} params={{}} />)

    await user.click(screen.getByText("Name"))

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        search: expect.objectContaining({
          sort_by: "name",
          sort_order: "asc",
        }),
      }),
    )
  })

  it("toggles sort order when clicking same column", async () => {
    const user = userEvent.setup()
    const data = mockVoterSearchResponse()
    render(
      <VoterTable
        data={data}
        params={{ sort_by: "name", sort_order: "asc" }}
      />,
    )

    await user.click(screen.getByText("Name"))

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        search: expect.objectContaining({
          sort_by: "name",
          sort_order: "desc",
        }),
      }),
    )
  })

  it("shows pagination controls when multiple pages exist", () => {
    const data = mockVoterSearchResponse({
      total: 50,
      page: 1,
      total_pages: 2,
    })
    render(<VoterTable data={data} params={{}} />)

    expect(screen.getByText("Previous")).toBeInTheDocument()
    expect(screen.getByText("Next")).toBeInTheDocument()
    expect(screen.getByText("Page 1 of 2 (50 results)")).toBeInTheDocument()
  })

  it("disables previous button on first page", () => {
    const data = mockVoterSearchResponse({
      total: 50,
      page: 1,
      total_pages: 2,
    })
    render(<VoterTable data={data} params={{}} />)

    expect(screen.getByText("Previous").closest("button")).toBeDisabled()
    expect(screen.getByText("Next").closest("button")).not.toBeDisabled()
  })

  it("navigates to next page when clicking Next", async () => {
    const user = userEvent.setup()
    const data = mockVoterSearchResponse({
      total: 50,
      page: 1,
      total_pages: 2,
    })
    render(<VoterTable data={data} params={{}} />)

    await user.click(screen.getByText("Next"))

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        search: expect.objectContaining({ page: 2 }),
      }),
    )
  })

  it("does not show pagination for single page", () => {
    const data = mockVoterSearchResponse()
    render(<VoterTable data={data} params={{}} />)

    expect(screen.queryByText("Previous")).not.toBeInTheDocument()
    expect(screen.queryByText("Next")).not.toBeInTheDocument()
  })

  describe("district mismatch column", () => {
    it("shows Districts column header", () => {
      const data = mockVoterSearchResponse()
      render(<VoterTable data={data} params={{}} />)

      expect(screen.getByText("Districts")).toBeInTheDocument()
    })

    it("shows mismatch indicator for voters with district mismatch", () => {
      const data = mockVoterSearchResponse({
        voters: [
          mockVoterSummary({ has_district_mismatch: true }),
        ],
        total: 1,
      })
      render(<VoterTable data={data} params={{}} />)

      expect(screen.getByText("Mismatch")).toBeInTheDocument()
    })

    it("shows green check for voters with no mismatch", () => {
      const data = mockVoterSearchResponse({
        voters: [
          mockVoterSummary({ has_district_mismatch: false }),
        ],
        total: 1,
      })
      render(<VoterTable data={data} params={{}} />)

      expect(screen.queryByText("Mismatch")).not.toBeInTheDocument()
      // Verify the CheckCircle2 icon is rendered (lucide-react renders SVGs)
      const cells = screen.getAllByRole("cell")
      const districtCell = cells[cells.length - 1]
      const svg = districtCell.querySelector("svg")
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass("text-green-600")
    })

    it("shows dash for voters not yet analyzed", () => {
      const data = mockVoterSearchResponse({
        voters: [
          mockVoterSummary({ has_district_mismatch: null }),
        ],
        total: 1,
      })
      render(<VoterTable data={data} params={{}} />)

      // The "—" dash is rendered for null values
      const cells = screen.getAllByRole("cell")
      const lastCell = cells[cells.length - 1]
      expect(lastCell.textContent).toBe("—")
    })
  })
})
