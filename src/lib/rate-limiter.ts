/**
 * Token bucket rate limiter for controlling API request throughput.
 *
 * Requires callers to acquire a token before proceeding. When the bucket
 * is empty, callers wait in a FIFO queue until tokens refill.
 */
export class TokenBucketRateLimiter {
  private tokens: number
  private readonly maxTokens: number
  private readonly refillRate: number
  private readonly refillIntervalMs: number
  private lastRefillTime: number
  private readonly queue: Array<() => void>
  private refillTimerId: ReturnType<typeof setInterval> | null

  constructor(options: {
    maxTokens: number
    refillRate: number
    refillIntervalMs: number
  }) {
    this.maxTokens = options.maxTokens
    this.tokens = options.maxTokens
    this.refillRate = options.refillRate
    this.refillIntervalMs = options.refillIntervalMs
    this.lastRefillTime = Date.now()
    this.queue = []
    this.refillTimerId = null
  }

  async acquire(): Promise<void> {
    this.refill()
    if (this.tokens > 0) {
      this.tokens--
      return
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve)
      this.ensureRefillTimer()
    })
  }

  private refill(): void {
    const now = Date.now()
    const elapsed = now - this.lastRefillTime
    const tokensToAdd = (elapsed / this.refillIntervalMs) * this.refillRate
    if (tokensToAdd >= 1) {
      this.tokens = Math.min(
        this.maxTokens,
        this.tokens + Math.floor(tokensToAdd),
      )
      this.lastRefillTime = now
      this.drainQueue()
    }
  }

  private drainQueue(): void {
    while (this.queue.length > 0 && this.tokens > 0) {
      this.tokens--
      const resolve = this.queue.shift()!
      resolve()
    }
    if (this.queue.length === 0 && this.refillTimerId !== null) {
      clearInterval(this.refillTimerId)
      this.refillTimerId = null
    }
  }

  private ensureRefillTimer(): void {
    if (this.refillTimerId !== null) return
    this.refillTimerId = setInterval(() => this.refill(), 200)
  }

  destroy(): void {
    if (this.refillTimerId !== null) {
      clearInterval(this.refillTimerId)
      this.refillTimerId = null
    }
    while (this.queue.length > 0) {
      const resolve = this.queue.shift()!
      resolve()
    }
  }

  /** Current number of available tokens (for testing). */
  get availableTokens(): number {
    return this.tokens
  }

  /** Current queue length (for testing). */
  get pendingCount(): number {
    return this.queue.length
  }
}
