import { describe, it, expect, vi, beforeEach } from "vitest"
import { requireAuth } from "@/lib/auth-guards"
import { Route } from "@/routes/voters"

vi.mock("@/lib/auth-guards", () => ({
  requireAuth: vi.fn(),
}))

const mockedRequireAuth = vi.mocked(requireAuth)

beforeEach(() => {
  vi.clearAllMocks()
})

describe("voters layout route", () => {
  it("calls requireAuth in beforeLoad with the current pathname", () => {
    const beforeLoad = Route.options.beforeLoad as (ctx: {
      location: { pathname: string }
    }) => void

    beforeLoad({ location: { pathname: "/voters" } })

    expect(mockedRequireAuth).toHaveBeenCalledWith("/voters")
  })

  it("calls requireAuth for nested voter paths", () => {
    const beforeLoad = Route.options.beforeLoad as (ctx: {
      location: { pathname: string }
    }) => void

    beforeLoad({ location: { pathname: "/voters/v-001" } })

    expect(mockedRequireAuth).toHaveBeenCalledWith("/voters/v-001")
  })
})
