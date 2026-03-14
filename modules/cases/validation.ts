import { z } from "zod";
import {
  CASE_DECISIONS,
  CASE_PRIORITIES,
  CASE_STATUSES,
} from "@/modules/cases/types";

function optionalString<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((value) => {
    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, schema.optional());
}

export const caseFiltersSchema = z.object({
  q: optionalString(z.string().max(120)),
  status: optionalString(z.enum(CASE_STATUSES)),
  priority: optionalString(z.enum(CASE_PRIORITIES)),
  assignedTo: optionalString(z.string().uuid("assignedTo must be a valid UUID.")),
});

export const createCaseSchema = z.object({
  verificationSessionId: optionalString(
    z.string().uuid("Select a valid verification session."),
  ),
  assignedTo: optionalString(z.string().uuid("Select a valid assignee.")),
  priority: z.enum(CASE_PRIORITIES).default("medium"),
  notes: optionalString(z.string().max(2000, "Notes are too long.")),
});

export const updateCaseSchema = z
  .object({
    status: z.enum(CASE_STATUSES).optional(),
    resolutionDecision: z.enum(CASE_DECISIONS).optional(),
    assignedTo: z.preprocess((value) => {
      if (value === null) {
        return null;
      }

      if (typeof value !== "string") {
        return undefined;
      }

      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }, z.string().uuid().nullable().optional()),
    notes: optionalString(z.string().max(2000, "Notes are too long.")),
  })
  .refine(
    (value) =>
      value.status !== undefined ||
      value.resolutionDecision !== undefined ||
      value.assignedTo !== undefined ||
      value.notes !== undefined,
    {
      message: "Provide at least one case field to update.",
    },
  );
