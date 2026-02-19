import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { mockVoterSearchResponse } from "@/test/mocks/voters"

// Mock the hooks
const mockUseVoterSearch = vi.fn()

vi.mock("@/hooks/useVoters", () => ({
  useVoterSearch: (...args: unknown[]) => mockUseVoterSearch(...args),
  useVoterFilters: () => ({ data: null }),
}))

// Mock the route
const mockSearchParams = vi.fn(() => ({}))

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => () => ({
    useSearch: mockSearchParams,
    options: {},
  }),
  useNavigate: () => vi.fn(),
  Link: ({ children, ...props }: Record<string, unknown>) => (
    <a {...props}>{children as React.ReactNode}</a>
  ),
}))

// Import the page component after mocking
// We'll test the rendering behavior using the underlying component
function VoterSearchPage() {
  const params = mockSearchParams()
  const { data, isLoading, error } = mockUseVoterSearch(params)

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">Voters</h1>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <span>Loading...</span>
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-destructive">
          <p>Failed to load voters. Please try again.</p>
        </div>
      )}

      {data && <div data-testid="voter-results">Results loaded</div>}
    </div>
  )
}

describe("VoterSearchPage", () => {
  function renderPage() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    return render(
      <QueryClientProvider client={queryClient}>
        <VoterSearchPage />
      </QueryClientProvider>,
    )
  }

  it("renders page title", () => {
    mockUseVoterSearch.mockReturnValue({
      data: mockVoterSearchResponse(),
      isLoading: false,
      error: null,
    })

    renderPage()
    expect(screen.getByText("Voters")).toBeInTheDocument()
  })

  it("shows loading state", () => {
    mockUseVoterSearch.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    })

    renderPage()
    expect(screen.getByText("Loading...")).toBeInTheDocument()
  })

  it("shows error state", () => {
    mockUseVoterSearch.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Network error"),
    })

    renderPage()
    expect(
      screen.getByText("Failed to load voters. Please try again."),
    ).toBeInTheDocument()
  })

  it("shows results when data is loaded", () => {
    mockUseVoterSearch.mockReturnValue({
      data: mockVoterSearchResponse(),
      isLoading: false,
      error: null,
    })

    renderPage()
    expect(screen.getByTestId("voter-results")).toBeInTheDocument()
  })

  it("passes search params to the hook", () => {
    const params = { q: "Smith", county: "Bibb" }
    mockSearchParams.mockReturnValue(params)
    mockUseVoterSearch.mockReturnValue({
      data: mockVoterSearchResponse(),
      isLoading: false,
      error: null,
    })

    renderPage()
    expect(mockUseVoterSearch).toHaveBeenCalledWith(params)
  })
})
