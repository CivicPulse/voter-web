import { TokenBucketRateLimiter } from "@/lib/rate-limiter"

/**
 * Singleton rate limiter for the voter-api.
 *
 * 50 requests per 60-second rolling window, leaving headroom
 * below the API's 60 req/min/IP limit.
 */
export const apiRateLimiter = new TokenBucketRateLimiter({
  maxTokens: 50,
  refillRate: 50,
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
