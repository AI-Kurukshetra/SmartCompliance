"use client";

import { useActionState } from "react";
import { createVerificationSessionAction } from "@/app/actions/verifications";
import { AuthSubmitButton } from "@/components/auth/submit-button";
import {
  INITIAL_VERIFICATION_FORM_STATE,
} from "@/components/verifications/form-state";

type CreateSessionFormProps = {
  disabled?: boolean;
  customers: Array<{
    id: string;
    label: string;
  }>;
};

const inputClassName =
  "w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 text-sm text-ink shadow-[0_1px_0_rgba(9,24,43,0.03)] outline-none transition placeholder:text-ink/35 focus:border-ink/40 focus:ring-2 focus:ring-ink/10";

export function CreateSessionForm({
  disabled = false,
  customers,
}: CreateSessionFormProps) {
  const [state, formAction] = useActionState(
    createVerificationSessionAction,
    INITIAL_VERIFICATION_FORM_STATE,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium text-ink">
        <span>Customer</span>
        <select
          name="customerId"
          defaultValue={state.values.customerId ?? ""}
          disabled={disabled}
          className={inputClassName}
          required
        >
          <option value="">Select customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.label}
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
        disabled={disabled || customers.length === 0}
        idleLabel="Start verification"
        pendingLabel="Creating session..."
      />
    </form>
  );
}
