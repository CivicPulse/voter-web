import { useState, useCallback, useRef, useEffect } from "react"
import type { UseFormReturn } from "react-hook-form"
import type { ElectionFormValues } from "@/lib/schemas/election-form"
import { isSosUrl, fetchSosFeed, extractAutoFillData } from "@/api/sos-feed"
import { toast } from "sonner"

/** Fields that can be auto-filled from the SOS feed */
type AutoFillableField = "name" | "election_date" | "election_type" | "district"

interface UseSosFeedAutoFillOptions {
  form: UseFormReturn<ElectionFormValues>
  enabled?: boolean
  debounceMs?: number
}

interface UseSosFeedAutoFillReturn {
  isFetching: boolean
  fetchError: string | null
  isAutoFilled: boolean
  selectKey: number
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

  const initialUrlRef = useRef(form.getValues("data_source_url"))
  const lastFetchedUrlRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoFilledTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userEditedFieldsRef = useRef<Set<AutoFillableField>>(new Set())

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
      abortControllerRef.current = controller

      setIsFetching(true)
      setFetchError(null)

      try {
        const feed = await fetchSosFeed(url, controller.signal)

        if (controller.signal.aborted) return

        const data = extractAutoFillData(feed)
        const edited = userEditedFieldsRef.current

        if (!edited.has("name") && data.name) {
          form.setValue("name", data.name, {
            shouldValidate: true,
            shouldDirty: true,
          })
        }
        if (!edited.has("election_date") && data.election_date) {
          form.setValue("election_date", data.election_date, {
            shouldValidate: true,
            shouldDirty: true,
          })
        }
        if (!edited.has("election_type") && data.election_type) {
          form.setValue("election_type", data.election_type, {
            shouldValidate: true,
            shouldDirty: true,
          })
          setSelectKey((k) => k + 1)
        }
        if (!edited.has("district") && data.district) {
          form.setValue("district", data.district, {
            shouldValidate: true,
            shouldDirty: true,
          })
        }

        lastFetchedUrlRef.current = url
        setIsAutoFilled(true)

        if (autoFilledTimerRef.current)
          clearTimeout(autoFilledTimerRef.current)
        autoFilledTimerRef.current = setTimeout(
          () => setIsAutoFilled(false),
          5000,
        )

        toast.success("Election details loaded", {
          description:
            "Fields populated from SOS feed. You can edit any field.",
        })
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return

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

        setFetchError(message)
        toast.error("Could not load election details", {
          description: message,
        })
      } finally {
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
      if (!url || !isSosUrl(url)) return

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

  return { isFetching, fetchError, isAutoFilled, selectKey }
}
