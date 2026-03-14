import { z } from "zod";
import {
  ALERT_SEVERITIES,
  ALERT_STATUSES,
  TRANSACTION_STATUSES,
} from "@/modules/transactions/types";

function optionalString<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((value) => {
    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, schema.optional());
}

const currencySchema = z
  .string()
  .trim()
  .min(3, "Currency is required.")
  .max(3, "Currency must be a 3-letter code.")
  .transform((value) => value.toUpperCase());

const countryCodeSchema = z
  .string()
  .trim()
  .min(2, "Country must be a 2-letter code.")
  .max(2, "Country must be a 2-letter code.")
  .transform((value) => value.toUpperCase());

export const transactionFiltersSchema = z.object({
  status: optionalString(z.enum(TRANSACTION_STATUSES)),
  customerId: optionalString(z.string().uuid("customerId must be a valid UUID.")),
  q: optionalString(z.string().max(120)),
});

export const alertFiltersSchema = z.object({
  status: optionalString(z.enum(ALERT_STATUSES)),
  severity: optionalString(z.enum(ALERT_SEVERITIES)),
  customerId: optionalString(z.string().uuid("customerId must be a valid UUID.")),
});

export const ingestTransactionSchema = z.object({
  customerId: z.string().uuid("Select a valid customer."),
  amount: z.coerce.number().positive("Amount must be greater than zero."),
  currency: currencySchema,
  transactionType: z
    .string()
    .trim()
    .min(2, "Transaction type is required.")
    .max(120, "Transaction type is too long."),
  counterpartyCountry: optionalString(countryCodeSchema),
  metadata: z.record(z.unknown()).optional(),
});

export const updateAlertStatusSchema = z.object({
  status: z.enum(ALERT_STATUSES),
});
