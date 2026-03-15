import { test, expect } from "./fixtures/election-api"
import { ELECTION_ID } from "./fixtures/mock-data"

test.describe("Election Information Tab", () => {
  // Info and Participation tabs are only visible to authenticated users.
  // Mock auth/me so initialize() doesn't clear auth, then set access_token
  // in localStorage before each test so the app treats the session as authenticated.
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/v1/auth/me", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "test-user", role: "viewer" }),
      }),
    )
    await page.evaluate(() =>
      localStorage.setItem("access_token", "test-token"),
    )
  })

  test("shows info tab with candidates", async ({ page }) => {
    await page.goto(`/elections/${ELECTION_ID}?tab=info`)
    await expect(page.getByText("Andrea C. Cooke")).toBeVisible()
    await expect(page.getByText("Robert T. Williams")).toBeVisible()
  })

  test("shows eligibility section", async ({ page }) => {
    await page.goto(`/elections/${ELECTION_ID}?tab=info`)
    await expect(page.getByText("Eligibility")).toBeVisible()
  })

  test("shows three tabs", async ({ page }) => {
    await page.goto(`/elections/${ELECTION_ID}`)
    await expect(page.getByRole("tab", { name: "Election Information" })).toBeVisible()
    await expect(page.getByRole("tab", { name: "Results" })).toBeVisible()
    await expect(page.getByRole("tab", { name: "Participation" })).toBeVisible()
  })

  test("unauthenticated user sees Results and Info tabs but not Participation", async ({ page }) => {
    // Override: ensure no access_token for this test
    await page.evaluate(() => localStorage.removeItem("access_token"))
    await page.goto(`/elections/${ELECTION_ID}`)
    await expect(page.getByRole("tab", { name: "Results" })).toBeVisible()
    // Info tab is visible because mock candidates exist (PR #73 changed from auth-only)
    await expect(page.getByRole("tab", { name: "Election Information" })).toBeVisible()
    await expect(page.getByRole("tab", { name: "Participation" })).not.toBeVisible()
  })

  test("unauthenticated user can view info tab when candidates exist", async ({ page }) => {
    // Override: ensure no access_token for this test
    await page.evaluate(() => localStorage.removeItem("access_token"))
    await page.goto(`/elections/${ELECTION_ID}?tab=info`)
    await expect(page.getByRole("tab", { name: "Election Information" })).toBeVisible()
    await expect(page.getByText("Andrea C. Cooke")).toBeVisible()
  })

  test("unauthenticated user without candidates sees only Results tab", async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem("access_token"))
    // Override candidates to return empty
    await page.route(`**/api/v1/elections/${ELECTION_ID}/candidates*`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], total: 0, page: 1, page_size: 100 }),
      }),
    )
    await page.goto(`/elections/${ELECTION_ID}`)
    await expect(page.getByRole("tab", { name: "Results" })).toBeVisible()
    await expect(page.getByRole("tab", { name: "Election Information" })).not.toBeVisible()
  })
})
