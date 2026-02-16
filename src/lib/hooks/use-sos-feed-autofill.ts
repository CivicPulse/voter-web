import { useState, useCallback, useRef, useEffect } from "react"
import type { UseFormReturn } from "react-hook-form"
import type { ElectionFormValues } from "@/lib/schemas/election-form"
import type { AutoFillableField } from "@/types/sos-feed"
import { isSosUrl, fetchSosFeed, extractAutoFillData } from "@/api/sos-feed"
import { toast } from "sonner"

interface UseSosFeedAutoFillOptions {
  form: UseFormReturn<ElectionFormValues>
  enabled?: boolean
  debounceMs?: number
}

interface UseSosFeedAutoFillReturn {
  isFetching: boolean
  fetchError: string | null
  /** True for 5 seconds after a successful auto-fill, for UI feedback */
  isAutoFilled: boolean
  /** React key for Select remount — incremented when election_type changes to force re-render */
  selectKey: number
  /** Number of ballot items (races) in the feed, or null if single-race or unknown */
  multiRaceCount: number | null
}

export function useSosFeedAutoFill({
  form,
  enabled = true,
  debounceMs = 500,
}: UseSosFeedAutoFillOptions): UseSosFeedAutoFillReturn {
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isAutoFilled, setIsAutoFilled] = useState(false)
  const [selectKey, setSelectKey] = useState(0)
  const [multiRaceCount, setMultiRaceCount] = useState<number | null>(null)

  const initialUrlRef = useRef(form.getValues("data_source_url"))
  const lastFetchedUrlRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoFilledTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userEditedFieldsRef = useRef<Set<AutoFillableField>>(new Set())
  const timedOutRef = useRef(false)

  // Track user edits to auto-fillable fields (excluding data_source_url)
  useEffect(() => {
    if (!enabled) return

    const subscription = form.watch((_value, { name }) => {
      if (
        name &&
        name !== "data_source_url" &&
        name !== "refresh_interval_seconds" &&
        !lastFetchedUrlRef.current // Only track edits before first auto-fill
      ) {
        userEditedFieldsRef.current.add(name as AutoFillableField)
      }
    })

    return () => subscription.unsubscribe()
  }, [form, enabled])

  const doFetch = useCallback(
    async (url: string) => {
      if (!isSosUrl(url)) return
      if (lastFetchedUrlRef.current === url) return
      if (url === initialUrlRef.current) return

      abortControllerRef.current?.abort()
      const controller = new AbortController()
      timedOutRef.current = false
      const timeoutId = setTimeout(() => {
        timedOutRef.current = true
        controller.abort()
      }, 10_000)
      abortControllerRef.current = controller

      setIsFetching(true)
      setFetchError(null)

      try {
        const feed = await fetchSosFeed(url, controller.signal)

        if (controller.signal.aborted) return

        const ballotItemCount = feed.results.ballotItems?.length ?? 0
        setMultiRaceCount(ballotItemCount > 1 ? ballotItemCount : null)

        const data = extractAutoFillData(feed)
        const edited = userEditedFieldsRef.current
        const populated: string[] = []

        if (!edited.has("name") && data.name) {
          form.setValue("name", data.name, {
            shouldValidate: true,
            shouldDirty: true,
          })
          populated.push("name")
        }
        if (!edited.has("election_date") && data.election_date) {
          form.setValue("election_date", data.election_date, {
            shouldValidate: true,
            shouldDirty: true,
          })
          populated.push("date")
        }
        if (!edited.has("election_type") && data.election_type) {
          form.setValue("election_type", data.election_type, {
            shouldValidate: true,
            shouldDirty: true,
          })
          setSelectKey((k) => k + 1)
          populated.push("type")
        }
        if (!edited.has("district") && data.district) {
          form.setValue("district", data.district, {
            shouldValidate: true,
            shouldDirty: true,
          })
          populated.push("district")
        }

        lastFetchedUrlRef.current = url
        setIsAutoFilled(true)

        if (autoFilledTimerRef.current)
          clearTimeout(autoFilledTimerRef.current)
        autoFilledTimerRef.current = setTimeout(
          () => setIsAutoFilled(false),
          5000,
        )

        if (populated.length > 0) {
          toast.success("Election details loaded", {
            description: `Populated ${populated.join(", ")} from SOS feed. You can edit any field.`,
          })
        } else {
          toast.success("Election details loaded", {
            description:
              "No new fields were populated (already filled or not available in feed).",
          })
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          if (timedOutRef.current) {
            const message =
              "SOS feed request timed out. The server may be slow or unavailable."
            setMultiRaceCount(null)
            setFetchError(message)
            toast.error("Could not load election details", {
              description: message,
            })
          }
          return
        }

        let message: string
        if (
          error instanceof TypeError &&
          error.message.includes("Failed to fetch") &&
          navigator.onLine
        ) {
          message =
            "SOS feed may be blocked by browser security (CORS). Please fill fields manually."
        } else if (
          error instanceof TypeError &&
          error.message.includes("Failed to fetch")
        ) {
          message = "Network error. Check your connection and try again."
        } else {
          message =
            error instanceof Error
              ? error.message
              : "Failed to fetch SOS feed"
        }

        setMultiRaceCount(null)
        setFetchError(message)
        toast.error("Could not load election details", {
          description: message,
        })
      } finally {
        clearTimeout(timeoutId)
        if (abortControllerRef.current === controller) {
          setIsFetching(false)
        }
      }
    },
    [form],
  )

  // Watch data_source_url with debounce to trigger auto-fill
  useEffect(() => {
    if (!enabled) return

    const subscription = form.watch((value, { name }) => {
      if (name !== "data_source_url") return
      const url = value.data_source_url
      if (!url || !isSosUrl(url)) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
          debounceTimerRef.current = null
        }
        abortControllerRef.current?.abort()
        abortControllerRef.current = null
        setFetchError(null)
        setMultiRaceCount(null)
        setIsFetching(false)
        return
      }

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(() => doFetch(url), debounceMs)
    })

    return () => subscription.unsubscribe()
  }, [form, enabled, doFetch, debounceMs])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      if (autoFilledTimerRef.current)
        clearTimeout(autoFilledTimerRef.current)
    }
  }, [])

  return { isFetching, fetchError, isAutoFilled, selectKey, multiRaceCount }
}
