import { describe, it, expect, vi, beforeEach } from "vitest"

// Declare mocks via vi.hoisted so they are available when vi.mock factories execute
const { mockJson, mockPost, mockApiJson, mockApiGet } = vi.hoisted(() => {
  const mockJson = vi.fn()
  const mockPost = vi.fn(() => ({ json: mockJson }))
  const mockApiJson = vi.fn()
  const mockApiGet = vi.fn(() => ({ json: mockApiJson }))
  return { mockJson, mockPost, mockApiJson, mockApiGet }
})

vi.mock("ky", () => ({
  default: {
    create: () => ({
      post: (...args: unknown[]) => mockPost(...args),
    }),
  },
}))

vi.mock("@/api/client", () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
  },
}))

import { login, refreshTokens, getMe } from "@/api/auth"
import type { TokenResponse, UserProfile } from "@/types/auth"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("login", () => {
  const testUsername = crypto.randomUUID()
  const testPassword = crypto.randomUUID()

  const mockTokens: TokenResponse = {
    access_token: "access-123",
    refresh_token: "refresh-456",
    token_type: "bearer",
    expires_in: 3600,
  }

  it("sends credentials as JSON body via POST", async () => {
    mockJson.mockResolvedValue(mockTokens)

    const result = await login({ username: testUsername, password: testPassword })

    expect(mockPost).toHaveBeenCalledWith("auth/login", {
      json: { username: testUsername, password: testPassword },
    })
    expect(result).toEqual(mockTokens)
  })

  it("does not send form-urlencoded content type", async () => {
    mockJson.mockResolvedValue(mockTokens)

    await login({ username: testUsername, password: testPassword })

    const callArgs = mockPost.mock.calls[0]
    const options = callArgs[1] as Record<string, unknown>

    // Must use json key, not body or form
    expect(options).toHaveProperty("json")
    expect(options).not.toHaveProperty("body")
    expect(options).not.toHaveProperty("form")
    expect(options).not.toHaveProperty("headers")
  })
})

describe("refreshTokens", () => {
  const mockTokens: TokenResponse = {
    access_token: "new-access",
    refresh_token: "new-refresh",
    token_type: "bearer",
    expires_in: 3600,
  }

  it("sends refresh token as JSON body via POST", async () => {
    mockJson.mockResolvedValue(mockTokens)

    const result = await refreshTokens("refresh-456")

    expect(mockPost).toHaveBeenCalledWith("auth/refresh", {
      json: { refresh_token: "refresh-456" },
    })
    expect(result).toEqual(mockTokens)
  })
})

describe("getMe", () => {
  const mockProfile: UserProfile = {
    id: "u-001",
    username: "admin",
    email: "admin@example.com",
    role: "admin",
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    last_login_at: "2025-06-15T12:00:00Z",
  }

  it("calls GET auth/me on the authenticated api client", async () => {
    mockApiJson.mockResolvedValue(mockProfile)

    const result = await getMe()

    expect(mockApiGet).toHaveBeenCalledWith("auth/me")
    expect(result).toEqual(mockProfile)
  })
})
