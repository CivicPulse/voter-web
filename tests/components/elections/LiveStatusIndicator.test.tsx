import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { LiveStatusIndicator } from "@/components/elections/LiveStatusIndicator"

describe("LiveStatusIndicator", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows Live badge for active elections", () => {
    render(
      <LiveStatusIndicator
        status="active"
        lastRefreshedAt={null}
        refreshIntervalSeconds={120}
      />,
    )

    expect(screen.getByText("Live")).toBeInTheDocument()
    expect(screen.queryByText("Final")).not.toBeInTheDocument()
  })

  it("shows Final badge for finalized elections", () => {
    render(
      <LiveStatusIndicator
        status="finalized"
        lastRefreshedAt="2026-02-17T19:40:00Z"
        refreshIntervalSeconds={120}
      />,
    )

    expect(screen.getByText("Final")).toBeInTheDocument()
    expect(screen.queryByText("Live")).not.toBeInTheDocument()
  })

  it("displays last refreshed timestamp", () => {
    render(
      <LiveStatusIndicator
        status="active"
        lastRefreshedAt="2026-02-17T19:40:00Z"
        refreshIntervalSeconds={120}
      />,
    )

    expect(screen.getByText(/Updated/)).toBeInTheDocument()
  })

  it("shows countdown for active elections", () => {
    const now = new Date("2026-02-17T19:40:00Z").getTime()
    vi.setSystemTime(now)

    render(
      <LiveStatusIndicator
        status="active"
        lastRefreshedAt="2026-02-17T19:39:00Z"
        refreshIntervalSeconds={120}
      />,
    )

    // 120s interval, last refresh was 60s ago → 60s remaining
    expect(screen.getByText(/next in 60s/)).toBeInTheDocument()
  })

  it("does not show countdown for finalized elections", () => {
    render(
      <LiveStatusIndicator
        status="finalized"
        lastRefreshedAt="2026-02-17T19:40:00Z"
        refreshIntervalSeconds={120}
      />,
    )

    expect(screen.queryByText(/next in/)).not.toBeInTheDocument()
  })
})
