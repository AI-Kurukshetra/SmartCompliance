import { z } from "zod";
import { WATCHLIST_PROVIDERS } from "@/modules/watchlist/types";

function optionalString<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((value) => {
    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }, schema.optional());
}

export const watchlistFiltersSchema = z.object({
  verificationSessionId: optionalString(z.string().uuid()),
  provider: optionalString(z.enum(WATCHLIST_PROVIDERS)),
});

export const runWatchlistScreeningSchema = z.object({
  verificationSessionId: z.string().uuid("Select a valid verification session."),
  provider: z.enum(WATCHLIST_PROVIDERS, {
    errorMap: () => ({
      message: "Select a valid watchlist provider.",
    }),
  }),
});
