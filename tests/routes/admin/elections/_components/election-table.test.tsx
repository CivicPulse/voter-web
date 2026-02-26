import { describe, it, expect, vi } from "vitest"
import { render } from "@testing-library/react"
import { ElectionTable } from "@/routes/admin/elections/_components/election-table"
import type { Election } from "@/types/elections"

// Mock TanStack Router Link
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <a {...props}>{children}</a>
  ),
}))

// Mock the delete dialog since it has its own deps
vi.mock("@/routes/admin/elections/_components/delete-election-dialog", () => ({
  DeleteElectionDialog: () => null,
}))

// Mock useDeleteElection if needed
vi.mock("@/lib/hooks/use-admin-elections", () => ({
  useDeleteElection: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}))

function makeElection(overrides?: Partial<Election>): Election {
  return {
    id: "election-1",
    name: "Test Election",
    election_date: "2026-03-01",
    election_type: "special",
    district: "Test District",
    status: "active",
    last_refreshed_at: null,
    ...overrides,
  }
}

describe("ElectionTable", () => {
  it("renders election name", () => {
    const { getByText } = render(
      <ElectionTable elections={[makeElection()]} isAdmin={false} />
    )
    expect(getByText("Test Election")).toBeInTheDocument()
  })

  it("shows SOS Feed source badge for sos_feed elections", () => {
    const { getByText } = render(
      <ElectionTable
        elections={[makeElection({ source: "sos_feed" })]}
        isAdmin={false}
      />
    )
    expect(getByText("SOS Feed")).toBeInTheDocument()
  })

  it("shows Manual source badge for manual elections", () => {
    const { getByText } = render(
      <ElectionTable
        elections={[makeElection({ source: "manual" })]}
        isAdmin={false}
      />
    )
    expect(getByText("Manual")).toBeInTheDocument()
  })

  it("shows no source badge when source is null", () => {
    const { queryByText } = render(
      <ElectionTable
        elections={[makeElection({ source: null })]}
        isAdmin={false}
      />
    )
    expect(queryByText("SOS Feed")).not.toBeInTheDocument()
    expect(queryByText("Manual")).not.toBeInTheDocument()
  })

  it("shows delete button when isAdmin is true", () => {
    const { getByLabelText } = render(
      <ElectionTable
        elections={[makeElection()]}
        isAdmin={true}
      />
    )
    expect(getByLabelText("Delete Test Election")).toBeInTheDocument()
  })

  it("does not show delete button when isAdmin is false", () => {
    const { queryByLabelText } = render(
      <ElectionTable
        elections={[makeElection()]}
        isAdmin={false}
      />
    )
    expect(queryByLabelText("Delete Test Election")).not.toBeInTheDocument()
  })
})
