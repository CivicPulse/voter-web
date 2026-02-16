import { TokenBucketRateLimiter } from "@/lib/rate-limiter"

/**
 * Singleton rate limiter for the voter-api.
 *
 * 150 requests per 60-second rolling window.
 */
export const apiRateLimiter = new TokenBucketRateLimiter({
  maxTokens: 150,
  refillRate: 150,
  refillIntervalMs: 60_000,
})

/**
 * Fetch-compatible function that rate-limits requests through the
 * token bucket before delegating to the native fetch.
 *
 * Pass to ky's `fetch` option so all API requests are rate-limited.
 */
export async function rateLimitedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  await apiRateLimiter.acquire()
  return fetch(input, init)
}
