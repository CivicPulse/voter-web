import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  createElectionSchema,
  type ElectionFormValues,
} from "@/lib/schemas/election-form"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ElectionFormProps {
  defaultValues?: Partial<ElectionFormValues>
  onSubmit: (data: ElectionFormValues) => void
  isPending: boolean
  submitLabel?: string
}

export function ElectionForm({
  defaultValues,
  onSubmit,
  isPending,
  submitLabel = "Create Election",
}: ElectionFormProps) {
  const form = useForm<ElectionFormValues>({
    resolver: zodResolver(createElectionSchema),
    defaultValues: {
      name: "",
      election_date: "",
      election_type: undefined,
      district: "",
      data_source_url: "",
      refresh_interval_seconds: 120,
      ...defaultValues,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Election Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="State Senate District 18 Special"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The name of this race/contest
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="election_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Election Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="election_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Election Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="special">Special</SelectItem>
                    <SelectItem value="runoff">Runoff</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="district"
          render={({ field }) => (
            <FormItem>
              <FormLabel>District</FormLabel>
              <FormControl>
                <Input
                  placeholder="State Senate - District 18"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The district or scope of this race
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="data_source_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data Source URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://results.sos.ga.gov/api/..."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                URL for the election results data source
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="refresh_interval_seconds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Refresh Interval (seconds)</FormLabel>
              <FormControl>
                <Input type="number" min={60} {...field} />
              </FormControl>
              <FormDescription>
                How often to poll the data source (minimum 60 seconds)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </form>
    </Form>
  )
}
