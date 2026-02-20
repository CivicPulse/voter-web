import { describe, it, expect, beforeEach } from "vitest"
import { useNavigationContext } from "@/stores/navigation-context"

describe("useNavigationContext", () => {
  beforeEach(() => {
    // Reset store state between tests
    useNavigationContext.getState().setContext(null, null)
  })

  it("starts with null state and county", () => {
    const state = useNavigationContext.getState()
    expect(state.stateAbbrev).toBeNull()
    expect(state.countyName).toBeNull()
  })

  it("sets state and county context", () => {
    useNavigationContext.getState().setContext("ga", "Bibb")
    const state = useNavigationContext.getState()
    expect(state.stateAbbrev).toBe("ga")
    expect(state.countyName).toBe("Bibb")
  })

  it("sets state-only context (null county)", () => {
    useNavigationContext.getState().setContext("fl", null)
    const state = useNavigationContext.getState()
    expect(state.stateAbbrev).toBe("fl")
    expect(state.countyName).toBeNull()
  })

  it("clears context by setting both to null", () => {
    useNavigationContext.getState().setContext("ga", "Bibb")
    useNavigationContext.getState().setContext(null, null)
    const state = useNavigationContext.getState()
    expect(state.stateAbbrev).toBeNull()
    expect(state.countyName).toBeNull()
  })

  it("overwrites previous context", () => {
    useNavigationContext.getState().setContext("ga", "Bibb")
    useNavigationContext.getState().setContext("fl", "Miami-Dade")
    const state = useNavigationContext.getState()
    expect(state.stateAbbrev).toBe("fl")
    expect(state.countyName).toBe("Miami-Dade")
  })
})
