import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { apiRateLimiter, rateLimitedFetch } from "@/api/rate-limited-fetch"

describe("rateLimitedFetch", () => {
  const mockResponse = new Response(JSON.stringify({ ok: true }), {
    status: 200,
  })

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("calls native fetch after acquiring a rate limit token", async () => {
    const acquireSpy = vi.spyOn(apiRateLimiter, "acquire")

    await rateLimitedFetch("https://example.com/api/test")

    expect(acquireSpy).toHaveBeenCalledOnce()
    expect(fetch).toHaveBeenCalledOnce()
  })

  it("passes through all fetch arguments", async () => {
    const init: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: 1 }),
    }

    await rateLimitedFetch("https://example.com/api/test", init)

    expect(fetch).toHaveBeenCalledWith("https://example.com/api/test", init)
  })

  it("returns the Response unchanged", async () => {
    const result = await rateLimitedFetch("https://example.com/api/test")

    expect(result).toBe(mockResponse)
  })

  it("acquires token before calling fetch", async () => {
    const callOrder: string[] = []

    vi.spyOn(apiRateLimiter, "acquire").mockImplementation(async () => {
      callOrder.push("acquire")
    })
    vi.mocked(fetch).mockImplementation(async () => {
      callOrder.push("fetch")
      return mockResponse
    })

    await rateLimitedFetch("https://example.com/api/test")

    expect(callOrder).toEqual(["acquire", "fetch"])
  })
})
