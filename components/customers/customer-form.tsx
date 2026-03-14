"use client";

import { useActionState } from "react";
import { AuthSubmitButton } from "@/components/auth/submit-button";
import {
  type CustomerFormState,
  type CustomerFormValues,
} from "@/components/customers/form-state";
import {
  ActivityIcon,
  CalendarIcon,
  GlobeIcon,
  MailIcon,
  PhoneIcon,
  UserBadgeIcon,
} from "@/components/ui/icons";
import { CUSTOMER_RISK_LEVELS } from "@/modules/customers/types";

type CustomerFormProps = {
  action: (
    state: CustomerFormState,
    formData: FormData,
  ) => Promise<CustomerFormState>;
  disabled?: boolean;
  initialValues?: CustomerFormValues;
  submitIdleLabel: string;
  submitPendingLabel: string;
};

const inputClassName =
  "w-full rounded-2xl border border-ink/18 bg-white px-12 py-3 text-sm text-ink shadow-[0_1px_0_rgba(9,24,43,0.03)] outline-none transition placeholder:text-ink/35 focus:border-ink/40 focus:ring-2 focus:ring-ink/10";

function formatRiskLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function CustomerForm({
  action,
  disabled = false,
  initialValues = {},
  submitIdleLabel,
  submitPendingLabel,
}: CustomerFormProps) {
  const [state, formAction] = useActionState(action, {
    error: null,
    values: initialValues,
  });
  const values = {
    ...initialValues,
    ...state.values,
  };

  return (
    <form action={formAction} className="space-y-8">
      {values.customerId ? (
        <input type="hidden" name="customerId" value={values.customerId} />
      ) : null}

      <section className="grid gap-5 rounded-[1.6rem] border border-ink/10 bg-white/85 p-5 md:grid-cols-2 md:p-6">
        <div className="md:col-span-2">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink/52">
            <UserBadgeIcon className="h-4 w-4" />
            Identity details
          </p>
        </div>
        <label className="grid gap-2 text-sm font-medium text-ink">
          <span>First name</span>
          <span className="relative">
            <UserBadgeIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
            <input
              required
              name="firstName"
              defaultValue={values.firstName ?? ""}
              disabled={disabled}
              className={inputClassName}
              placeholder="Avery"
              autoComplete="given-name"
            />
          </span>
        </label>
        <label className="grid gap-2 text-sm font-medium text-ink">
          <span>Last name</span>
          <span className="relative">
            <UserBadgeIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
            <input
              required
              name="lastName"
              defaultValue={values.lastName ?? ""}
              disabled={disabled}
              className={inputClassName}
              placeholder="Stone"
              autoComplete="family-name"
            />
          </span>
        </label>
        <label className="grid gap-2 text-sm font-medium text-ink">
          <span>Date of birth</span>
          <span className="relative">
            <CalendarIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
            <input
              name="dateOfBirth"
              type="date"
              defaultValue={values.dateOfBirth ?? ""}
              disabled={disabled}
              className={inputClassName}
              autoComplete="bday"
            />
          </span>
        </label>
        <label className="grid gap-2 text-sm font-medium text-ink">
          <span>Country code</span>
          <span className="relative">
            <GlobeIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
            <input
              name="countryCode"
              defaultValue={values.countryCode ?? ""}
              disabled={disabled}
              className={inputClassName}
              placeholder="US"
              maxLength={2}
            />
          </span>
        </label>
      </section>

      <section className="grid gap-5 rounded-[1.6rem] border border-ink/10 bg-white/85 p-5 md:grid-cols-2 md:p-6">
        <div className="md:col-span-2">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-ink/52">
            <ActivityIcon className="h-4 w-4" />
            Contact and risk
          </p>
        </div>
        <label className="grid gap-2 text-sm font-medium text-ink">
          <span>Email</span>
          <span className="relative">
            <MailIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
            <input
              name="email"
              type="email"
              defaultValue={values.email ?? ""}
              disabled={disabled}
              className={inputClassName}
              placeholder="avery@company.com"
              autoComplete="email"
            />
          </span>
        </label>
        <label className="grid gap-2 text-sm font-medium text-ink">
          <span>Phone</span>
          <span className="relative">
            <PhoneIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
            <input
              name="phone"
              defaultValue={values.phone ?? ""}
              disabled={disabled}
              className={inputClassName}
              placeholder="+1 202 555 0142"
              autoComplete="tel"
            />
          </span>
        </label>
        <label className="grid gap-2 text-sm font-medium text-ink md:col-span-2">
          <span>Risk level</span>
          <span className="relative">
            <ActivityIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
            <select
              name="riskLevel"
              defaultValue={values.riskLevel ?? "low"}
              disabled={disabled}
              className={inputClassName}
            >
              {CUSTOMER_RISK_LEVELS.map((riskLevel) => (
                <option key={riskLevel} value={riskLevel}>
                  {formatRiskLabel(riskLevel)}
                </option>
              ))}
            </select>
          </span>
        </label>
      </section>

      {state.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}

      <AuthSubmitButton
        className="w-full sm:w-auto sm:px-8"
        disabled={disabled}
        idleLabel={submitIdleLabel}
        pendingLabel={submitPendingLabel}
      />
    </form>
  );
}
