import { z } from "zod";
import { RULE_DECISION_ACTIONS } from "@/modules/rules/types";
import { SCREENING_STATUSES } from "@/modules/watchlist/types";

function optionalString<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((value) => {
    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, schema.optional());
}

function optionalNumber(min: number, max: number) {
  return z.preprocess((value) => {
    if (typeof value === "number") {
      return value;
    }

    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }, z.number().min(min).max(max).optional());
}

const booleanFieldSchema = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "on" || normalized === "1";
}, z.boolean());

const watchlistStatusesCsvSchema = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return Array.from(
    new Set(
      trimmed
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
  );
}, z.array(z.enum(SCREENING_STATUSES)).optional());

const ruleConditionSchema = z
  .object({
    watchlistStatusIn: watchlistStatusesCsvSchema,
    missingDocuments: booleanFieldSchema.default(false),
    minDocumentConfidence: optionalNumber(0, 100),
    maxDocumentConfidence: optionalNumber(0, 100),
  })
  .refine(
    (value) =>
      value.minDocumentConfidence === undefined ||
      value.maxDocumentConfidence === undefined ||
      value.minDocumentConfidence <= value.maxDocumentConfidence,
    {
      message: "Min confidence cannot be higher than max confidence.",
      path: ["maxDocumentConfidence"],
    },
  );

export const createRuleSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Rule name must be at least 2 characters.")
      .max(120, "Rule name is too long."),
    description: optionalString(z.string().max(1000, "Description is too long.")),
    score: z.coerce
      .number()
      .int("Score must be a whole number.")
      .min(-100, "Score must be between -100 and 100.")
      .max(100, "Score must be between -100 and 100."),
    decisionAction: optionalString(z.enum(RULE_DECISION_ACTIONS)),
    enabled: booleanFieldSchema.default(true),
    watchlistStatusIn: watchlistStatusesCsvSchema,
    missingDocuments: booleanFieldSchema.default(false),
    minDocumentConfidence: optionalNumber(0, 100),
    maxDocumentConfidence: optionalNumber(0, 100),
  })
  .refine(
    (value) =>
      value.minDocumentConfidence === undefined ||
      value.maxDocumentConfidence === undefined ||
      value.minDocumentConfidence <= value.maxDocumentConfidence,
    {
      message: "Min confidence cannot be higher than max confidence.",
      path: ["maxDocumentConfidence"],
    },
  )
  .transform((value) => {
    const condition = ruleConditionSchema.parse({
      watchlistStatusIn: value.watchlistStatusIn,
      missingDocuments: value.missingDocuments,
      minDocumentConfidence: value.minDocumentConfidence,
      maxDocumentConfidence: value.maxDocumentConfidence,
    });

    return {
      name: value.name,
      description: value.description,
      score: value.score,
      decisionAction: value.decisionAction,
      enabled: value.enabled,
      condition,
    };
  });

export const patchRuleSchema = z
  .object({
    name: optionalString(
      z
        .string()
        .min(2, "Rule name must be at least 2 characters.")
        .max(120, "Rule name is too long."),
    ),
    description: optionalString(z.string().max(1000, "Description is too long.")),
    score: z.coerce
      .number()
      .int("Score must be a whole number.")
      .min(-100, "Score must be between -100 and 100.")
      .max(100, "Score must be between -100 and 100.")
      .optional(),
    decisionAction: optionalString(z.enum(RULE_DECISION_ACTIONS)),
    enabled: z
      .preprocess((value) => {
        if (value === undefined || value === null || value === "") {
          return undefined;
        }
        return value;
      }, booleanFieldSchema.optional())
      .optional(),
    watchlistStatusIn: watchlistStatusesCsvSchema,
    missingDocuments: z
      .preprocess((value) => {
        if (value === undefined || value === null || value === "") {
          return undefined;
        }
        return value;
      }, booleanFieldSchema.optional())
      .optional(),
    minDocumentConfidence: optionalNumber(0, 100),
    maxDocumentConfidence: optionalNumber(0, 100),
  })
  .refine(
    (value) =>
      value.minDocumentConfidence === undefined ||
      value.maxDocumentConfidence === undefined ||
      value.minDocumentConfidence <= value.maxDocumentConfidence,
    {
      message: "Min confidence cannot be higher than max confidence.",
      path: ["maxDocumentConfidence"],
    },
  )
  .transform((value) => {
    const condition =
      value.watchlistStatusIn !== undefined ||
      value.missingDocuments !== undefined ||
      value.minDocumentConfidence !== undefined ||
      value.maxDocumentConfidence !== undefined
        ? ruleConditionSchema.parse({
            watchlistStatusIn: value.watchlistStatusIn,
            missingDocuments: value.missingDocuments,
            minDocumentConfidence: value.minDocumentConfidence,
            maxDocumentConfidence: value.maxDocumentConfidence,
          })
        : undefined;

    return {
      name: value.name,
      description: value.description,
      score: value.score,
      decisionAction: value.decisionAction,
      enabled: value.enabled,
      condition,
    };
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.description !== undefined ||
      value.score !== undefined ||
      value.decisionAction !== undefined ||
      value.enabled !== undefined ||
      value.condition !== undefined,
    {
      message: "Provide at least one field to update.",
    },
  );

export const ruleFiltersSchema = z.object({
  q: optionalString(z.string().max(120)),
  enabled: z
    .preprocess((value) => {
      if (value === undefined || value === null || value === "") {
        return undefined;
      }

      if (typeof value === "boolean") {
        return value;
      }

      if (typeof value !== "string") {
        return undefined;
      }

      const normalized = value.trim().toLowerCase();
      if (normalized === "true" || normalized === "1") {
        return true;
      }
      if (normalized === "false" || normalized === "0") {
        return false;
      }
      return undefined;
    }, z.boolean().optional())
    .optional(),
});
