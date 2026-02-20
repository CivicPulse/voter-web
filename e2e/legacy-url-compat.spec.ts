import { test, expect, type Page } from "@playwright/test"

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

const COUNTY_COMMISSION_BOUNDARIES = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "uuid-bibb-005",
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
        name: "005",
        boundary_type: "county_commission",
        boundary_identifier: "13CC005",
        source: "census-tiger",
        county: "Bibb",
      },
    },
    {
      type: "Feature",
      id: "uuid-houston-005",
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
        name: "005",
        boundary_type: "county_commission",
        boundary_identifier: "13CC005H",
        source: "census-tiger",
        county: "Houston",
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
  await page.route("**/api/v1/boundaries/geojson*", (route, request) => {
    const url = new URL(request.url())
    const type = url.searchParams.get("boundary_type")
    if (type === "state_senate") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(STATE_SENATE_BOUNDARIES),
      })
    }
    if (type === "county_commission") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(COUNTY_COMMISSION_BOUNDARIES),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ type: "FeatureCollection", features: [] }),
    })
  })

  await page.route("**/api/v1/boundaries/uuid-senate-18", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(BOUNDARY_DETAIL),
    }),
  )

  // Static GeoJSON fallbacks (return 404 to force API fetch)
  await page.route("**/geojson/*.json", (route) =>
    route.fulfill({ status: 404 }),
  )

  await page.route("**/api/v1/elections*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [], pagination: { total: 0, page: 1, page_size: 20, total_pages: 0 } }),
    }),
  )

  await page.route("**/api/v1/elected-officials*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    }),
  )

  await page.route("**/api/v1/users/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "test-user", role: "viewer" }),
    }),
  )

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

test.describe("Legacy URL compatibility", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await setupRouteMocks(page)
    await page.goto(baseURL ?? "http://localhost:4173")
    await page.evaluate(() =>
      localStorage.setItem("welcome_dismissed", "true"),
    )
  })

  test("legacy district slug with single match redirects to fully-qualified URL", async ({ page }) => {
    await page.goto("/districts/state-senate/018")
    // Should redirect to /districts/ga/state-senate/018
    await page.waitForURL("**/districts/ga/state-senate/018", {
      timeout: 10000,
    })
    expect(page.url()).toContain("/districts/ga/state-senate/018")
  })

  test("legacy district slug with multiple matches shows disambiguation", async ({ page }) => {
    await page.goto("/districts/county-commission/005")
    // Should show disambiguation page with both counties
    await expect(
      page.getByText("Multiple Districts Found"),
    ).toBeVisible({ timeout: 10000 })
    await expect(page.getByText("Bibb")).toBeVisible()
    await expect(page.getByText("Houston")).toBeVisible()
  })

  test("UUID district route still renders correctly", async ({ page }) => {
    await page.goto("/districts/uuid-senate-18")
    // Should render the district detail (loading then content)
    // The UUID route fetches boundary detail directly
    await page.waitForTimeout(2000) // Give time for data fetch
    // Should not show "not found" or error
    const errorText = page.getByText("District not found")
    await expect(errorText).not.toBeVisible()
  })
})
