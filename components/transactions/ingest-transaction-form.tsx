"use client";

import { useActionState } from "react";
import { ingestTransactionAction } from "@/app/actions/transactions";
import { AuthSubmitButton } from "@/components/auth/submit-button";
import { INITIAL_TRANSACTION_FORM_STATE } from "@/components/transactions/form-state";

type IngestTransactionFormProps = {
  disabled?: boolean;
  customers: Array<{
    id: string;
    label: string;
  }>;
};

const inputClassName =
  "field-input";

export function IngestTransactionForm({
  disabled = false,
  customers,
}: IngestTransactionFormProps) {
  const [state, formAction] = useActionState(
    ingestTransactionAction,
    INITIAL_TRANSACTION_FORM_STATE,
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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-ink">
          <span>Amount</span>
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            name="amount"
            defaultValue={state.values.amount ?? ""}
            disabled={disabled}
            className={inputClassName}
            placeholder="1000.00"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-ink">
          <span>Currency</span>
          <input
            required
            name="currency"
            defaultValue={state.values.currency ?? "USD"}
            disabled={disabled}
            className={inputClassName}
            placeholder="USD"
            maxLength={3}
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium text-ink">
        <span>Transaction type</span>
        <input
          required
          name="transactionType"
          defaultValue={state.values.transactionType ?? ""}
          disabled={disabled}
          className={inputClassName}
          placeholder="bank_transfer, card_payment, crypto_transfer..."
          maxLength={120}
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-ink">
        <span>Counterparty country (optional)</span>
        <input
          name="counterpartyCountry"
          defaultValue={state.values.counterpartyCountry ?? ""}
          disabled={disabled}
          className={inputClassName}
          placeholder="US"
          maxLength={2}
        />
      </label>

      {state.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}

      <AuthSubmitButton
        disabled={disabled || customers.length === 0}
        idleLabel="Ingest transaction"
        pendingLabel="Running monitoring..."
      />
    </form>
  );
}

