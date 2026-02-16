import { useState } from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  feedImportSchema,
  type FeedImportFormValues,
} from "@/lib/schemas/election-form"
import {
  usePreviewFeedImport,
  useImportFeed,
} from "@/lib/hooks/use-feed-import"
import type {
  FeedImportPreviewResponse,
  FeedImportResponse,
} from "@/types/elections"
import { AdminErrorBoundary } from "@/components/admin-error-boundary"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  Loader2,
  Search,
  Download,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react"

const importFeedSearchSchema = z.object({
  url: z.string().optional().catch(""),
})

export const Route = createFileRoute("/admin/elections/import-feed")({
  component: () => (
    <AdminErrorBoundary>
      <AdminImportFeedPage />
    </AdminErrorBoundary>
  ),
  validateSearch: importFeedSearchSchema,
})

type WizardStep = "configure" | "preview" | "results"

const STEP_LABELS: Record<WizardStep, { number: number; label: string }> = {
  configure: { number: 1, label: "Configure" },
  preview: { number: 2, label: "Preview Races" },
  results: { number: 3, label: "Results" },
}

const STEPS: WizardStep[] = ["configure", "preview", "results"]

function StepIndicator({ currentStep }: { currentStep: WizardStep }) {
  const currentIndex = STEPS.indexOf(currentStep)

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex
        const { number, label } = STEP_LABELS[step]

        return (
          <div key={step} className="flex items-center gap-2">
            {index > 0 && (
              <div
                className={`h-px w-8 ${isCompleted ? "bg-primary" : "bg-border"}`}
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                      ? "border-2 border-primary text-primary"
                      : "border border-border text-muted-foreground"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  number
                )}
              </div>
              <span
                className={`text-sm ${isCurrent ? "font-medium" : "text-muted-foreground"}`}
              >
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AdminImportFeedPage() {
  const navigate = useNavigate()
  const { url } = Route.useSearch()

  const [step, setStep] = useState<WizardStep>("configure")
  const [formData, setFormData] = useState<FeedImportFormValues | null>(null)
  const [previewData, setPreviewData] =
    useState<FeedImportPreviewResponse | null>(null)
  const [importResult, setImportResult] = useState<FeedImportResponse | null>(
    null,
  )

  const previewMutation = usePreviewFeedImport()
  const importMutation = useImportFeed()

  const form = useForm<FeedImportFormValues>({
    resolver: zodResolver(feedImportSchema),
    defaultValues: {
      data_source_url: url || "",
      election_type: undefined,
      refresh_interval_seconds: 120,
      auto_refresh: true,
    },
  })

  const handlePreview = (data: FeedImportFormValues) => {
    setFormData(data)
    previewMutation.mutate(
      {
        data_source_url: data.data_source_url,
        election_type: data.election_type,
        refresh_interval_seconds: data.refresh_interval_seconds,
        auto_refresh: data.auto_refresh,
      },
      {
        onSuccess: (preview) => {
          setPreviewData(preview)
          setStep("preview")
        },
      },
    )
  }

  const handleImport = () => {
    if (!formData) return
    importMutation.mutate(
      {
        data_source_url: formData.data_source_url,
        election_type: formData.election_type,
        refresh_interval_seconds: formData.refresh_interval_seconds,
        auto_refresh: formData.auto_refresh,
      },
      {
        onSuccess: (result) => {
          setImportResult(result)
          setStep("results")
        },
      },
    )
  }

  const handleReset = () => {
    setStep("configure")
    setFormData(null)
    setPreviewData(null)
    setImportResult(null)
    previewMutation.reset()
    importMutation.reset()
    form.reset({
      data_source_url: "",
      election_type: undefined,
      refresh_interval_seconds: 120,
      auto_refresh: true,
    })
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/admin/elections" })}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Elections
        </Button>
        <h1 className="text-3xl font-bold mb-2">Import Feed</h1>
        <p className="text-muted-foreground">
          Import multiple races from a Georgia SOS election feed
        </p>
      </div>

      <StepIndicator currentStep={step} />

      {step === "configure" && (
        <Card>
          <CardHeader>
            <CardTitle>Feed Configuration</CardTitle>
            <CardDescription>
              Enter the SOS feed URL and configure import settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handlePreview)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="data_source_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Source URL</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://results.sos.ga.gov/cdn/results/Georgia/export-..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Georgia SOS results JSON URL containing one or more
                        races
                      </FormDescription>
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
                      <FormDescription>
                        Applied to all imported elections
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

                <FormField
                  control={form.control}
                  name="auto_refresh"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Auto-refresh after import</FormLabel>
                        <FormDescription>
                          Perform an initial data refresh for each imported
                          election
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={previewMutation.isPending}
                >
                  {previewMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Fetching Races...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Preview Races
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {step === "preview" && previewData && (
        <Card>
          <CardHeader>
            <CardTitle>{previewData.election_name}</CardTitle>
            <CardDescription>
              {new Date(
                previewData.election_date + "T00:00:00",
              ).toLocaleDateString()}{" "}
              · {previewData.total_races} race(s) found
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Race Name</TableHead>
                    <TableHead>Ballot Item ID</TableHead>
                    <TableHead className="text-right">Candidates</TableHead>
                    <TableHead className="text-right">Precincts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.races.map((race) => (
                    <TableRow key={race.ballot_item_id}>
                      <TableCell className="font-medium">
                        {race.name}
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                          {race.ballot_item_id}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        {race.candidate_count}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {race.statewide_precincts_reporting != null &&
                        race.statewide_precincts_participating != null
                          ? `${race.statewide_precincts_reporting}/${race.statewide_precincts_participating}`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("configure")}
                disabled={importMutation.isPending}
              >
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={
                  importMutation.isPending || previewData.total_races === 0
                }
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Import All {previewData.total_races} Race(s)
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "results" && importResult && (
        <Card>
          <CardHeader>
            <CardTitle>Import Complete</CardTitle>
            <CardDescription>
              {importResult.elections_created} election(s) created
              {importResult.elections_skipped > 0 &&
                `, ${importResult.elections_skipped} skipped (already exist)`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {importResult.elections.length > 0 && (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Election Name</TableHead>
                      <TableHead>Ballot Item ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-center">Refreshed</TableHead>
                      <TableHead className="text-right">Precincts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importResult.elections.map((election) => (
                      <TableRow key={election.election_id}>
                        <TableCell className="font-medium">
                          <Link
                            to="/admin/elections/$electionId"
                            params={{ electionId: election.election_id }}
                            className="hover:underline inline-flex items-center gap-1"
                          >
                            {election.name}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </TableCell>
                        <TableCell>
                          <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                            {election.ballot_item_id}
                          </code>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(
                            election.election_date + "T00:00:00",
                          ).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-center">
                          {election.refreshed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-500 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {election.precincts_reporting != null &&
                          election.precincts_participating != null
                            ? `${election.precincts_reporting}/${election.precincts_participating}`
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleReset}>
                Import Another Feed
              </Button>
              <Button asChild>
                <Link to="/admin/elections">Back to Elections</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
