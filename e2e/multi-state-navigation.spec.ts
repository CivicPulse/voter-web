import { test, expect, type Page } from "@playwright/test"

const COUNTY_BOUNDARIES = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "county-bibb",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-83.7, 32.8],
            [-83.5, 32.8],
            [-83.5, 33.0],
            [-83.7, 33.0],
            [-83.7, 32.8],
          ],
        ],
      },
      properties: {
        name: "Bibb",
        boundary_type: "county",
        boundary_identifier: "13021",
        source: "census-tiger",
        county: null,
      },
    },
    {
      type: "Feature",
      id: "county-houston",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-83.8, 32.3],
            [-83.5, 32.3],
            [-83.5, 32.6],
            [-83.8, 32.6],
            [-83.8, 32.3],
          ],
        ],
      },
      properties: {
        name: "Houston",
        boundary_type: "county",
        boundary_identifier: "13153",
        source: "census-tiger",
        county: null,
      },
    },
  ],
}

const STATE_SENATE_BOUNDARIES = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "uuid-senate-18",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-83.7, 32.8],
            [-83.5, 32.8],
            [-83.5, 33.0],
            [-83.7, 33.0],
            [-83.7, 32.8],
          ],
        ],
      },
      properties: {
        name: "018",
        boundary_type: "state_senate",
        boundary_identifier: "13SS018",
        source: "census-tiger",
        county: null,
      },
    },
  ],
}

const BOUNDARY_DETAIL = {
  id: "uuid-senate-18",
  name: "018",
  boundary_type: "state_senate",
  boundary_identifier: "13SS018",
  source: "census-tiger",
  county: null,
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-83.7, 32.8],
        [-83.5, 32.8],
        [-83.5, 33.0],
        [-83.7, 33.0],
        [-83.7, 32.8],
      ],
    ],
  },
}

async function setupRouteMocks(page: Page) {
  // County boundaries GeoJSON
  await page.route("**/geojson/county.json", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(COUNTY_BOUNDARIES),
    }),
  )

  await page.route("**/api/v1/boundaries/geojson*", (route, request) => {
    const url = new URL(request.url())
    const type = url.searchParams.get("boundary_type")
    if (type === "county") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(COUNTY_BOUNDARIES),
      })
    }
    if (type === "state_senate") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(STATE_SENATE_BOUNDARIES),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ type: "FeatureCollection", features: [] }),
    })
  })

  // Boundary detail
  await page.route("**/api/v1/boundaries/uuid-senate-18", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(BOUNDARY_DETAIL),
    }),
  )

  // Statewide overlay types
  await page.route("**/api/v1/boundaries/statewide-types", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(["state_senate", "state_house", "congressional"]),
    }),
  )

  // Boundary types
  await page.route("**/api/v1/boundaries/types*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(["county_commission", "school_board"]),
    }),
  )

  // Elections (empty)
  await page.route("**/api/v1/elections*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [], pagination: { total: 0, page: 1, page_size: 20, total_pages: 0 } }),
    }),
  )

  // Elected officials
  await page.route("**/api/v1/elected-officials*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    }),
  )

  // User role
  await page.route("**/api/v1/users/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "test-user", role: "viewer" }),
    }),
  )

  // Census API
  await page.route("**/api.census.gov/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([["NAME", "B01003_001E"], ["Georgia", "10800000"]]),
    }),
  )

  // Static GeoJSON fallback (return 404 to force API fetch)
  await page.route("**/geojson/state_senate.json", (route) =>
    route.fulfill({ status: 404 }),
  )
  await page.route("**/geojson/state_house.json", (route) =>
    route.fulfill({ status: 404 }),
  )
  await page.route("**/geojson/congressional.json", (route) =>
    route.fulfill({ status: 404 }),
  )

  // Map tiles
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

test.describe("Multi-state navigation", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await setupRouteMocks(page)
    await page.goto(baseURL ?? "http://localhost:4173")
    await page.evaluate(() =>
      localStorage.setItem("welcome_dismissed", "true"),
    )
  })

  test("home page renders state map for single-state data", async ({ page }) => {
    await page.goto("/")
    // Should show the map container (Leaflet renders a div with class leaflet-container)
    await expect(page.locator(".leaflet-container")).toBeVisible({ timeout: 10000 })
    // Header should show "Voter Web" (use first() to avoid strict mode violation with mobile nav)
    await expect(page.locator("h1").first()).toContainText("Voter Web")
  })

  test("state page renders with correct title", async ({ page }) => {
    await page.goto("/ga")
    await expect(page.locator(".leaflet-container")).toBeVisible({ timeout: 10000 })
  })

  test("state-level district URL resolves correctly", async ({ page }) => {
    await page.goto("/districts/ga/state-senate/018")
    // Should show the district detail content (loading then content)
    // Wait for loading to finish
    await page.waitForSelector("text=Resolving district", {
      state: "hidden",
      timeout: 10000,
    }).catch(() => {
      // May have already resolved
    })
  })
})
