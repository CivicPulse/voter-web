import { z } from "zod"

export const createElectionSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(200, "Name must not exceed 200 characters"),
  election_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a valid date (YYYY-MM-DD)"),
  election_type: z.enum(["general", "primary", "special", "runoff"], {
    message: "Please select an election type",
  }),
  district: z
    .string()
    .min(1, "District is required")
    .max(200, "District must not exceed 200 characters"),
  data_source_url: z.union([z.string().url(), z.literal("")]).optional(),
  refresh_interval_seconds: z
    .number()
    .int("Must be a whole number")
    .min(60, "Minimum refresh interval is 60 seconds"),
  boundary_id: z.string().uuid().optional(),
})

export type ElectionFormValues = z.infer<typeof createElectionSchema>

export const feedImportSchema = z.object({
  data_source_url: z.string().url("Must be a valid URL"),
  election_type: z.enum(["general", "primary", "special", "runoff"], {
    message: "Please select an election type",
  }),
  refresh_interval_seconds: z
    .number()
    .int("Must be a whole number")
    .min(60, "Minimum refresh interval is 60 seconds"),
  auto_refresh: z.boolean(),
})

export type FeedImportFormValues = z.infer<typeof feedImportSchema>
