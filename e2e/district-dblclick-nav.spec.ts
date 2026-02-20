import { test, expect, type Page } from "@playwright/test"

/**
 * Regression test for district double-click navigation.
 *
 * Bug: Double-clicking a district overlay on the county detail page
 * did not navigate to the district detail page because:
 *   1. County-level district boundary_identifiers (e.g. "006") lack a
 *      FIPS state prefix, so fipsToAbbrev("00") returned undefined.
 *   2. The popup opened on the first click, intercepting the second
 *      click and preventing the native dblclick from firing.
 *
 * This test verifies that double-clicking a county commission district
 * overlay navigates to the correct district slug URL.
 */

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
  ],
}

const BIBB_COUNTY_DETAIL = {
  id: "county-bibb",
  name: "Bibb",
  boundary_type: "county",
  boundary_identifier: "13021",
  source: "census-tiger",
  county: null,
  effective_date: null,
  created_at: "2024-01-01T00:00:00Z",
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
  properties: null,
  county_metadata: {
    geoid: "13021",
    fips_state: "13",
    fips_county: "021",
    gnis_code: "00343697",
    geoid_fq: "0500000US13021",
    name: "Bibb",
    name_lsad: "Bibb County",
    lsad_code: "06",
    class_fp: "H1",
    mtfcc: "G4020",
    csa_code: null,
    cbsa_code: "31420",
    metdiv_code: null,
    functional_status: "A",
    land_area_m2: 649700000,
    water_area_m2: 15600000,
    internal_point_lat: "32.8065",
    internal_point_lon: "-83.6974",
    land_area_km2: 649.7,
    water_area_km2: 15.6,
  },
  precinct_metadata: null,
  voter_stats: null,
}

/** County commission districts with boundary_identifier lacking FIPS prefix. */
const COUNTY_COMMISSION_OVERLAY = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "cc-005",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-83.68, 32.82],
            [-83.6, 32.82],
            [-83.6, 32.9],
            [-83.68, 32.9],
            [-83.68, 32.82],
          ],
        ],
      },
      properties: {
        name: "005",
        boundary_type: "county_commission",
        boundary_identifier: "005",
        source: "sos",
        county: "Bibb",
      },
    },
    {
      type: "Feature",
      id: "cc-006",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-83.65, 32.88],
            [-83.55, 32.88],
            [-83.55, 32.98],
            [-83.65, 32.98],
            [-83.65, 32.88],
          ],
        ],
      },
      properties: {
        name: "006",
        boundary_type: "county_commission",
        boundary_identifier: "006",
        source: "sos",
        county: "Bibb",
      },
    },
  ],
}

async function setupRouteMocks(page: Page) {
  // Static county GeoJSON
  await page.route("**/geojson/county.json", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(COUNTY_BOUNDARIES),
    }),
  )

  // Force API fallback for non-county static GeoJSON
  await page.route("**/geojson/*.json", (route) => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith("/county.json")) return route.fallback()
    return route.fulfill({ status: 404 })
  })

  // Boundary GeoJSON API
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
    if (type === "county_commission") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(COUNTY_COMMISSION_OVERLAY),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ type: "FeatureCollection", features: [] }),
    })
  })

  // County boundary detail
  await page.route("**/api/v1/boundaries/county-bibb", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(BIBB_COUNTY_DETAIL),
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

  // Statewide overlay types
  await page.route("**/api/v1/boundaries/statewide-types", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(["state_senate", "state_house", "congressional"]),
    }),
  )

  // Elections (empty)
  await page.route("**/api/v1/elections*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [],
        pagination: { total: 0, page: 1, page_size: 20, total_pages: 0 },
      }),
    }),
  )

  // Elected officials (empty)
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
      body: JSON.stringify([
        ["NAME", "B01003_001E"],
        ["Georgia", "10800000"],
      ]),
    }),
  )

  // Map tiles (transparent 1x1 PNG)
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

test.describe("District overlay double-click navigation", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await setupRouteMocks(page)
    await page.goto(baseURL ?? "http://localhost:4173")
    await page.evaluate(() =>
      localStorage.setItem("welcome_dismissed", "true"),
    )
  })

  test("double-clicking county commission district navigates to district page", async ({
    page,
  }) => {
    // Navigate to county page with commission overlay
    await page.goto("/counties/ga/bibb?overlay=county_commission")

    // Wait for map and district overlay paths to render
    await expect(page.locator(".leaflet-container")).toBeVisible({
      timeout: 10000,
    })
    // Wait for overlay paths to appear (county boundary + 2 commission districts = 3 paths)
    await page.waitForFunction(
      () =>
        document.querySelectorAll(".leaflet-overlay-pane path").length >= 3,
      { timeout: 10000 },
    )

    // Get center coordinates of the second district path (index 2, skipping county boundary at 0)
    const center = await page.evaluate(() => {
      const paths = document.querySelectorAll(".leaflet-overlay-pane path")
      const districtPath = paths[2]
      if (!districtPath) return null
      const rect = districtPath.getBoundingClientRect()
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
    })
    expect(center).not.toBeNull()

    // Double-click on the district
    await page.mouse.dblclick(center!.x, center!.y)

    // Verify navigation to district detail URL
    await expect(page).toHaveURL(
      /\/districts\/ga\/bibb\/county-commission\/00[56]/,
      { timeout: 5000 },
    )
  })

  test("single click on district opens popup without navigating", async ({
    page,
  }) => {
    await page.goto("/counties/ga/bibb?overlay=county_commission")
    await expect(page.locator(".leaflet-container")).toBeVisible({
      timeout: 10000,
    })
    await page.waitForFunction(
      () =>
        document.querySelectorAll(".leaflet-overlay-pane path").length >= 3,
      { timeout: 10000 },
    )

    const center = await page.evaluate(() => {
      const paths = document.querySelectorAll(".leaflet-overlay-pane path")
      const districtPath = paths[1]
      if (!districtPath) return null
      const rect = districtPath.getBoundingClientRect()
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
    })
    expect(center).not.toBeNull()

    // Single click — should NOT navigate
    await page.mouse.click(center!.x, center!.y)

    // Wait for the delayed popup to open (250ms delay + rendering time)
    await page.waitForTimeout(500)

    // Should still be on the county page
    await expect(page).toHaveURL(/\/counties\/ga\/bibb/)

    // Popup should be visible
    await expect(page.locator(".leaflet-popup")).toBeVisible({ timeout: 3000 })
  })
})
