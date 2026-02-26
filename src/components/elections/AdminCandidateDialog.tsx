import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { HTTPError } from "ky"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useCreateCandidate,
  useUpdateCandidate,
  useCreateCandidateLink,
  useDeleteCandidateLink,
} from "@/lib/hooks/use-admin-candidates"
import {
  AdminCandidateLinkForm,
  type CandidateFormValues,
} from "@/components/elections/AdminCandidateLinkForm"
import type { CandidateDetail } from "@/types/candidates"

const candidateSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(200, "Name too long"),
  party: z.string(),
  bio: z.string(),
  photo_url: z
    .string()
    .refine(
      (v) => !v || z.string().url().safeParse(v).success,
      "Invalid URL",
    ),
  ballot_order: z.string(),
  filing_status: z.enum(["qualified", "withdrawn", "disqualified", "write_in"]),
  is_incumbent: z.boolean(),
  links: z.array(
    z.object({
      id: z.string().optional(),
      link_type: z.enum([
        "website",
        "campaign",
        "facebook",
        "twitter",
        "instagram",
        "youtube",
        "linkedin",
        "other",
      ]),
      url: z.string().url("Invalid URL"),
      label: z.string().min(1, "Label required"),
    }),
  ),
})

const FILING_STATUS_OPTIONS = [
  { value: "qualified", label: "Qualified" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "disqualified", label: "Disqualified" },
  { value: "write_in", label: "Write-In" },
] as const

interface AdminCandidateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  electionId: string
  candidate?: CandidateDetail
}

function buildDefaultValues(candidate?: CandidateDetail): CandidateFormValues {
  if (!candidate) {
    return {
      full_name: "",
      party: "",
      bio: "",
      photo_url: "",
      ballot_order: "",
      filing_status: "qualified",
      is_incumbent: false,
      links: [],
    }
  }

  return {
    full_name: candidate.full_name,
    party: candidate.party ?? "",
    bio: candidate.bio ?? "",
    photo_url: candidate.photo_url ?? "",
    ballot_order:
      candidate.ballot_order !== null ? String(candidate.ballot_order) : "",
    filing_status: candidate.filing_status,
    is_incumbent: candidate.is_incumbent,
    links: candidate.links.map((link) => ({
      id: link.id,
      link_type: link.link_type,
      url: link.url,
      label: link.label,
    })),
  }
}

export function AdminCandidateDialog({
  open,
  onOpenChange,
  mode,
  electionId,
  candidate,
}: AdminCandidateDialogProps) {
  const createCandidate = useCreateCandidate()
  const updateCandidate = useUpdateCandidate()
  const createLink = useCreateCandidateLink()
  const deleteLink = useDeleteCandidateLink()

  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateSchema),
    defaultValues: buildDefaultValues(candidate),
  })

  // Reset form when candidate changes or dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset(buildDefaultValues(candidate))
    }
  }, [open, candidate, form])

  const isPending =
    createCandidate.isPending ||
    updateCandidate.isPending ||
    createLink.isPending ||
    deleteLink.isPending

  async function handleSubmit(values: CandidateFormValues) {
    const ballotOrder = values.ballot_order
      ? Number(values.ballot_order)
      : null

    try {
      if (mode === "create") {
        await createCandidate.mutateAsync({
          electionId,
          data: {
            full_name: values.full_name,
            party: values.party || null,
            bio: values.bio || null,
            photo_url: values.photo_url || null,
            ballot_order: ballotOrder,
            filing_status: values.filing_status,
            is_incumbent: values.is_incumbent,
            links: values.links.map((link) => ({
              link_type: link.link_type,
              url: link.url,
              label: link.label,
            })),
          },
        })
        onOpenChange(false)
      } else if (mode === "edit" && candidate) {
        // Update the candidate fields
        await updateCandidate.mutateAsync({
          candidateId: candidate.id,
          electionId,
          data: {
            full_name: values.full_name,
            party: values.party || null,
            bio: values.bio || null,
            photo_url: values.photo_url || null,
            ballot_order: ballotOrder,
            filing_status: values.filing_status,
            is_incumbent: values.is_incumbent,
          },
        })

        // Diff links: determine additions and removals
        const existingLinkIds = new Set(
          candidate.links.map((link) => link.id),
        )
        const formLinkIds = new Set(
          values.links.filter((link) => link.id).map((link) => link.id!),
        )

        // Delete removed links
        const removedLinkIds = [...existingLinkIds].filter(
          (id) => !formLinkIds.has(id),
        )
        await Promise.all(
          removedLinkIds.map((linkId) =>
            deleteLink.mutateAsync({
              candidateId: candidate.id,
              linkId,
            }),
          ),
        )

        // Create new links (those without an id)
        const newLinks = values.links.filter((link) => !link.id)
        await Promise.all(
          newLinks.map((link) =>
            createLink.mutateAsync({
              candidateId: candidate.id,
              data: {
                link_type: link.link_type,
                url: link.url,
                label: link.label,
              },
            }),
          ),
        )

        onOpenChange(false)
      }
    } catch (error: unknown) {
      if (error instanceof HTTPError && error.response.status === 409) {
        form.setError("full_name", {
          message: "A candidate with this name already exists",
        })
      }
      // Other errors are handled by the mutation hooks via toast
    }
  }

  const dialogTitle =
    mode === "create" ? "Add Candidate" : "Edit Candidate"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Full Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Candidate full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="party"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Party</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Democratic, Republican" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="filing_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Filing Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FILING_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ballot_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ballot Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Position on ballot"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_incumbent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Incumbent</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="photo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biography</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Candidate biography..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AdminCandidateLinkForm control={form.control} />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mode === "create" ? "Add Candidate" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
