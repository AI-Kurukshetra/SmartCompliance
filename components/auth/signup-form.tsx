"use client";

import { useActionState } from "react";
import { signupAction } from "@/app/actions/auth";
import {
  INITIAL_AUTH_FORM_STATE,
} from "@/components/auth/form-state";
import { AuthSubmitButton } from "@/components/auth/submit-button";
import {
  BuildingIcon,
  LockIcon,
  MailIcon,
  UserBadgeIcon,
} from "@/components/ui/icons";

type SignupFormProps = {
  disabled?: boolean;
};

const inputClassName =
  "field-input field-input-icon";

export function SignupForm({ disabled = false }: SignupFormProps) {
  const [state, formAction] = useActionState(signupAction, INITIAL_AUTH_FORM_STATE);

  return (
    <form action={formAction} className="mt-2 grid gap-6">
      <div className="grid gap-4 rounded-[1.4rem] border border-ink/10 bg-white/84 p-4 md:grid-cols-2 md:p-5">
        <div className="md:col-span-2">
          <p className="app-kicker">Workspace</p>
        </div>
        <label className="grid gap-2 text-sm font-medium text-ink">
          <span>Workspace name</span>
          <span className="relative">
            <BuildingIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
            <input
              required
              name="tenantName"
              defaultValue={state.values.tenantName ?? ""}
              disabled={disabled}
              className={inputClassName}
              placeholder="Northwind Compliance"
            />
          </span>
        </label>
        <label className="grid gap-2 text-sm font-medium text-ink">
          <span>Workspace slug</span>
          <span className="relative">
            <BuildingIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
            <input
              required
              name="tenantSlug"
              defaultValue={state.values.tenantSlug ?? ""}
              disabled={disabled}
              className={inputClassName}
              placeholder="northwind-compliance"
            />
          </span>
        </label>
      </div>
      <div className="grid gap-4 rounded-[1.4rem] border border-ink/10 bg-white/84 p-4 md:grid-cols-2 md:p-5">
        <div className="md:col-span-2">
          <p className="app-kicker">Owner account</p>
        </div>
        <label className="grid gap-2 text-sm font-medium text-ink">
          <span>Admin name</span>
          <span className="relative">
            <UserBadgeIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
            <input
              required
              name="fullName"
              autoComplete="name"
              defaultValue={state.values.fullName ?? ""}
              disabled={disabled}
              className={inputClassName}
              placeholder="Avery Stone"
            />
          </span>
        </label>
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
              placeholder="avery@company.com"
            />
          </span>
        </label>
        <label className="grid gap-2 text-sm font-medium text-ink md:col-span-2">
          <span>Password</span>
          <span className="relative">
            <LockIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
            <input
              required
              name="password"
              type="password"
              autoComplete="new-password"
              disabled={disabled}
              className={inputClassName}
              placeholder="At least 8 characters"
            />
          </span>
        </label>
      </div>
      {state.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}
      <AuthSubmitButton
        disabled={disabled}
        idleLabel="Create workspace"
        pendingLabel="Provisioning workspace..."
        className="w-full sm:w-auto sm:px-6"
      />
    </form>
  );
}
