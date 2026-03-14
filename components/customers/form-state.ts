export type CustomerFormValues = Partial<
  Record<
    | "customerId"
    | "firstName"
    | "lastName"
    | "email"
    | "phone"
    | "dateOfBirth"
    | "countryCode"
    | "riskLevel",
    string
  >
>;

export type CustomerFormState = {
  error: string | null;
  values: CustomerFormValues;
};

export const INITIAL_CUSTOMER_FORM_STATE: CustomerFormState = {
  error: null,
  values: {},
};
