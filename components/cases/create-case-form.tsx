"use client";

import { useActionState } from "react";
import { createCaseAction } from "@/app/actions/cases";
import { AuthSubmitButton } from "@/components/auth/submit-button";
import { INITIAL_CASE_CREATE_FORM_STATE } from "@/components/cases/form-state";
import { CASE_PRIORITIES } from "@/modules/cases/types";

type CreateCaseFormProps = {
  disabled?: boolean;
  verificationSessions: Array<{
    id: string;
    label: string;
  }>;
  officers: Array<{
    id: string;
    label: string;
  }>;
};

const inputClassName =
  "field-input";

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function CreateCaseForm({
  disabled = false,
  verificationSessions,
  officers,
}: CreateCaseFormProps) {
  const [state, formAction] = useActionState(
    createCaseAction,
    INITIAL_CASE_CREATE_FORM_STATE,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium text-ink">
        <span>Verification session (optional)</span>
        <select
          name="verificationSessionId"
          defaultValue={state.values.verificationSessionId ?? ""}
          disabled={disabled}
          className={inputClassName}
        >
          <option value="">Create standalone case</option>
          {verificationSessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.label}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-medium text-ink">
        <span>Assign officer (optional)</span>
        <select
          name="assignedTo"
          defaultValue={state.values.assignedTo ?? ""}
          disabled={disabled}
          className={inputClassName}
        >
          <option value="">Unassigned</option>
          {officers.map((officer) => (
            <option key={officer.id} value={officer.id}>
              {officer.label}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-medium text-ink">
        <span>Priority</span>
        <select
          name="priority"
          defaultValue={state.values.priority ?? "medium"}
          disabled={disabled}
          className={inputClassName}
          required
        >
          {CASE_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {formatLabel(priority)}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-medium text-ink">
        <span>Notes</span>
        <textarea
          name="notes"
          defaultValue={state.values.notes ?? ""}
          disabled={disabled}
          className={`${inputClassName} min-h-24 resize-y`}
          placeholder="Initial reviewer notes..."
          maxLength={2000}
        />
      </label>

      {state.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}

      <AuthSubmitButton
        disabled={disabled}
        idleLabel="Create case"
        pendingLabel="Creating case..."
      />
    </form>
  );
}

