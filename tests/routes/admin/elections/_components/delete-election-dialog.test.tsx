import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, fireEvent } from "@testing-library/react"
import { DeleteElectionDialog } from "@/routes/admin/elections/_components/delete-election-dialog"
import { QueryClientProvider } from "@tanstack/react-query"
import { createTestQueryClient } from "@/test/render"
import type { ReactNode } from "react"

vi.mock("@/lib/hooks/use-admin-elections", () => ({
  useDeleteElection: vi.fn(),
}))

import { useDeleteElection } from "@/lib/hooks/use-admin-elections"

const mockedUseDeleteElection = vi.mocked(useDeleteElection)

function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function createMockMutation(overrides?: Partial<ReturnType<typeof useDeleteElection>>) {
  return {
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    reset: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useDeleteElection>
}

describe("DeleteElectionDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders dialog with election name when open", () => {
    mockedUseDeleteElection.mockReturnValue(createMockMutation())

    const { getByText } = render(
      <DeleteElectionDialog
        open={true}
        onOpenChange={vi.fn()}
        electionName="State Senate District 18"
        electionId="election-123"
      />,
      { wrapper: createWrapper() }
    )

    expect(getByText("Delete Election")).toBeInTheDocument()
    expect(getByText(/State Senate District 18/)).toBeInTheDocument()
  })

  it("calls onOpenChange(false) and clears error when Cancel is clicked", async () => {
    mockedUseDeleteElection.mockReturnValue(createMockMutation())
    const onOpenChange = vi.fn()

    const { getByText } = render(
      <DeleteElectionDialog
        open={true}
        onOpenChange={onOpenChange}
        electionName="Test Election"
        electionId="election-123"
      />,
      { wrapper: createWrapper() }
    )

    fireEvent.click(getByText("Cancel"))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("calls mutation.mutate with electionId when Delete is clicked", () => {
    const mutate = vi.fn()
    mockedUseDeleteElection.mockReturnValue(createMockMutation({ mutate }))

    const { getByText } = render(
      <DeleteElectionDialog
        open={true}
        onOpenChange={vi.fn()}
        electionName="Test Election"
        electionId="election-abc"
      />,
      { wrapper: createWrapper() }
    )

    fireEvent.click(getByText("Delete"))
    expect(mutate).toHaveBeenCalledWith("election-abc", expect.any(Object))
  })

  it("does not render content when open is false", () => {
    mockedUseDeleteElection.mockReturnValue(createMockMutation())

    const { queryByText } = render(
      <DeleteElectionDialog
        open={false}
        onOpenChange={vi.fn()}
        electionName="Test Election"
        electionId="election-abc"
      />,
      { wrapper: createWrapper() }
    )

    expect(queryByText("Delete Election")).not.toBeInTheDocument()
  })
})
