export type VerificationFormValues = Partial<
  Record<
    "customerId" | "verificationSessionId" | "documentType" | "fileName" | "mimeType",
    string
  >
>;

export type VerificationFormState = {
  error: string | null;
  values: VerificationFormValues;
};

export const INITIAL_VERIFICATION_FORM_STATE: VerificationFormState = {
  error: null,
  values: {},
};
