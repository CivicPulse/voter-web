/**
 * E2E tests for voter history & election participation features.
 *
 * Covers:
 * - Voter history card on voter detail page
 * - Election detail Participation tab with stats
 * - Role-gated voter list on Participation tab
 */

import { test as base, expect } from "@playwright/test"
import { test as electionTest, expect as electionExpect } from "./fixtures/election-api"
import { test as voterTest, expect as voterExpect } from "./fixtures/voter-api"
import { setupElectionApiMocks } from "./fixtures/election-api"
import { ELECTION_DATE, ELECTION_ID, VOTER_ID } from "./fixtures/mock-data"

const VOTER_URL = `/voters/${VOTER_ID}`
const RACE_URL = `/elections/${ELECTION_DATE}/${ELECTION_ID}`

// ==========================================================================
// Voter History Card on Voter Detail Page
// ==========================================================================

voterTest.describe("Voter History Card", () => {
  voterTest("displays election history records on voter detail page", async ({
    page,
  }) => {
    await page.goto(VOTER_URL)

    // Wait for the history card to appear
    const historyCard = page.getByText("Election History")
    await voterExpect(historyCard).toBeVisible({ timeout: 10_000 })

    // Verify election records are listed (names generated from date + type)
    await voterExpect(
      page.getByText("State Senate District 18 Special"),
    ).toBeVisible()
    await voterExpect(page.getByText("2024 General Election")).toBeVisible()
    await voterExpect(page.getByText("2024 Primary Election")).toBeVisible()
  })

  voterTest("shows voting method for each record", async ({ page }) => {
    await page.goto(VOTER_URL)

    await voterExpect(page.getByText("Election History")).toBeVisible({
      timeout: 10_000,
    })
    // Records 1 & 2 have all boolean flags false → "In Person"
    // Record 3 has absentee: true → "Absentee by Mail"
    await voterExpect(page.getByText("In Person").first()).toBeVisible()
    await voterExpect(page.getByText("Absentee by Mail")).toBeVisible()
  })
})

// ==========================================================================
// Election Participation Tab
// ==========================================================================

electionTest.describe("Election Participation Tab", () => {
  electionTest("displays Results and Participation tabs", async ({ page }) => {
    await page.goto(RACE_URL)

    const resultsTab = page.getByRole("tab", { name: "Results" })
    const participationTab = page.getByRole("tab", { name: "Participation" })

    await electionExpect(resultsTab).toBeVisible()
    await electionExpect(participationTab).toBeVisible()

    // Results tab is active by default
    await electionExpect(resultsTab).toHaveAttribute("data-state", "active")
  })

  electionTest("switches to Participation tab and shows stats", async ({
    page,
  }) => {
    await page.goto(RACE_URL)

    // Click the Participation tab
    await page.getByRole("tab", { name: "Participation" }).click()

    // Verify stats card content appears
    await electionExpect(page.getByText("Participation Statistics")).toBeVisible()
    await electionExpect(page.getByText("Votes Cast")).toBeVisible()
  })

  electionTest("syncs tab to URL search param", async ({ page }) => {
    // Navigate directly to participation tab via URL
    await page.goto(`${RACE_URL}?tab=participation`)

    const participationTab = page.getByRole("tab", { name: "Participation" })
    await electionExpect(participationTab).toHaveAttribute(
      "data-state",
      "active",
    )

    // Stats content should be visible
    await electionExpect(page.getByText("Participation Statistics")).toBeVisible()
  })

  electionTest("does NOT show voter list for viewer role", async ({ page }) => {
    // Default mock uses viewer role
    await page.goto(`${RACE_URL}?tab=participation`)

    await electionExpect(page.getByText("Participation Statistics")).toBeVisible()

    // Voter list should not be visible for viewer
    await electionExpect(page.getByText("Voter List")).not.toBeVisible()
  })
})

// ==========================================================================
// Election Participant List (admin role)
// Uses base test (no auto-fixture) to control auth setup before page loads.
// ==========================================================================

base.describe("Election Participant List (admin)", () => {
  base.beforeEach(async ({ page, baseURL }) => {
    // Set up all election API mocks with admin role
    await setupElectionApiMocks(page)

    // Mock auth/me (used by authStore.initialize & useUserRole) with admin role
    await page.route("**/api/v1/auth/me", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "test-user", role: "admin" }),
      }),
    )

    // Navigate to set localStorage (must be same origin)
    await page.goto(baseURL ?? "http://localhost:4173")
    await page.evaluate(() => {
      localStorage.setItem("welcome_dismissed", "true")
      localStorage.setItem("access_token", "test-token")
    })
  })

  base("shows voter list for admin role", async ({ page }) => {
    await page.goto(`${RACE_URL}?tab=participation`)

    await expect(page.getByText("Voter List")).toBeVisible()
    // Backend returns registration numbers; names are derived from the record
    await expect(page.getByText("GA-12345678")).toBeVisible()
    await expect(page.getByText("GA-87654321")).toBeVisible()
  })

  base("shows table columns for participant data", async ({ page }) => {
    await page.goto(`${RACE_URL}?tab=participation`)

    await expect(page.getByText("Voter List")).toBeVisible()
    await expect(page.getByRole("columnheader", { name: "Name" })).toBeVisible()
    await expect(
      page.getByRole("columnheader", { name: "Registration #" }),
    ).toBeVisible()
    await expect(page.getByRole("columnheader", { name: "County" })).toBeVisible()
    await expect(
      page.getByRole("columnheader", { name: "Voting Method" }),
    ).toBeVisible()
  })

  base("has search input for filtering participants", async ({ page }) => {
    await page.goto(`${RACE_URL}?tab=participation`)

    await expect(page.getByText("Voter List")).toBeVisible()
    const searchInput = page.getByPlaceholder("Search by name or registration #")
    await expect(searchInput).toBeVisible()
  })
})
