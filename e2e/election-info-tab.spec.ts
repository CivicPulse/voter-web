import { test, expect } from "./fixtures/election-api"
import { ELECTION_ID } from "./fixtures/mock-data"

test.describe("Election Information Tab", () => {
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
})
