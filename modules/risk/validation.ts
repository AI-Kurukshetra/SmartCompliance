import { z } from "zod";

export const runRiskDecisionSchema = z.object({
  verificationSessionId: z.string().uuid("Select a valid verification session."),
});

export const riskProfileFiltersSchema = z.object({
  verificationSessionId: z
    .string()
    .uuid()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
