"use client";

import { useActionState } from "react";
import { updateCaseAction } from "@/app/actions/cases";
import { AuthSubmitButton } from "@/components/auth/submit-button";
import { INITIAL_CASE_UPDATE_FORM_STATE } from "@/components/cases/form-state";
import {
  CASE_DECISIONS,
  CASE_STATUSES,
  type CaseRecord,
} from "@/modules/cases/types";

type UpdateCaseFormProps = {
  disabled?: boolean;
  cases: Array<Pick<CaseRecord, "id" | "customerName" | "status" | "priority">>;
  officers: Array<{
    id: string;
    label: string;
  }>;
};

const inputClassName =
  "w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 text-sm text-ink shadow-[0_1px_0_rgba(9,24,43,0.03)] outline-none transition placeholder:text-ink/35 focus:border-ink/40 focus:ring-2 focus:ring-ink/10";

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function UpdateCaseForm({
  disabled = false,
  cases,
  officers,
}: UpdateCaseFormProps) {
  const [state, formAction] = useActionState(
    updateCaseAction,
    INITIAL_CASE_UPDATE_FORM_STATE,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium text-ink">
        <span>Case</span>
        <select
          name="caseId"
          defaultValue={state.values.caseId ?? ""}
          disabled={disabled}
          className={inputClassName}
          required
        >
          <option value="">Select case</option>
          {cases.map((caseRecord) => (
            <option key={caseRecord.id} value={caseRecord.id}>
              {caseRecord.customerName} • {formatLabel(caseRecord.status)} •{" "}
              {formatLabel(caseRecord.priority)}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-medium text-ink">
        <span>Status</span>
        <select
          name="status"
          defaultValue={state.values.status ?? ""}
          disabled={disabled}
          className={inputClassName}
        >
          <option value="">No status change</option>
          {CASE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {formatLabel(status)}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-medium text-ink">
        <span>Decision</span>
        <select
          name="resolutionDecision"
          defaultValue={state.values.resolutionDecision ?? ""}
          disabled={disabled}
          className={inputClassName}
        >
          <option value="">No decision</option>
          {CASE_DECISIONS.map((decision) => (
            <option key={decision} value={decision}>
              {formatLabel(decision)}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-medium text-ink">
        <span>Assign officer</span>
        <select
          name="assignedTo"
          defaultValue={state.values.assignedTo ?? ""}
          disabled={disabled}
          className={inputClassName}
        >
          <option value="">Unassign</option>
          {officers.map((officer) => (
            <option key={officer.id} value={officer.id}>
              {officer.label}
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
          placeholder="Decision rationale or review notes"
          maxLength={2000}
        />
      </label>

      {state.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}

      <AuthSubmitButton
        disabled={disabled || cases.length === 0}
        idleLabel="Update case"
        pendingLabel="Saving update..."
      />
    </form>
  );
}
