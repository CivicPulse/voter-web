import { test, expect, setupElectionApiMocks } from "./fixtures/election-api"
import {
  electionsEmptyResponse,
  mockCapabilitiesNone,
} from "./fixtures/mock-data"

test.describe("Elections List - URL State", () => {
  test("persists status filter in URL", async ({ page }) => {
    await page.goto("/elections")
    await expect(
      page.getByText("State Senate District 18 Special"),
    ).toBeVisible()

    // Open status dropdown and select Active
    await page.locator("button").filter({ hasText: "All Statuses" }).click()
    await page.getByRole("option", { name: "Active" }).click()

    await expect(page).toHaveURL(/[?&]status=active/)
  })

  test("persists type filter in URL", async ({ page }) => {
    await page.goto("/elections")
    await expect(
      page.getByText("State Senate District 18 Special"),
    ).toBeVisible()

    // Open type dropdown and select General
    await page.locator("button").filter({ hasText: "All Types" }).click()
    await page.getByRole("option", { name: "General" }).click()

    await expect(page).toHaveURL(/[?&]type=general/)
  })

  test("persists boolean filters in URL", async ({ page }) => {
    await page.goto("/elections")
    await expect(
      page.getByText("State Senate District 18 Special"),
    ).toBeVisible()

    // Check "Registration open" checkbox
    await page.getByLabel("Registration open").click()

    await expect(page).toHaveURL(/[?&]reg_open=/)
  })

  test("shared URL restores filters", async ({ page }) => {
    // Navigate directly to URL with filter params
    await page.goto("/elections?status=active&type=special")

    // Verify filter controls show the correct values
    await expect(
      page.locator("button").filter({ hasText: "Active" }),
    ).toBeVisible()
    await expect(
      page.locator("button").filter({ hasText: "Special" }),
    ).toBeVisible()

    // Verify chips are shown
    await expect(page.getByText("Status: Active")).toBeVisible()
    await expect(page.getByText("Type: Special")).toBeVisible()
  })

  test("back/forward navigates filter states", async ({ page }) => {
    await page.goto("/elections")
    await expect(
      page.getByText("State Senate District 18 Special"),
    ).toBeVisible()

    // Apply status filter
    await page.locator("button").filter({ hasText: "All Statuses" }).click()
    await page.getByRole("option", { name: "Active" }).click()
    await expect(page).toHaveURL(/status=active/)

    // Apply type filter
    await page.locator("button").filter({ hasText: "All Types" }).click()
    await page.getByRole("option", { name: "General" }).click()
    await expect(page).toHaveURL(/type=general/)

    // Go back - should have status=active but not type=general
    await page.goBack()
    await expect(page).toHaveURL(/status=active/)
    await expect(page).not.toHaveURL(/type=general/)

    // Go forward - should have both again
    await page.goForward()
    await expect(page).toHaveURL(/status=active/)
    await expect(page).toHaveURL(/type=general/)
  })
})

test.describe("Elections List - Filter Chips", () => {
  test("shows chip for non-default status filter", async ({ page }) => {
    await page.goto("/elections?status=active")

    await expect(page.getByText("Status: Active")).toBeVisible()
  })

  test("does not show chip for default date preset", async ({ page }) => {
    await page.goto("/elections")
    await expect(
      page.getByText("State Senate District 18 Special"),
    ).toBeVisible()

    // No "Date:" chip should be visible at default state
    await expect(page.getByText(/^Date:/)).not.toBeVisible()
    // No "Clear all" button should be visible
    await expect(page.getByText("Clear all")).not.toBeVisible()
  })

  test("shows chip for non-default date preset (all-time)", async ({
    page,
  }) => {
    await page.goto("/elections?date_preset=all-time")

    await expect(page.getByText("Date: All time")).toBeVisible()
  })

  test("removing chip resets that filter", async ({ page }) => {
    await page.goto("/elections?status=active")

    // Verify chip is visible
    const chip = page.getByText("Status: Active")
    await expect(chip).toBeVisible()

    // Click the chip to remove it
    await chip.click()

    // Chip should disappear and URL should not have status param
    await expect(page.getByText("Status: Active")).not.toBeVisible()
    await expect(page).not.toHaveURL(/status=active/)
  })

  test("clear all filters resets everything", async ({ page }) => {
    await page.goto("/elections?status=active&type=special")

    // Verify chips
    await expect(page.getByText("Status: Active")).toBeVisible()
    await expect(page.getByText("Type: Special")).toBeVisible()
    await expect(page.getByText("Clear all")).toBeVisible()

    // Click Clear all
    await page.getByText("Clear all").click()

    // All chips should be gone and URL should be clean
    await expect(page.getByText("Status: Active")).not.toBeVisible()
    await expect(page.getByText("Type: Special")).not.toBeVisible()
    await expect(page.getByText("Clear all")).not.toBeVisible()
  })
})

test.describe("Elections List - UX Feedback", () => {
  test("displays result count", async ({ page }) => {
    await page.goto("/elections")

    // Wait for elections to load and verify result count
    await expect(page.getByText(/Showing \d+ of \d+ elections/)).toBeVisible()
  })

  test("empty state with filters shows active filter list", async ({
    page,
  }) => {
    // Override the mock to return empty results for any request
    await setupElectionApiMocks(page, {
      electionsListOverride: electionsEmptyResponse,
    })
    await page.goto("/elections?status=finalized&type=runoff")

    // Should show the empty state with filter list
    await expect(page.getByText("No elections found")).toBeVisible()
    await expect(page.getByText("Active filters:")).toBeVisible()
    // Use list-scoped selectors to avoid matching both chip and list item
    const filterList = page.getByRole("list")
    await expect(filterList.getByText("Status: Finalized")).toBeVisible()
    await expect(filterList.getByText("Type: Runoff")).toBeVisible()
    await expect(
      page.getByText("Try broadening your filters for more results."),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Clear all filters" }),
    ).toBeVisible()
  })

  test("empty state at defaults shows calm message", async ({ page }) => {
    // Override the mock to return empty results
    await setupElectionApiMocks(page, {
      electionsListOverride: electionsEmptyResponse,
    })
    await page.goto("/elections")

    // Should show the calm default empty state
    await expect(page.getByText("No upcoming elections")).toBeVisible()
    await expect(
      page.getByText("There are no elections in the next 3 months."),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Show all elections" }),
    ).toBeVisible()
  })

  test("clicking an election navigates to detail", async ({ page }) => {
    await page.goto("/elections")
    await page.getByText("State Senate District 18 Special").click()
    await expect(page).toHaveURL(/\/elections\/550e8400/)
  })

  test("search filters elections server-side", async ({ page }) => {
    await page.goto("/elections")
    const searchInput = page.getByPlaceholder(/Search elections/)
    await expect(searchInput).toBeVisible()
    await searchInput.fill("Senate")
    // Wait for debounce
    await page.waitForTimeout(400)
    await expect(page).toHaveURL(/[?&]q=Senate/)
  })
})

test.describe("Elections List - API-dependent filters", () => {
  test("shows search input when capabilities include search", async ({
    page,
  }) => {
    await page.goto("/elections")
    await expect(page.getByPlaceholder(/Search elections/)).toBeVisible()
  })

  test("hides search input when capabilities lack search", async ({
    page,
  }) => {
    await setupElectionApiMocks(page, {
      capabilitiesOverride: mockCapabilitiesNone,
    })
    await page.goto("/elections")
    // Wait for content to load
    await expect(
      page.getByText("State Senate District 18 Special"),
    ).toBeVisible()
    // Search input should not be present
    await expect(
      page.getByPlaceholder(/Search elections/),
    ).not.toBeVisible()
  })

  test("search filters results with server-side query", async ({ page }) => {
    // Track API calls to verify q param is sent
    const apiCalls: string[] = []
    await page.route("**/api/v1/elections?*", (route) => {
      apiCalls.push(route.request().url())
      return route.fallback()
    })

    await page.goto("/elections")
    const searchInput = page.getByPlaceholder(/Search elections/)
    await expect(searchInput).toBeVisible()

    await searchInput.fill("senate")
    // Wait for debounce (300ms) + navigation
    await page.waitForTimeout(500)

    await expect(page).toHaveURL(/[?&]q=senate/)
    // Verify the API was called with the q parameter
    const hasQParam = apiCalls.some((url) => url.includes("q=senate"))
    expect(hasQParam).toBeTruthy()
  })

  test("shows race category dropdown when capability is enabled", async ({
    page,
  }) => {
    await page.goto("/elections")
    await expect(
      page.getByText("State Senate District 18 Special"),
    ).toBeVisible()

    // Race category dropdown with "All Races" default
    await expect(
      page.locator("button").filter({ hasText: "All Races" }),
    ).toBeVisible()
  })

  test("filters by race category", async ({ page }) => {
    await page.goto("/elections")
    await expect(
      page.getByText("State Senate District 18 Special"),
    ).toBeVisible()

    // Open race category dropdown and select Federal
    await page.locator("button").filter({ hasText: "All Races" }).click()
    await page.getByRole("option", { name: "Federal" }).click()

    await expect(page).toHaveURL(/[?&]race=federal/)
  })

  test("shows county combobox when filter-options is available", async ({
    page,
  }) => {
    await page.goto("/elections")
    await expect(
      page.getByText("State Senate District 18 Special"),
    ).toBeVisible()

    // County combobox trigger button
    await expect(
      page.locator("button").filter({ hasText: "Select county..." }),
    ).toBeVisible()
  })

  test("filters by county", async ({ page }) => {
    await page.goto("/elections")
    await expect(
      page.getByText("State Senate District 18 Special"),
    ).toBeVisible()

    // Open county combobox
    await page.locator("button").filter({ hasText: "Select county..." }).click()
    // Select "Bibb"
    await page.getByRole("option", { name: "Bibb" }).click()

    await expect(page).toHaveURL(/[?&]county=bibb/i)
  })

  test("shows election date dropdown with formatted dates", async ({
    page,
  }) => {
    await page.goto("/elections")
    await expect(
      page.getByText("State Senate District 18 Special"),
    ).toBeVisible()

    // Election date dropdown with "All dates" default
    await expect(
      page.locator("button").filter({ hasText: "All dates" }),
    ).toBeVisible()
  })

  test("filters by election date", async ({ page }) => {
    await page.goto("/elections")
    await expect(
      page.getByText("State Senate District 18 Special"),
    ).toBeVisible()

    // Open election date dropdown and select a date
    await page.locator("button").filter({ hasText: "All dates" }).click()
    await page.getByRole("option", { name: /Nov 3, 2026/ }).click()

    await expect(page).toHaveURL(/[?&]election_date=2026-11-03/)
  })

  test("shows filter chips for new filters", async ({ page }) => {
    await page.goto("/elections?race=federal&county=Bibb")

    await expect(page.getByText("Race: Federal")).toBeVisible()
    await expect(page.getByText("County: Bibb")).toBeVisible()
  })

  test("removes new filter chip on click", async ({ page }) => {
    await page.goto("/elections?race=federal")

    // Verify chip is visible
    const chip = page.getByText("Race: Federal")
    await expect(chip).toBeVisible()

    // Click the chip to remove it
    await chip.click()

    // Chip should disappear and URL should not have race param
    await expect(page.getByText("Race: Federal")).not.toBeVisible()
    await expect(page).not.toHaveURL(/race=federal/)
  })

  test("Row 2 hidden when no new capabilities", async ({ page }) => {
    await setupElectionApiMocks(page, {
      capabilitiesOverride: mockCapabilitiesNone,
    })
    await page.goto("/elections")
    await expect(
      page.getByText("State Senate District 18 Special"),
    ).toBeVisible()

    // Row 2 filters should not be visible
    await expect(
      page.locator("button").filter({ hasText: "All Races" }),
    ).not.toBeVisible()
    await expect(
      page.locator("button").filter({ hasText: "Select county..." }),
    ).not.toBeVisible()
    await expect(
      page.locator("button").filter({ hasText: "All dates" }),
    ).not.toBeVisible()
  })
})
