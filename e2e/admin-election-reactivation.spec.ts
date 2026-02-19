/**
 * E2E tests for finalized election management:
 * - Manual refresh enabled for finalized elections
 * - Reactivation flow (finalized -> active)
 * - Dialog text accuracy (no stale "Disable/Enable manual refresh" bullets)
 */

import { test as base, expect, type Page } from "@playwright/test"

const ELECTION_ID = "550e8400-e29b-41d4-a716-446655440000"

const finalizedElection = {
  id: ELECTION_ID,
  name: "State Senate District 18 Special",
  election_date: "2026-02-17",
  election_type: "special",
  district: "State Senate - District 18",
  data_source_url: "https://results.sos.ga.gov/api/test",
  status: "finalized",
  last_refreshed_at: "2026-02-17T19:40:48Z",
  refresh_interval_seconds: 120,
  created_at: "2026-02-10T14:00:00Z",
  updated_at: "2026-02-17T19:40:48Z",
}

const refreshResponse = {
  election_id: ELECTION_ID,
  refreshed_at: "2026-02-18T12:00:00Z",
  counties_updated: 5,
  precincts_reporting: 95,
  precincts_participating: 120,
}

async function setupAdminMocks(page: Page) {
  // Mock user role as admin
  await page.route("**/api/v1/users/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "admin-user", role: "admin" }),
    }),
  )

  // Mock auth/me endpoint (used by authStore.fetchUser)
  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "admin-user",
        email: "admin@example.com",
        role: "admin",
      }),
    }),
  )

  // Mock election detail — finalized election
  await page.route(
    `**/api/v1/elections/${ELECTION_ID}`,
    (route, request) => {
      if (request.method() === "PATCH") {
        const url = request.url()
        if (!url.includes("/refresh") && !url.includes("/results")) {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              ...finalizedElection,
              status: "active",
              updated_at: new Date().toISOString(),
            }),
          })
        }
        return route.fallback()
      }
      if (request.url().includes("/results") || request.url().includes("/refresh")) {
        return route.fallback()
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(finalizedElection),
      })
    },
  )

  // Mock refresh endpoint
  await page.route(
    `**/api/v1/elections/${ELECTION_ID}/refresh`,
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(refreshResponse),
      }),
  )

  // Mock elections list (for navigation/back button)
  await page.route("**/api/v1/elections?*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [finalizedElection],
        pagination: { total: 1, page: 1, page_size: 20, total_pages: 1 },
      }),
    }),
  )

  await page.route("**/api/v1/elections", (route, request) => {
    if (request.url().includes("/elections/")) return route.fallback()
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [finalizedElection],
        pagination: { total: 1, page: 1, page_size: 20, total_pages: 1 },
      }),
    })
  })

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

const test = base.extend<{ adminSetup: void }>({
  adminSetup: [
    async ({ page, baseURL }, use) => {
      await setupAdminMocks(page)

      // Set auth tokens and dismiss welcome modal
      await page.goto(baseURL ?? "http://localhost:4173")
      await page.evaluate(() => {
        localStorage.setItem("access_token", "fake-admin-token")
        localStorage.setItem("refresh_token", "fake-refresh-token")
        localStorage.setItem("welcome_dismissed", "true")
      })

      await use()
    },
    { auto: true },
  ],
})

const ADMIN_ELECTION_URL = `/admin/elections/${ELECTION_ID}`

// ==========================================================================
// Finalized election — refresh button enabled
// ==========================================================================

test.describe("Finalized election refresh", () => {
  test("refresh button is enabled for finalized elections", async ({
    page,
  }) => {
    await page.goto(ADMIN_ELECTION_URL)

    const refreshButton = page.getByRole("button", { name: /refresh now/i })
    await expect(refreshButton).toBeVisible()
    await expect(refreshButton).toBeEnabled()
  })

  test("clicking refresh triggers API call and shows success toast", async ({
    page,
  }) => {
    await page.goto(ADMIN_ELECTION_URL)

    const refreshButton = page.getByRole("button", { name: /refresh now/i })
    await refreshButton.click()

    // Success toast should appear
    await expect(
      page.getByText(/election refreshed/i),
    ).toBeVisible()
  })
})

// ==========================================================================
// Reactivation flow
// ==========================================================================

test.describe("Election reactivation", () => {
  test("reactivate button is visible for finalized elections", async ({
    page,
  }) => {
    await page.goto(ADMIN_ELECTION_URL)

    await expect(
      page.getByRole("button", { name: /reactivate/i }),
    ).toBeVisible()
  })

  test("reactivate button opens confirmation dialog", async ({ page }) => {
    await page.goto(ADMIN_ELECTION_URL)

    await page.getByRole("button", { name: /reactivate/i }).click()

    // Dialog should be visible
    await expect(
      page.getByRole("heading", { name: /reactivate election/i }),
    ).toBeVisible()
  })

  test("reactivation dialog does not mention manual refresh", async ({
    page,
  }) => {
    await page.goto(ADMIN_ELECTION_URL)

    await page.getByRole("button", { name: /reactivate/i }).click()

    // Dialog content should NOT contain "Enable manual refresh"
    const dialogContent = page.getByRole("dialog")
    await expect(dialogContent).toBeVisible()
    await expect(dialogContent.getByText(/enable manual refresh/i)).not.toBeVisible()

    // But should contain the other expected items
    await expect(
      dialogContent.getByText(/resume auto-refresh polling/i),
    ).toBeVisible()
    await expect(
      dialogContent.getByText(/unofficial results/i),
    ).toBeVisible()
  })

  test("finalize button is not shown for finalized elections", async ({
    page,
  }) => {
    await page.goto(ADMIN_ELECTION_URL)

    // "Finalize" button should not be present
    await expect(
      page.getByRole("button", { name: /^finalize$/i }),
    ).not.toBeVisible()
  })
})

// ==========================================================================
// Finalize dialog text
// ==========================================================================

test.describe("Finalize dialog text", () => {
  test("finalize dialog does not mention disabling manual refresh", async ({
    page,
  }) => {
    // Override to show an active election so the finalize button appears
    await page.route(
      `**/api/v1/elections/${ELECTION_ID}`,
      (route, request) => {
        if (
          request.url().includes("/results") ||
          request.url().includes("/refresh") ||
          request.method() === "PATCH"
        ) {
          return route.fallback()
        }
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ...finalizedElection, status: "active" }),
        })
      },
    )

    await page.goto(ADMIN_ELECTION_URL)

    // Click the finalize button
    await page.getByRole("button", { name: /^finalize$/i }).click()

    const dialogContent = page.getByRole("dialog")
    await expect(dialogContent).toBeVisible()

    // Should NOT contain "Disable manual refresh"
    await expect(
      dialogContent.getByText(/disable manual refresh/i),
    ).not.toBeVisible()

    // But should contain the other expected items
    await expect(
      dialogContent.getByText(/stop all auto-refresh polling/i),
    ).toBeVisible()
    await expect(
      dialogContent.getByText(/official results/i),
    ).toBeVisible()
  })
})
