export type ReportFormValues = Partial<Record<"reportType" | "daysBack", string>>;

export type ReportFormState = {
  error: string | null;
  values: ReportFormValues;
};

export const INITIAL_REPORT_FORM_STATE: ReportFormState = {
  error: null,
  values: {},
};
