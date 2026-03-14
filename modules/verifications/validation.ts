import { z } from "zod";
import { VERIFICATION_STATUSES } from "@/modules/verifications/types";

function optionalString<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((value) => {
    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, schema.optional());
}

export const verificationFiltersSchema = z.object({
  q: optionalString(z.string().max(100)),
  status: optionalString(z.enum(VERIFICATION_STATUSES)),
});

export const createVerificationSessionSchema = z.object({
  customerId: z.string().uuid("Select a valid customer."),
});

export const uploadDocumentPlaceholderSchema = z.object({
  verificationSessionId: z.string().uuid("Select a valid verification session."),
  documentType: z
    .string()
    .trim()
    .min(2, "Document type is required.")
    .max(80, "Document type is too long."),
  fileName: optionalString(z.string().max(160, "File name is too long.")),
  mimeType: optionalString(z.string().max(120, "MIME type is too long.")),
});
