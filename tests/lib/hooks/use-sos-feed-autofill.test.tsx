import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  createElectionSchema,
  type ElectionFormValues,
} from "@/lib/schemas/election-form"
import { useSosFeedAutoFill } from "@/lib/hooks/use-sos-feed-autofill"
import { mockSosFeedResponse } from "@/test/mocks/sos-feed"

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

import { toast } from "sonner"

const VALID_SOS_URL =
  "https://results.sos.ga.gov/cdn/results/Georgia/export-test.json"

const DEBOUNCE_MS = 20

const mockFetch = vi.fn()

function setupFormAndHook(options?: {
  enabled?: boolean
  defaultUrl?: string
}) {
  return renderHook(() => {
    const form = useForm<ElectionFormValues>({
      resolver: zodResolver(createElectionSchema),
      defaultValues: {
        name: "",
        election_date: "",
        election_type: undefined,
        district: "",
        data_source_url: options?.defaultUrl ?? "",
        refresh_interval_seconds: 120,
      },
    })

    const autoFill = useSosFeedAutoFill({
      form,
      enabled: options?.enabled ?? true,
      debounceMs: DEBOUNCE_MS,
    })

    return { form, autoFill }
  })
}

describe("useSosFeedAutoFill", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal("fetch", mockFetch)
  })

  it("fetches and populates form when a valid SOS URL is set", async () => {
    const feed = mockSosFeedResponse()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(feed),
    })

    const { result } = setupFormAndHook()

    act(() => {
      result.current.form.setValue("data_source_url", VALID_SOS_URL)
    })

    await waitFor(() => {
      expect(result.current.form.getValues("name")).toBe(
        "January 20, 2026 - Special Election",
      )
    })

    expect(mockFetch).toHaveBeenCalledWith(
      VALID_SOS_URL,
      expect.objectContaining({ redirect: "error" }),
    )
    expect(result.current.form.getValues("election_date")).toBe("2026-01-20")
    expect(result.current.form.getValues("election_type")).toBe("special")
    expect(result.current.form.getValues("district")).toBe(
      "State Senate - District 18",
    )
    expect(toast.success).toHaveBeenCalled()
  })

  it("does not fetch when enabled is false", async () => {
    const { result } = setupFormAndHook({ enabled: false })

    act(() => {
      result.current.form.setValue("data_source_url", VALID_SOS_URL)
    })

    // Wait longer than debounce
    await new Promise((r) => setTimeout(r, DEBOUNCE_MS * 3))

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("does not fetch for non-SOS URLs", async () => {
    const { result } = setupFormAndHook()

    act(() => {
      result.current.form.setValue(
        "data_source_url",
        "https://example.com/data.json",
      )
    })

    await new Promise((r) => setTimeout(r, DEBOUNCE_MS * 3))

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("does not fetch the same URL twice", async () => {
    const feed = mockSosFeedResponse()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(feed),
    })

    const { result } = setupFormAndHook()

    act(() => {
      result.current.form.setValue("data_source_url", VALID_SOS_URL)
    })

    await waitFor(() => {
      expect(result.current.form.getValues("name")).toBe(
        "January 20, 2026 - Special Election",
      )
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)

    // Set same URL again
    act(() => {
      result.current.form.setValue("data_source_url", "")
    })
    act(() => {
      result.current.form.setValue("data_source_url", VALID_SOS_URL)
    })

    await new Promise((r) => setTimeout(r, DEBOUNCE_MS * 3))

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it("skips auto-fill if URL matches initial value (edit page scenario)", async () => {
    setupFormAndHook({ defaultUrl: VALID_SOS_URL })

    await new Promise((r) => setTimeout(r, DEBOUNCE_MS * 3))

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("shows error toast on fetch failure", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    })

    const { result } = setupFormAndHook()

    act(() => {
      result.current.form.setValue("data_source_url", VALID_SOS_URL)
    })

    await waitFor(() => {
      expect(result.current.autoFill.fetchError).toBe(
        "SOS feed request failed: 404 Not Found",
      )
    })

    expect(toast.error).toHaveBeenCalled()
  })

  it("preserves user-edited fields during auto-fill", async () => {
    const feed = mockSosFeedResponse()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(feed),
    })

    const { result } = setupFormAndHook()

    // User manually edits the name field
    act(() => {
      result.current.form.setValue("name", "My Custom Name", {
        shouldDirty: true,
      })
    })

    // Now trigger auto-fill
    act(() => {
      result.current.form.setValue("data_source_url", VALID_SOS_URL)
    })

    await waitFor(() => {
      expect(result.current.form.getValues("election_date")).toBe(
        "2026-01-20",
      )
    })

    // Name should be preserved (user edited it)
    expect(result.current.form.getValues("name")).toBe("My Custom Name")
    // Other fields should be auto-filled
    expect(result.current.form.getValues("district")).toBe(
      "State Senate - District 18",
    )
  })

  it("sets isAutoFilled on successful fetch", async () => {
    const feed = mockSosFeedResponse()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(feed),
    })

    const { result } = setupFormAndHook()

    act(() => {
      result.current.form.setValue("data_source_url", VALID_SOS_URL)
    })

    await waitFor(() => {
      expect(result.current.autoFill.isAutoFilled).toBe(true)
    })
  })

  it("increments selectKey when election_type is auto-filled", async () => {
    const feed = mockSosFeedResponse()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(feed),
    })

    const { result } = setupFormAndHook()
    const initialKey = result.current.autoFill.selectKey

    act(() => {
      result.current.form.setValue("data_source_url", VALID_SOS_URL)
    })

    await waitFor(() => {
      expect(result.current.autoFill.selectKey).toBe(initialKey + 1)
    })
  })
})
