"use client";

import { useActionState } from "react";
import { AuthSubmitButton } from "@/components/auth/submit-button";
import {
  INITIAL_RULE_FORM_STATE,
  type RuleFormState,
  type RuleFormValues,
} from "@/components/rules/form-state";
import { RULE_DECISION_ACTIONS } from "@/modules/rules/types";

type RuleFormProps = {
  action: (state: RuleFormState, formData: FormData) => Promise<RuleFormState>;
  disabled?: boolean;
  initialValues?: RuleFormValues;
  submitIdleLabel: string;
  submitPendingLabel: string;
};

const inputClassName =
  "field-input";

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function RuleForm({
  action,
  disabled = false,
  initialValues = {},
  submitIdleLabel,
  submitPendingLabel,
}: RuleFormProps) {
  const [state, formAction] = useActionState(action, {
    ...INITIAL_RULE_FORM_STATE,
    values: initialValues,
  });
  const values = {
    ...initialValues,
    ...state.values,
  };

  const enabledByDefault =
    values.enabled === undefined ||
    values.enabled === "true" ||
    values.enabled === "on";
  const missingDocumentsByDefault =
    values.missingDocuments === "true" || values.missingDocuments === "on";

  return (
    <form action={formAction} className="space-y-6">
      {values.ruleId ? <input type="hidden" name="ruleId" value={values.ruleId} /> : null}

      <section className="grid gap-4 rounded-[1.4rem] border border-ink/10 bg-white/85 p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Rule details</p>

        <label className="grid gap-2 text-sm font-medium text-ink">
          <span>Rule name</span>
          <input
            name="name"
            required
            defaultValue={values.name ?? ""}
            disabled={disabled}
            className={inputClassName}
            placeholder="Possible match penalty"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-ink">
          <span>Description</span>
          <textarea
            name="description"
            defaultValue={values.description ?? ""}
            disabled={disabled}
            className={`${inputClassName} min-h-20 resize-y`}
            maxLength={1000}
            placeholder="Adds risk when watchlist provider returns possible match."
          />
        </label>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium text-ink">
            <span>Score impact</span>
            <input
              name="score"
              type="number"
              defaultValue={values.score ?? "0"}
              disabled={disabled}
              className={inputClassName}
              min={-100}
              max={100}
              step={1}
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-ink">
            <span>Decision action</span>
            <select
              name="decisionAction"
              defaultValue={values.decisionAction ?? ""}
              disabled={disabled}
              className={inputClassName}
            >
              <option value="">No forced decision</option>
              {RULE_DECISION_ACTIONS.map((decisionAction) => (
                <option key={decisionAction} value={decisionAction}>
                  {formatLabel(decisionAction)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-shell px-4 py-3 text-sm font-medium text-ink">
            <input
              type="checkbox"
              name="enabled"
              value="true"
              defaultChecked={enabledByDefault}
              disabled={disabled}
              className="h-4 w-4 rounded border-ink/30"
            />
            Enabled
          </label>
        </div>
      </section>

      <section className="grid gap-4 rounded-[1.4rem] border border-ink/10 bg-white/85 p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Conditions</p>

        <label className="grid gap-2 text-sm font-medium text-ink">
          <span>Watchlist statuses (comma separated)</span>
          <input
            name="watchlistStatusIn"
            defaultValue={values.watchlistStatusIn ?? ""}
            disabled={disabled}
            className={inputClassName}
            placeholder="possible_match,confirmed_match"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-ink">
            <span>Min document confidence</span>
            <input
              name="minDocumentConfidence"
              type="number"
              defaultValue={values.minDocumentConfidence ?? ""}
              disabled={disabled}
              className={inputClassName}
              min={0}
              max={100}
              step={1}
              placeholder="0-100"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-ink">
            <span>Max document confidence</span>
            <input
              name="maxDocumentConfidence"
              type="number"
              defaultValue={values.maxDocumentConfidence ?? ""}
              disabled={disabled}
              className={inputClassName}
              min={0}
              max={100}
              step={1}
              placeholder="0-100"
            />
          </label>
        </div>

        <label className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-shell px-4 py-3 text-sm font-medium text-ink">
          <input
            type="checkbox"
            name="missingDocuments"
            value="true"
            defaultChecked={missingDocumentsByDefault}
            disabled={disabled}
            className="h-4 w-4 rounded border-ink/30"
          />
          Apply when verification session has no documents
        </label>
      </section>

      {state.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}

      <AuthSubmitButton
        disabled={disabled}
        idleLabel={submitIdleLabel}
        pendingLabel={submitPendingLabel}
      />
    </form>
  );
}

