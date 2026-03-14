import { z } from "zod";
import {
  REPORT_EXPORT_FORMATS,
  REPORT_STATUSES,
  REPORT_TYPES,
} from "@/modules/reports/types";

function optionalString<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((value) => {
    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, schema.optional());
}

export const reportFiltersSchema = z.object({
  reportType: optionalString(z.enum(REPORT_TYPES)),
  status: optionalString(z.enum(REPORT_STATUSES)),
});

export const generateReportSchema = z.object({
  reportType: z.enum(REPORT_TYPES),
  daysBack: z.coerce
    .number()
    .int()
    .min(1, "daysBack must be at least 1.")
    .max(365, "daysBack cannot exceed 365.")
    .optional(),
});

export const exportReportSchema = z.object({
  format: z.enum(REPORT_EXPORT_FORMATS).default("csv"),
});
