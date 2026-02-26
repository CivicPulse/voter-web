import { test, expect } from "./fixtures/election-api"
import { CANDIDATE_ID } from "./fixtures/mock-data"

test.describe("Candidate Detail", () => {
  test("renders candidate info", async ({ page }) => {
    await page.goto(`/candidates/${CANDIDATE_ID}`)
    await expect(page.getByRole("heading", { name: "Andrea C. Cooke" })).toBeVisible()
    await expect(page.getByText("Dem", { exact: true })).toBeVisible()
  })

  test("shows back navigation", async ({ page }) => {
    await page.goto(`/candidates/${CANDIDATE_ID}`)
    await expect(page.getByText(/Back to election/i)).toBeVisible()
  })

  test("shows bio section", async ({ page }) => {
    await page.goto(`/candidates/${CANDIDATE_ID}`)
    await expect(page.getByText("Community advocate")).toBeVisible()
  })
})
