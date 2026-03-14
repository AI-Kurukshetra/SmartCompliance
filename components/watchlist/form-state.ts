export type WatchlistFormValues = Partial<
  Record<"verificationSessionId" | "provider", string>
>;

export type WatchlistFormState = {
  error: string | null;
  values: WatchlistFormValues;
};

export const INITIAL_WATCHLIST_FORM_STATE: WatchlistFormState = {
  error: null,
  values: {},
};
