"use client";

import { useActionState } from "react";
import { runRiskDecisionAction } from "@/app/actions/risk";
import { AuthSubmitButton } from "@/components/auth/submit-button";
import { INITIAL_RISK_FORM_STATE } from "@/components/risk/form-state";

type RunDecisionFormProps = {
  disabled?: boolean;
  sessions: Array<{
    id: string;
    label: string;
  }>;
};

const inputClassName =
  "field-input";

export function RunDecisionForm({
  disabled = false,
  sessions,
}: RunDecisionFormProps) {
  const [state, formAction] = useActionState(
    runRiskDecisionAction,
    INITIAL_RISK_FORM_STATE,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium text-ink">
        <span>Verification session</span>
        <select
          name="verificationSessionId"
          defaultValue={state.values.verificationSessionId ?? ""}
          disabled={disabled}
          className={inputClassName}
          required
        >
          <option value="">Select session</option>
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.label}
            </option>
          ))}
        </select>
      </label>
      {state.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}
      <AuthSubmitButton
        disabled={disabled || sessions.length === 0}
        idleLabel="Run decision engine"
        pendingLabel="Scoring..."
      />
    </form>
  );
}

