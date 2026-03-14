export type TransactionFormValues = Partial<
  Record<
    "customerId" | "amount" | "currency" | "transactionType" | "counterpartyCountry",
    string
  >
>;

export type AlertUpdateFormValues = Partial<Record<"alertId" | "status", string>>;

export type TransactionFormState<TValues> = {
  error: string | null;
  values: TValues;
};

export const INITIAL_TRANSACTION_FORM_STATE: TransactionFormState<TransactionFormValues> =
  {
    error: null,
    values: {},
  };

export const INITIAL_ALERT_UPDATE_FORM_STATE: TransactionFormState<AlertUpdateFormValues> =
  {
    error: null,
    values: {},
  };
