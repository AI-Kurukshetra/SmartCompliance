"use client";

import { useActionState } from "react";
import { runWatchlistScreeningAction } from "@/app/actions/watchlist";
import { AuthSubmitButton } from "@/components/auth/submit-button";
import {
  INITIAL_WATCHLIST_FORM_STATE,
} from "@/components/watchlist/form-state";
import { WATCHLIST_PROVIDERS } from "@/modules/watchlist/types";

type RunScreeningFormProps = {
  disabled?: boolean;
  sessions: Array<{
    id: string;
    label: string;
  }>;
};

const inputClassName =
  "w-full rounded-2xl border border-ink/20 bg-white px-4 py-3 text-sm text-ink shadow-[0_1px_0_rgba(9,24,43,0.03)] outline-none transition placeholder:text-ink/35 focus:border-ink/40 focus:ring-2 focus:ring-ink/10";

function formatProvider(value: string) {
  return value.replaceAll("_", " ");
}

export function RunScreeningForm({
  disabled = false,
  sessions,
}: RunScreeningFormProps) {
  const [state, formAction] = useActionState(
    runWatchlistScreeningAction,
    INITIAL_WATCHLIST_FORM_STATE,
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

      <label className="grid gap-2 text-sm font-medium text-ink">
        <span>Provider</span>
        <select
          name="provider"
          defaultValue={state.values.provider ?? WATCHLIST_PROVIDERS[0]}
          disabled={disabled}
          className={inputClassName}
          required
        >
          {WATCHLIST_PROVIDERS.map((provider) => (
            <option key={provider} value={provider}>
              {formatProvider(provider)}
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
        idleLabel="Run screening"
        pendingLabel="Screening..."
      />
    </form>
  );
}
