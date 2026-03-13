import { test, expect } from "./fixtures/election-api"
import { setupElectionApiMocks } from "./fixtures/election-api"
import { electionsEmptyResponse } from "./fixtures/mock-data"

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

  test("search filters elections client-side", async ({ page }) => {
    await page.goto("/elections")
    await page.getByPlaceholder("Search elections...").fill("Senate")
    await expect(
      page.getByText("State Senate District 18 Special"),
    ).toBeVisible()
  })
})
