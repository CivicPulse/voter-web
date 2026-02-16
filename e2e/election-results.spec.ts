/**
 * E2E tests for the election race results page.
 *
 * These tests serve as regression guards for three GUI bugs fixed in
 * the claude/fix-precinct-map-display branch:
 *
 * 1. NaN% reporting badge — RaceWideSummary showed "NaN%" when API
 *    returned null precinct counts.
 * 2. Missing precincts on map — county name filter mismatch, property
 *    name mismatch, and missing React-Leaflet key prop.
 * 3. Dropdown z-index — county filter dropdown hidden behind the
 *    Leaflet map due to z-index conflict.
 */

import { test, expect, setupElectionApiMocks } from "./fixtures/election-api"
import {
  ELECTION_ID,
  ELECTION_DATE,
  electionResultsWithNullCounts,
} from "./fixtures/mock-data"

const RACE_URL = `/elections/${ELECTION_DATE}/${ELECTION_ID}`

// ==========================================================================
// Bug Fix #1: NaN% reporting badge
// ==========================================================================

test.describe("Reporting percentage (NaN% fix)", () => {
  test("displays valid percentage when precinct counts are present", async ({
    page,
  }) => {
    await page.goto(RACE_URL)

    // Wait for the results section to load (95/120 = 79%)
    const badge = page.getByText(/\d+% reporting/)
    await expect(badge).toBeVisible()
    await expect(badge).toHaveText("79% reporting")
  })

  test("displays derived percentage when top-level precinct counts are null", async ({
    page,
  }) => {
    // Override the auto-applied mock with null precinct counts
    await setupElectionApiMocks(page, {
      resultsOverride: electionResultsWithNullCounts,
    })

    await page.goto(RACE_URL)

    const badge = page.getByText(/\d+% reporting/)
    await expect(badge).toBeVisible()

    // Must NOT show "NaN% reporting"
    const badgeText = await badge.textContent()
    expect(badgeText).not.toContain("NaN")

    // Falls back to county_results sum: 38/45 = 84%
    await expect(badge).toHaveText("84% reporting")
  })

  test("shows precinct count detail text", async ({ page }) => {
    await page.goto(RACE_URL)

    await expect(
      page.getByText(/95 of\s+120 precincts reporting/),
    ).toBeVisible()
  })
})

// ==========================================================================
// Bug Fix #2: Missing precincts on map
// ==========================================================================

test.describe("Precinct map rendering", () => {
  test("map container renders in precinct view", async ({ page }) => {
    await page.goto(RACE_URL)

    // Switch to precinct view
    await page.getByLabel(/precinct/i).click()

    // Leaflet map container should be present
    const mapContainer = page.locator(".leaflet-container")
    await expect(mapContainer).toBeVisible()
  })

  test("precinct view does not show empty state when data exists", async ({
    page,
  }) => {
    await page.goto(RACE_URL)

    await page.getByLabel(/precinct/i).click()

    // Give the map time to render after mocked API responds
    await page.waitForTimeout(1000)

    // The "not available" overlay should NOT be visible
    await expect(
      page.getByText("Precinct boundaries are not available"),
    ).not.toBeVisible()
  })

  test("county filter dropdown is visible in precinct view", async ({
    page,
  }) => {
    await page.goto(RACE_URL)

    await page.getByLabel(/precinct/i).click()

    // County filter should show "All counties" by default
    const trigger = page.getByRole("combobox")
    await expect(trigger).toBeVisible()
    await expect(trigger).toContainText("All counties")
  })
})

// ==========================================================================
// Bug Fix #3: Dropdown z-index
// ==========================================================================

test.describe("County dropdown z-index (clickability)", () => {
  test("county dropdown opens and shows options above the map", async ({
    page,
  }) => {
    await page.goto(RACE_URL)

    // Switch to precinct view
    await page.getByLabel(/precinct/i).click()

    // Click the dropdown trigger
    const trigger = page.getByRole("combobox")
    await trigger.click()

    // Dropdown content should be visible with county options
    await expect(
      page.getByRole("option", { name: "All counties" }),
    ).toBeVisible()
    await expect(
      page.getByRole("option", { name: "Bibb County" }),
    ).toBeVisible()
  })

  test("selecting a county in dropdown filters the view", async ({ page }) => {
    await page.goto(RACE_URL)

    await page.getByLabel(/precinct/i).click()

    const trigger = page.getByRole("combobox")
    await trigger.click()

    await page.getByRole("option", { name: "Bibb County" }).click()

    // Trigger text should reflect the selected county
    await expect(trigger).toContainText("Bibb County")
  })
})

// ==========================================================================
// General smoke tests
// ==========================================================================

test.describe("Page smoke tests", () => {
  test("renders race header with election name and district", async ({
    page,
  }) => {
    await page.goto(RACE_URL)

    await expect(
      page.getByRole("heading", {
        name: "State Senate District 18 Special",
      }),
    ).toBeVisible()
    await expect(
      page.getByText("State Senate - District 18"),
    ).toBeVisible()
  })

  test("renders candidate names and vote counts", async ({ page }) => {
    await page.goto(RACE_URL)

    await expect(page.getByText("Jane Doe")).toBeVisible()
    await expect(page.getByText("John Smith")).toBeVisible()
  })

  test("shows total votes", async ({ page }) => {
    await page.goto(RACE_URL)

    // 12,500 + 9,800 = 22,300
    await expect(page.getByText("22,300 total votes")).toBeVisible()
  })

  test("county/precinct view toggle is present", async ({ page }) => {
    await page.goto(RACE_URL)

    await expect(page.getByLabel(/county/i)).toBeVisible()
    await expect(page.getByLabel(/precinct/i)).toBeVisible()
  })

  test("county map view renders by default", async ({ page }) => {
    await page.goto(RACE_URL)

    const mapContainer = page.locator(".leaflet-container")
    await expect(mapContainer).toBeVisible()
  })
})
