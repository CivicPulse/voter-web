import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, act } from "@testing-library/react"
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
        dataUpdatedAt={Date.now()}
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
        dataUpdatedAt={Date.now()}
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
        dataUpdatedAt={Date.now()}
      />,
    )

    expect(screen.getByText(/Updated/)).toBeInTheDocument()
  })

  it("shows countdown based on dataUpdatedAt", () => {
    const now = new Date("2026-02-17T19:40:00Z").getTime()
    vi.setSystemTime(now)

    // Data was fetched 60 seconds ago, interval is 120s → 60s remaining
    const dataUpdatedAt = now - 60 * 1000

    render(
      <LiveStatusIndicator
        status="active"
        lastRefreshedAt="2026-02-17T19:39:00Z"
        refreshIntervalSeconds={120}
        dataUpdatedAt={dataUpdatedAt}
      />,
    )

    expect(screen.getByText(/next in 60s/)).toBeInTheDocument()
  })

  it("does not show countdown for finalized elections", () => {
    render(
      <LiveStatusIndicator
        status="finalized"
        lastRefreshedAt="2026-02-17T19:40:00Z"
        refreshIntervalSeconds={120}
        dataUpdatedAt={Date.now()}
      />,
    )

    expect(screen.queryByText(/next in/)).not.toBeInTheDocument()
  })

  it("restarts countdown when dataUpdatedAt changes", () => {
    const now = new Date("2026-02-17T19:40:00Z").getTime()
    vi.setSystemTime(now)

    const { rerender } = render(
      <LiveStatusIndicator
        status="active"
        lastRefreshedAt="2026-02-17T19:38:00Z"
        refreshIntervalSeconds={120}
        dataUpdatedAt={now}
      />,
    )

    // Initially should show 120s (just fetched)
    expect(screen.getByText(/next in 120s/)).toBeInTheDocument()

    // Advance 110 seconds
    act(() => {
      vi.advanceTimersByTime(110 * 1000)
    })
    expect(screen.getByText(/next in 10s/)).toBeInTheDocument()

    // Simulate a refetch: dataUpdatedAt updates to "now" (110s later)
    const newNow = now + 110 * 1000
    rerender(
      <LiveStatusIndicator
        status="active"
        lastRefreshedAt="2026-02-17T19:40:00Z"
        refreshIntervalSeconds={120}
        dataUpdatedAt={newNow}
      />,
    )

    // Countdown should restart to 120s
    expect(screen.getByText(/next in 120s/)).toBeInTheDocument()
  })
})
