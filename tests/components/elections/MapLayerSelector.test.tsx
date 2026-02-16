import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MapLayerSelector } from "@/components/elections/MapLayerSelector"

describe("MapLayerSelector", () => {
  it("renders all three layer options", () => {
    render(
      <MapLayerSelector
        activeLayer="leading_candidate"
        onLayerChange={vi.fn()}
      />,
    )

    expect(screen.getByRole("radio", { name: /leading candidate/i })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /reporting/i })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /total votes/i })).toBeInTheDocument()
  })

  it("marks active layer as pressed", () => {
    render(
      <MapLayerSelector
        activeLayer="precincts_reporting"
        onLayerChange={vi.fn()}
      />,
    )

    const reportingButton = screen.getByRole("radio", { name: /reporting/i })
    expect(reportingButton).toHaveAttribute("data-state", "on")
  })

  it("calls onLayerChange when a different layer is selected", async () => {
    const user = userEvent.setup()
    const onLayerChange = vi.fn()

    render(
      <MapLayerSelector
        activeLayer="leading_candidate"
        onLayerChange={onLayerChange}
      />,
    )

    await user.click(screen.getByRole("radio", { name: /total votes/i }))
    expect(onLayerChange).toHaveBeenCalledWith("total_votes")
  })

  it("does not call onLayerChange when clicking already active layer", async () => {
    const user = userEvent.setup()
    const onLayerChange = vi.fn()

    render(
      <MapLayerSelector
        activeLayer="leading_candidate"
        onLayerChange={onLayerChange}
      />,
    )

    await user.click(screen.getByRole("radio", { name: /leading candidate/i }))
    // ToggleGroup with type="single" does not emit value change when clicking same item
    expect(onLayerChange).not.toHaveBeenCalled()
  })
})
