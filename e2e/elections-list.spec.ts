import { test, expect } from "./fixtures/election-api"

test.describe("Elections List", () => {
  test("displays flat list of elections", async ({ page }) => {
    await page.goto("/elections")
    await expect(page.getByRole("heading", { name: "Elections" })).toBeVisible()
    await expect(page.getByText("State Senate District 18 Special")).toBeVisible()
  })

  test("search filters elections", async ({ page }) => {
    await page.goto("/elections")
    await page.getByPlaceholder("Search elections...").fill("Senate")
    await expect(page.getByText("State Senate District 18 Special")).toBeVisible()
  })

  test("clicking an election navigates to detail", async ({ page }) => {
    await page.goto("/elections")
    await page.getByText("State Senate District 18 Special").click()
    await expect(page).toHaveURL(/\/elections\/550e8400/)
  })
})
