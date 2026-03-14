export type RuleFormValues = Partial<
  Record<
    | "ruleId"
    | "name"
    | "description"
    | "score"
    | "decisionAction"
    | "enabled"
    | "watchlistStatusIn"
    | "missingDocuments"
    | "minDocumentConfidence"
    | "maxDocumentConfidence",
    string
  >
>;

export type RuleFormState = {
  error: string | null;
  values: RuleFormValues;
};

export const INITIAL_RULE_FORM_STATE: RuleFormState = {
  error: null,
  values: {},
};
