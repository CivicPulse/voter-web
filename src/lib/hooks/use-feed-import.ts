import { useMutation, useQueryClient } from "@tanstack/react-query"
import { previewFeedImport, importFeed } from "@/lib/api/elections"
import type { FeedImportRequest } from "@/types/elections"
import { AuthenticationError, PermissionError } from "@/types/admin"
import { HTTPError } from "ky"
import { toast } from "sonner"

/**
 * Hook to preview races from an SOS feed URL.
 * Read-only operation — does not invalidate any queries.
 */
export function usePreviewFeedImport() {
  return useMutation({
    mutationFn: (data: FeedImportRequest) => previewFeedImport(data),
    onError: (error: Error) => {
      if (error instanceof AuthenticationError) {
        toast.error("Session expired", { description: error.message })
      } else if (error instanceof PermissionError) {
        toast.error("Access denied", { description: error.message })
      } else if (error instanceof HTTPError && error.response.status === 422) {
        toast.error("Invalid feed", {
          description:
            "The URL does not point to a valid SOS election feed.",
        })
      } else if (error instanceof HTTPError && error.response.status === 502) {
        toast.error("Feed unavailable", {
          description:
            "Could not fetch data from the SOS feed URL. The server may be down.",
        })
      } else {
        toast.error("Failed to preview feed", {
          description:
            error.message || "An error occurred while previewing the feed.",
        })
      }
    },
  })
}

/**
 * Hook to import all races from an SOS feed URL.
 * Invalidates election list queries on success.
 */
export function useImportFeed() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: FeedImportRequest) => importFeed(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "elections"] })
      queryClient.invalidateQueries({ queryKey: ["elections"] })

      if (data.elections_created > 0) {
        toast.success(`Imported ${data.elections_created} election(s)`, {
          description:
            data.elections_skipped > 0
              ? `${data.elections_skipped} race(s) skipped (already exist).`
              : "All races imported successfully.",
        })
      } else {
        toast.info("No new elections imported", {
          description: "All races in this feed already exist.",
        })
      }
    },
    onError: (error: Error) => {
      if (error instanceof AuthenticationError) {
        toast.error("Session expired", { description: error.message })
      } else if (error instanceof PermissionError) {
        toast.error("Access denied", { description: error.message })
      } else if (error instanceof HTTPError && error.response.status === 400) {
        toast.error("Empty feed", {
          description: "The SOS feed contains no races to import.",
        })
      } else if (error instanceof HTTPError && error.response.status === 502) {
        toast.error("Feed unavailable", {
          description: "Could not fetch data from the SOS feed URL.",
        })
      } else {
        toast.error("Failed to import feed", {
          description:
            error.message || "An error occurred during import.",
        })
      }
    },
  })
}
