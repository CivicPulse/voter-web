import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  createElectionSchema,
  type ElectionFormValues,
} from "@/lib/schemas/election-form"
import { useSosFeedAutoFill } from "@/lib/hooks/use-sos-feed-autofill"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Link } from "@tanstack/react-router"
import { Loader2, Sparkles, Info } from "lucide-react"
import { BoundarySelector } from "./boundary-selector"

interface ElectionFormProps {
  defaultValues?: Partial<ElectionFormValues>
  onSubmit: (data: ElectionFormValues) => void
  isPending: boolean
  submitLabel?: string
  enableAutoFill?: boolean
  enableBoundarySelector?: boolean
}

export function ElectionForm({
  defaultValues,
  onSubmit,
  isPending,
  submitLabel = "Create Election",
  enableAutoFill = true,
  enableBoundarySelector = true,
}: ElectionFormProps) {
  const form = useForm<ElectionFormValues>({
    resolver: zodResolver(createElectionSchema),
    defaultValues: {
      name: "",
      election_date: "",
      election_type: undefined,
      district: "",
      boundary_id: undefined,
      data_source_url: "",
      refresh_interval_seconds: 120,
      ...defaultValues,
    },
  })

  const { isFetching, fetchError, isAutoFilled, selectKey, multiRaceCount } =
    useSosFeedAutoFill({ form, enabled: enableAutoFill })

  const watchedBoundaryId = useWatch({ control: form.control, name: "boundary_id" })
  const watchedDistrict = useWatch({ control: form.control, name: "district" })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="data_source_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                Data Source URL
                {isFetching && (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="sr-only" aria-live="polite">
                      Fetching election details...
                    </span>
                  </>
                )}
              </FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://results.sos.ga.gov/cdn/results/Georgia/export-..."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter a Georgia SOS results JSON URL to auto-fill election
                details
              </FormDescription>
              {fetchError && (
                <p className="text-sm text-destructive">{fetchError}</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {isAutoFilled && (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              Fields auto-filled from SOS feed. All fields remain editable.
            </AlertDescription>
          </Alert>
        )}

        {multiRaceCount && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This feed contains {multiRaceCount} races. Only the first race was
              used for auto-fill. To import all races at once, use the{" "}
              <Link
                to="/admin/elections/import-feed"
                search={{ url: form.getValues("data_source_url") }}
                className="underline font-medium"
              >
                Feed Import
              </Link>{" "}
              page.
            </AlertDescription>
          </Alert>
        )}

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
                  key={selectKey}
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

        {enableBoundarySelector ? (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">District / Boundary</Label>
            <BoundarySelector
              value={watchedBoundaryId ?? null}
              district={watchedDistrict ?? ""}
              onChange={(boundaryId, districtName) => {
                form.setValue("boundary_id", boundaryId ?? undefined)
                form.setValue("district", districtName)
              }}
            />
            {form.formState.errors.district && (
              <p className="text-sm text-destructive">{form.formState.errors.district.message}</p>
            )}
          </div>
        ) : (
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
        )}

        <FormField
          control={form.control}
          name="refresh_interval_seconds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Refresh Interval (seconds)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={60}
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
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
