export type CaseCreateFormValues = Partial<
  Record<"verificationSessionId" | "assignedTo" | "priority" | "notes", string>
>;

export type CaseUpdateFormValues = Partial<
  Record<
    | "caseId"
    | "status"
    | "resolutionDecision"
    | "assignedTo"
    | "notes"
    | "requestAdditionalDocuments",
    string
  >
>;

export type CaseFormState<TValues> = {
  error: string | null;
  values: TValues;
};

export const INITIAL_CASE_CREATE_FORM_STATE: CaseFormState<CaseCreateFormValues> = {
  error: null,
  values: {},
};

export const INITIAL_CASE_UPDATE_FORM_STATE: CaseFormState<CaseUpdateFormValues> = {
  error: null,
  values: {},
};
