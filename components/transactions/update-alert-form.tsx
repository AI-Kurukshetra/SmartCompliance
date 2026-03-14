"use client";

import { useActionState } from "react";
import { updateAlertStatusAction } from "@/app/actions/transactions";
import { AuthSubmitButton } from "@/components/auth/submit-button";
import { INITIAL_ALERT_UPDATE_FORM_STATE } from "@/components/transactions/form-state";
import { ALERT_STATUSES } from "@/modules/transactions/types";

type UpdateAlertFormProps = {
  disabled?: boolean;
  alerts: Array<{
    id: string;
    label: string;
  }>;
};

const inputClassName =
  "field-input";

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function UpdateAlertForm({ disabled = false, alerts }: UpdateAlertFormProps) {
  const [state, formAction] = useActionState(
    updateAlertStatusAction,
    INITIAL_ALERT_UPDATE_FORM_STATE,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium text-ink">
        <span>Alert</span>
        <select
          name="alertId"
          defaultValue={state.values.alertId ?? ""}
          disabled={disabled}
          className={inputClassName}
          required
        >
          <option value="">Select alert</option>
          {alerts.map((alert) => (
            <option key={alert.id} value={alert.id}>
              {alert.label}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2 text-sm font-medium text-ink">
        <span>Status</span>
        <select
          name="status"
          defaultValue={state.values.status ?? "acknowledged"}
          disabled={disabled}
          className={inputClassName}
          required
        >
          {ALERT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {formatLabel(status)}
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
        disabled={disabled || alerts.length === 0}
        idleLabel="Update alert"
        pendingLabel="Updating..."
      />
    </form>
  );
}

