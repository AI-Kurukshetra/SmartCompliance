import type { ScreeningStatus, WatchlistProvider } from "@/modules/watchlist/types";

type ScreeningComputationInput = {
  provider: WatchlistProvider;
  fullName: string;
};

type ScreeningComputationResult = {
  status: ScreeningStatus;
  score: number;
  details: Record<string, unknown>;
};

function hashName(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 1000;
  }

  return hash;
}

export function runProviderPlaceholder(
  input: ScreeningComputationInput,
): ScreeningComputationResult {
  const normalizedName = input.fullName.trim().toUpperCase();
  const nameHash = hashName(`${input.provider}:${normalizedName}`);
  const score = Number((30 + (nameHash % 70)).toFixed(2));

  let status: ScreeningStatus = "clear";

  if (score >= 88) {
    status = "confirmed_match";
  } else if (score >= 74) {
    status = "possible_match";
  } else if (score >= 68) {
    status = "manual_review";
  }

  return {
    status,
    score,
    details: {
      provider_engine: "watchlist_placeholder_v1",
      evaluated_name: normalizedName,
      hash_signal: nameHash,
      reviewed_at: new Date().toISOString(),
      result_explanation:
        status === "clear"
          ? "No strong watchlist signal detected."
          : "Potential watchlist signal detected by placeholder provider logic.",
    },
  };
}
