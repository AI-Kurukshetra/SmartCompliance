"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import {
  INITIAL_AUTH_FORM_STATE,
} from "@/components/auth/form-state";
import { AuthSubmitButton } from "@/components/auth/submit-button";
import { LockIcon, MailIcon } from "@/components/ui/icons";

type LoginFormProps = {
  disabled?: boolean;
};

const inputClassName =
  "w-full rounded-2xl border border-ink/14 bg-white px-12 py-3 text-sm text-ink shadow-[0_1px_0_rgba(9,24,43,0.03)] outline-none transition placeholder:text-ink/35 focus:border-ink/35 focus:ring-2 focus:ring-ink/10";

export function LoginForm({ disabled = false }: LoginFormProps) {
  const [state, formAction] = useActionState(loginAction, INITIAL_AUTH_FORM_STATE);

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium text-ink">
        <span>Work email</span>
        <span className="relative">
          <MailIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
          <input
            required
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={state.values.email ?? ""}
            disabled={disabled}
            className={inputClassName}
            placeholder="email@company.com"
          />
        </span>
      </label>
      <label className="grid gap-2 text-sm font-medium text-ink">
        <span>Password</span>
        <span className="relative">
          <LockIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
          <input
            required
            name="password"
            type="password"
            autoComplete="current-password"
            disabled={disabled}
            className={inputClassName}
            placeholder="Password"
          />
        </span>
      </label>
      {state.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}
      <AuthSubmitButton
        disabled={disabled}
        idleLabel="Sign in"
        pendingLabel="Signing in..."
      />
    </form>
  );
}
