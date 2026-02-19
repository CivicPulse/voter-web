/**
 * Playwright test fixture that auto-mocks all voter API endpoints.
 *
 * Usage in test files:
 *   import { test, expect } from "./fixtures/voter-api"
 */

import { test as base, type Page } from "@playwright/test"
import {
  VOTER_ID,
  voterSearchResponse,
  voterDetailResponse,
  voterFilterOptionsResponse,
  voterGeocodedLocationsResponse,
  voterPointLookupResponse,
  voterGeocodeResultResponse,
} from "./mock-data"

export interface VoterMockOptions {
  role?: "admin" | "analyst" | "viewer"
  searchOverride?: Record<string, unknown>
  detailOverride?: Record<string, unknown>
  locationsOverride?: unknown[]
}

export async function setupVoterApiMocks(
  page: Page,
  options: VoterMockOptions = {},
) {
  const role = options.role ?? "admin"
  const searchData = options.searchOverride ?? voterSearchResponse
  const detailData = options.detailOverride ?? voterDetailResponse
  const locationsData =
    options.locationsOverride ?? voterGeocodedLocationsResponse

  // Voter search (with query params)
  await page.route("**/api/v1/voters?*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(searchData),
    }),
  )

  // Voter filters
  await page.route("**/api/v1/voters/filters", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(voterFilterOptionsResponse),
    }),
  )

  // Voter search (bare path — when not a sub-resource)
  await page.route("**/api/v1/voters", (route, request) => {
    if (request.url().includes("/voters/")) return route.fallback()
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(searchData),
    })
  })

  // Voter geocode trigger (POST)
  await page.route(
    `**/api/v1/voters/${VOTER_ID}/geocode`,
    (route, request) => {
      if (request.method() === "POST") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(voterGeocodeResultResponse),
        })
      }
      return route.fallback()
    },
  )

  // Delete geocoded location
  await page.route(
    `**/api/v1/voters/${VOTER_ID}/geocoded-locations/*`,
    (route, request) => {
      if (request.method() === "DELETE") {
        return route.fulfill({ status: 204 })
      }
      // Set primary (PUT)
      if (request.method() === "PUT") {
        const location = (locationsData as Array<Record<string, unknown>>)[1]
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ...location, is_primary: true }),
        })
      }
      return route.fallback()
    },
  )

  // Voter geocoded locations
  await page.route(
    `**/api/v1/voters/${VOTER_ID}/geocoded-locations`,
    (route, request) => {
      if (request.url().includes("/geocoded-locations/"))
        return route.fallback()
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(locationsData),
      })
    },
  )

  // Voter detail
  await page.route(`**/api/v1/voters/${VOTER_ID}`, (route, request) => {
    if (request.url().includes(`/voters/${VOTER_ID}/`))
      return route.fallback()
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(detailData),
    })
  })

  // Point lookup
  await page.route("**/api/v1/geocoding/point-lookup*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(voterPointLookupResponse),
    }),
  )

  // User role
  await page.route("**/api/v1/users/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "test-user", role }),
    }),
  )

  // Suppress map tile requests
  await page.route("**/tile.openstreetmap.org/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64",
      ),
    }),
  )
}

export const test = base.extend<{ mockVoterApi: void }>({
  mockVoterApi: [
    async ({ page, baseURL }, use) => {
      await setupVoterApiMocks(page)

      await page.goto(baseURL ?? "http://localhost:4173")
      await page.evaluate(() => {
        localStorage.setItem("welcome_dismissed", "true")
        localStorage.setItem("access_token", "test-token")
      })

      await use()
    },
    { auto: true },
  ],
})

export { expect } from "@playwright/test"
