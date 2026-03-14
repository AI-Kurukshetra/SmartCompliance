export const WATCHLIST_PROVIDERS = [
  "ofac_placeholder",
  "pep_placeholder",
  "sanctions_placeholder",
] as const;

export const SCREENING_STATUSES = [
  "clear",
  "possible_match",
  "confirmed_match",
  "manual_review",
] as const;

export type WatchlistProvider = (typeof WATCHLIST_PROVIDERS)[number];
export type ScreeningStatus = (typeof SCREENING_STATUSES)[number];

export type WatchlistResultRecord = {
  id: string;
  verificationSessionId: string;
  provider: WatchlistProvider;
  status: ScreeningStatus;
  matchScore: number | null;
  matchDetails: Record<string, unknown>;
  createdAt: string;
};

export type WatchlistFilters = {
  verificationSessionId?: string;
  provider?: WatchlistProvider;
};

export type RunScreeningInput = {
  verificationSessionId: string;
  provider: WatchlistProvider;
};
