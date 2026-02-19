/**
 * Playwright test fixture that auto-mocks all election API endpoints.
 *
 * Usage in test files:
 *   import { test, expect } from "./fixtures/election-api"
 *
 * The `mockElectionApi` fixture runs automatically for every test,
 * intercepting fetch requests via page.route() and returning mock JSON.
 *
 * For tests that need custom response data (e.g. null precinct counts),
 * call setupElectionApiMocks(page, { resultsOverride }) explicitly
 * before navigating.
 */

import { test as base, type Page } from "@playwright/test"
import {
  ELECTION_ID,
  electionsListResponse,
  electionDetailResponse,
  electionResultsResponse,
  countyGeoJSONResponse,
  precinctGeoJSONResponse,
  boundaryGeoJSONResponse,
} from "./mock-data"

export interface MockOptions {
  resultsOverride?: Record<string, unknown>
  precinctGeoJSONOverride?: Record<string, unknown>
}

export async function setupElectionApiMocks(
  page: Page,
  options: MockOptions = {},
) {
  const results = options.resultsOverride ?? electionResultsResponse
  const precinctGeoJSON =
    options.precinctGeoJSONOverride ?? precinctGeoJSONResponse

  // Precinct GeoJSON (most specific — register first)
  await page.route(
    `**/api/v1/elections/${ELECTION_ID}/results/geojson/precincts*`,
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(precinctGeoJSON),
      }),
  )

  // County GeoJSON
  await page.route(
    `**/api/v1/elections/${ELECTION_ID}/results/geojson`,
    (route, request) => {
      // Let the more-specific /precincts handler take precedence
      if (request.url().includes("/precincts")) return route.fallback()
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(countyGeoJSONResponse),
      })
    },
  )

  // Election results
  await page.route(
    `**/api/v1/elections/${ELECTION_ID}/results`,
    (route, request) => {
      if (request.url().includes("/geojson")) return route.fallback()
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(results),
      })
    },
  )

  // Election detail
  await page.route(
    `**/api/v1/elections/${ELECTION_ID}`,
    (route, request) => {
      if (request.url().includes("/results")) return route.fallback()
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(electionDetailResponse),
      })
    },
  )

  // Elections list (with query params)
  await page.route("**/api/v1/elections?*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(electionsListResponse),
    }),
  )

  // Elections list (bare path — only when not a sub-resource)
  await page.route("**/api/v1/elections", (route, request) => {
    if (request.url().includes(`/elections/`)) return route.fallback()
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(electionsListResponse),
    })
  })

  // Precinct boundary GeoJSON
  await page.route("**/api/v1/boundaries/geojson*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(boundaryGeoJSONResponse),
    }),
  )

  // Suppress map tile requests to avoid network errors in CI
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

  // Mock user role endpoint (returns viewer to suppress admin nav)
  await page.route("**/api/v1/users/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "test-user", role: "viewer" }),
    }),
  )
}

export const test = base.extend<{ mockElectionApi: void }>({
  mockElectionApi: [
    async ({ page, baseURL }, use) => {
      await setupElectionApiMocks(page)

      // Dismiss the welcome modal by setting localStorage before any navigation.
      // We need to visit the origin first so localStorage is scoped correctly.
      await page.goto(baseURL ?? "http://localhost:4173")
      await page.evaluate(() =>
        localStorage.setItem("welcome_dismissed", "true"),
      )

      await use()
    },
    { auto: true },
  ],
})

export { expect } from "@playwright/test"
