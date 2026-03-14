"use client";

import { useActionState } from "react";
import { generateReportAction } from "@/app/actions/reports";
import { AuthSubmitButton } from "@/components/auth/submit-button";
import { INITIAL_REPORT_FORM_STATE } from "@/components/reports/form-state";
import { REPORT_TYPES } from "@/modules/reports/types";

type GenerateReportFormProps = {
  disabled?: boolean;
};

const inputClassName =
  "field-input";

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function GenerateReportForm({ disabled = false }: GenerateReportFormProps) {
  const [state, formAction] = useActionState(
    generateReportAction,
    INITIAL_REPORT_FORM_STATE,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium text-ink">
        <span>Report type</span>
        <select
          name="reportType"
          defaultValue={state.values.reportType ?? "sar"}
          disabled={disabled}
          className={inputClassName}
          required
        >
          {REPORT_TYPES.map((type) => (
            <option key={type} value={type}>
              {formatLabel(type)}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-medium text-ink">
        <span>Lookback window (days)</span>
        <input
          type="number"
          name="daysBack"
          min={1}
          max={365}
          defaultValue={state.values.daysBack ?? "30"}
          disabled={disabled}
          className={inputClassName}
        />
      </label>

      {state.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}

      <AuthSubmitButton
        disabled={disabled}
        idleLabel="Generate report"
        pendingLabel="Building report..."
      />
    </form>
  );
}

