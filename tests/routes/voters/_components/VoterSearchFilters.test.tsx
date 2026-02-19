import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { VoterSearchFilters } from "@/routes/voters/_components/VoterSearchFilters"
import { mockVoterFilterOptions } from "@/test/mocks/voters"

const mockNavigate = vi.fn()

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock("@/hooks/useVoters", () => ({
  useVoterFilters: () => ({ data: mockVoterFilterOptions() }),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("VoterSearchFilters", () => {
  it("renders search input and all filter controls", () => {
    render(<VoterSearchFilters params={{}} />)

    expect(screen.getByLabelText("Search voters")).toBeInTheDocument()
    expect(screen.getByLabelText("Filter by county")).toBeInTheDocument()
    expect(screen.getByLabelText("Filter by status")).toBeInTheDocument()
    expect(screen.getByLabelText("Filter by district type")).toBeInTheDocument()
  })

  it("shows default values in filter selects", () => {
    render(<VoterSearchFilters params={{}} />)

    expect(screen.getByText("All Counties")).toBeInTheDocument()
    expect(screen.getByText("All Statuses")).toBeInTheDocument()
    expect(screen.getByText("All Districts")).toBeInTheDocument()
  })

  it("shows cascade district select when district type is selected", () => {
    render(
      <VoterSearchFilters params={{ district_type: "congressional" }} />,
    )

    expect(screen.getByLabelText("Filter by district")).toBeInTheDocument()
  })

  it("does not show cascade district select when no district type is selected", () => {
    render(<VoterSearchFilters params={{}} />)

    expect(screen.queryByLabelText("Filter by district")).not.toBeInTheDocument()
  })

  it("initializes search input from params", () => {
    render(<VoterSearchFilters params={{ q: "Smith" }} />)

    expect(screen.getByLabelText("Search voters")).toHaveValue("Smith")
  })

  it("debounces search input and navigates after delay", async () => {
    const user = userEvent.setup()
    render(<VoterSearchFilters params={{}} />)

    await user.type(screen.getByLabelText("Search voters"), "Smith")

    // After debounce fires (300ms)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({ q: "Smith", page: 1 }),
        }),
      )
    })
  })

  it("renders search placeholder text", () => {
    render(<VoterSearchFilters params={{}} />)

    expect(
      screen.getByPlaceholderText("Search voters by name..."),
    ).toBeInTheDocument()
  })
})
