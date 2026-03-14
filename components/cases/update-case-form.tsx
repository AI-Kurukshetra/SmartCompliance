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
  "field-input";

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

      <label className="flex items-center gap-3 rounded-2xl border border-ink/12 bg-shell px-4 py-3 text-sm font-medium text-ink">
        <input
          type="checkbox"
          name="requestAdditionalDocuments"
          value="true"
          defaultChecked={
            state.values.requestAdditionalDocuments === "true" ||
            state.values.requestAdditionalDocuments === "on"
          }
          disabled={disabled}
          className="h-4 w-4 rounded border-ink/30"
        />
        Request additional documentation from customer
      </label>
      <p className="text-xs text-ink/55">
        This sets case status to <strong>in review</strong> and records a request
        note.
      </p>

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

