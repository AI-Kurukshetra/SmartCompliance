import { z } from "zod";
import { CUSTOMER_RISK_LEVELS } from "@/modules/customers/types";

function optionalString<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((value) => {
    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, schema.optional());
}

export const customerFiltersSchema = z.object({
  q: optionalString(z.string().max(100)),
  risk: optionalString(z.enum(CUSTOMER_RISK_LEVELS)),
});

export const createCustomerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(100),
  lastName: z.string().trim().min(1, "Last name is required.").max(100),
  email: optionalString(z.string().email("Enter a valid email address.")),
  phone: optionalString(z.string().max(32, "Phone number is too long.")),
  dateOfBirth: optionalString(
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD date format."),
  ),
  countryCode: optionalString(
    z
      .string()
      .regex(/^[a-zA-Z]{2}$/, "Use a two-letter country code.")
      .transform((value) => value.toUpperCase()),
  ),
  riskLevel: z.enum(CUSTOMER_RISK_LEVELS).default("low"),
});

export const updateCustomerSchema = createCustomerSchema.extend({
  customerId: z.string().uuid("Select a valid customer."),
});
