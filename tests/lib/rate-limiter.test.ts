import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { TokenBucketRateLimiter } from "@/lib/rate-limiter"

describe("TokenBucketRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("starts with maxTokens available", () => {
    const limiter = new TokenBucketRateLimiter({
      maxTokens: 5,
      refillRate: 5,
      refillIntervalMs: 1000,
    })
    expect(limiter.availableTokens).toBe(5)
    limiter.destroy()
  })

  it("allows immediate acquisition when tokens are available", async () => {
    const limiter = new TokenBucketRateLimiter({
      maxTokens: 5,
      refillRate: 5,
      refillIntervalMs: 1000,
    })

    await limiter.acquire()
    expect(limiter.availableTokens).toBe(4)
    limiter.destroy()
  })

  it("decrements tokens on each acquire", async () => {
    const limiter = new TokenBucketRateLimiter({
      maxTokens: 3,
      refillRate: 3,
      refillIntervalMs: 1000,
    })

    await limiter.acquire()
    await limiter.acquire()
    await limiter.acquire()
    expect(limiter.availableTokens).toBe(0)
    limiter.destroy()
  })

  it("queues requests when bucket is empty", async () => {
    const limiter = new TokenBucketRateLimiter({
      maxTokens: 2,
      refillRate: 2,
      refillIntervalMs: 1000,
    })

    await limiter.acquire()
    await limiter.acquire()
    expect(limiter.availableTokens).toBe(0)

    // This one should be queued, not resolved yet
    let resolved = false
    limiter.acquire().then(() => {
      resolved = true
    })
    // Let microtasks flush
    await vi.advanceTimersByTimeAsync(0)
    expect(resolved).toBe(false)
    expect(limiter.pendingCount).toBe(1)

    limiter.destroy()
  })

  it("resolves queued requests as tokens refill", async () => {
    const limiter = new TokenBucketRateLimiter({
      maxTokens: 2,
      refillRate: 2,
      refillIntervalMs: 1000,
    })

    await limiter.acquire()
    await limiter.acquire()

    let resolved = false
    limiter.acquire().then(() => {
      resolved = true
    })

    // Advance past one refill period (1000ms / 2 tokens = 500ms per token)
    // but refill only fires on 200ms interval checks
    await vi.advanceTimersByTimeAsync(600)
    expect(resolved).toBe(true)
    expect(limiter.pendingCount).toBe(0)

    limiter.destroy()
  })

  it("maintains FIFO ordering for queued requests", async () => {
    const limiter = new TokenBucketRateLimiter({
      maxTokens: 1,
      refillRate: 2,
      refillIntervalMs: 1000,
    })

    await limiter.acquire()

    const order: number[] = []
    limiter.acquire().then(() => order.push(1))
    limiter.acquire().then(() => order.push(2))
    limiter.acquire().then(() => order.push(3))

    await vi.advanceTimersByTimeAsync(0)
    expect(order).toEqual([])

    // Advance enough for 3 tokens to refill (1.5 seconds at 2/sec)
    await vi.advanceTimersByTimeAsync(2000)

    expect(order).toEqual([1, 2, 3])
    limiter.destroy()
  })

  it("caps tokens at maxTokens (no overflow)", async () => {
    const limiter = new TokenBucketRateLimiter({
      maxTokens: 3,
      refillRate: 10,
      refillIntervalMs: 1000,
    })

    // Start full, wait a long time — should stay at max
    await vi.advanceTimersByTimeAsync(10000)
    // Trigger a refill by calling acquire
    await limiter.acquire()
    expect(limiter.availableTokens).toBe(2) // 3 max - 1 just acquired

    limiter.destroy()
  })

  it("cleans up interval timer when queue drains", async () => {
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval")
    const limiter = new TokenBucketRateLimiter({
      maxTokens: 1,
      refillRate: 2,
      refillIntervalMs: 1000,
    })

    await limiter.acquire()

    // Queue a request to start the timer
    const promise = limiter.acquire()

    // Advance to resolve it
    await vi.advanceTimersByTimeAsync(600)
    await promise

    // Timer should have been cleared when queue emptied
    expect(clearIntervalSpy).toHaveBeenCalled()

    clearIntervalSpy.mockRestore()
    limiter.destroy()
  })

  it("destroy() resolves all pending waiters", async () => {
    const limiter = new TokenBucketRateLimiter({
      maxTokens: 1,
      refillRate: 1,
      refillIntervalMs: 10000,
    })

    await limiter.acquire()

    const results: string[] = []
    limiter.acquire().then(() => results.push("a"))
    limiter.acquire().then(() => results.push("b"))

    await vi.advanceTimersByTimeAsync(0)
    expect(results).toEqual([])

    limiter.destroy()
    await vi.advanceTimersByTimeAsync(0)

    expect(results).toEqual(["a", "b"])
    expect(limiter.pendingCount).toBe(0)
  })

  it("handles concurrent acquire calls correctly", async () => {
    const limiter = new TokenBucketRateLimiter({
      maxTokens: 3,
      refillRate: 3,
      refillIntervalMs: 1000,
    })

    // Fire 5 concurrent acquires — 3 should resolve immediately, 2 should queue
    const promises = Array.from({ length: 5 }, () => limiter.acquire())

    // The first 3 resolve synchronously (before the await in the promise)
    expect(limiter.availableTokens).toBe(0)
    expect(limiter.pendingCount).toBe(2)

    // Advance time to let the 2 queued ones resolve
    await vi.advanceTimersByTimeAsync(1000)
    await Promise.all(promises)

    expect(limiter.pendingCount).toBe(0)
    limiter.destroy()
  })

  it("refills tokens proportionally to elapsed time", async () => {
    const limiter = new TokenBucketRateLimiter({
      maxTokens: 10,
      refillRate: 10,
      refillIntervalMs: 1000,
    })

    // Drain all tokens
    for (let i = 0; i < 10; i++) {
      await limiter.acquire()
    }
    expect(limiter.availableTokens).toBe(0)

    // Advance 500ms — should get ~5 tokens (half the refill interval)
    vi.advanceTimersByTime(500)

    // Trigger refill by calling acquire
    await limiter.acquire()
    // 5 tokens refilled, 1 consumed = 4 remaining
    expect(limiter.availableTokens).toBe(4)

    limiter.destroy()
  })
})
