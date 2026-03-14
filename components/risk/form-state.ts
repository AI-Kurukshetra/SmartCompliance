export type RiskFormValues = Partial<Record<"verificationSessionId", string>>;

export type RiskFormState = {
  error: string | null;
  values: RiskFormValues;
};

export const INITIAL_RISK_FORM_STATE: RiskFormState = {
  error: null,
  values: {},
};
