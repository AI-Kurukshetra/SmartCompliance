export type AuthFormValues = Partial<
  Record<"tenantName" | "tenantSlug" | "fullName" | "email", string>
>;

export type AuthFormState = {
  error: string | null;
  values: AuthFormValues;
};

export const INITIAL_AUTH_FORM_STATE: AuthFormState = {
  error: null,
  values: {},
};
