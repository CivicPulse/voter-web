import { useFieldArray, type Control } from "react-hook-form"
import { X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import type { CandidateLinkType, FilingStatus } from "@/types/candidates"

export interface CandidateFormValues {
  full_name: string
  party: string
  bio: string
  photo_url: string
  ballot_order: string // string for form input, converted to number on submit
  filing_status: FilingStatus
  is_incumbent: boolean
  links: Array<{
    id?: string // present for existing links in edit mode
    link_type: CandidateLinkType
    url: string
    label: string
  }>
}

const LINK_TYPE_OPTIONS: Array<{ value: CandidateLinkType; label: string }> = [
  { value: "website", label: "Website" },
  { value: "campaign", label: "Campaign" },
  { value: "facebook", label: "Facebook" },
  { value: "twitter", label: "Twitter" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "other", label: "Other" },
]

interface AdminCandidateLinkFormProps {
  control: Control<CandidateFormValues>
}

export function AdminCandidateLinkForm({
  control,
}: AdminCandidateLinkFormProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "links",
  })

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Links</h4>

      {fields.map((field, index) => (
        <div key={field.id} className="flex items-start gap-2">
          <FormField
            control={control}
            name={`links.${index}.link_type`}
            render={({ field: linkTypeField }) => (
              <FormItem className="w-36 shrink-0">
                <Select
                  onValueChange={linkTypeField.onChange}
                  value={linkTypeField.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LINK_TYPE_OPTIONS.map((option) => (
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
            control={control}
            name={`links.${index}.url`}
            render={({ field: urlField }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder="https://..." {...urlField} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`links.${index}.label`}
            render={({ field: labelField }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input placeholder="Link label" {...labelField} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 mt-0.5"
            onClick={() => remove(index)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove link</span>
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ link_type: "website", url: "", label: "" })}
      >
        <Plus className="mr-1 h-4 w-4" />
        Add Link
      </Button>
    </div>
  )
}
