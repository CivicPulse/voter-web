import { test, expect } from "./fixtures/election-api"
import { ELECTION_ID } from "./fixtures/mock-data"

test.describe("Election Information Tab", () => {
  // Info and Participation tabs are only visible to authenticated users.
  // Set a mock access_token in localStorage before each test so the app
  // treats the session as authenticated when the page loads.
  test.beforeEach(async ({ page }) => {
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

  test("unauthenticated user sees only Results tab", async ({ page }) => {
    // Override: ensure no access_token for this test
    await page.evaluate(() => localStorage.removeItem("access_token"))
    await page.goto(`/elections/${ELECTION_ID}`)
    await expect(page.getByRole("tab", { name: "Results" })).toBeVisible()
    await expect(page.getByRole("tab", { name: "Election Information" })).not.toBeVisible()
    await expect(page.getByRole("tab", { name: "Participation" })).not.toBeVisible()
  })

  test("unauthenticated user visiting ?tab=info is redirected to results", async ({ page }) => {
    // Override: ensure no access_token for this test
    await page.evaluate(() => localStorage.removeItem("access_token"))
    await page.goto(`/elections/${ELECTION_ID}?tab=info`)
    // URL should be canonicalized to ?tab=results
    await page.waitForURL(/tab=results/)
    await expect(page.getByRole("tab", { name: "Results" })).toBeVisible()
  })
})
