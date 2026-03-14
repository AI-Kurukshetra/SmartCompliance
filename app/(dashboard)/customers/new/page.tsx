import Image from "next/image";
import Link from "next/link";
import { CreateCustomerForm } from "@/components/customers/create-customer-form";
import {
  ArrowRightIcon,
  GlobeIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";

export const metadata = {
  title: "Add Customer | SmartCompliance",
};

export default async function NewCustomerPage() {
  const isSupabaseEnabled = hasSupabaseEnv();
  const tenantContext = isSupabaseEnabled ? await getTenantContext() : null;
  const canCreateCustomers = tenantContext
    ? canManageTenant(tenantContext.role)
    : false;

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex rounded-xl bg-ink p-2 text-shell">
                <UsersIcon />
              </span>
              <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Customer onboarding</p>
            </div>
            <h1 className="mt-3 font-[var(--font-display)] text-4xl leading-tight text-ink md:text-5xl">
              Create customer profile
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink/70">
              Add a customer record with identity, contact, and baseline risk details.
            </p>
          </div>
          <Link
            href="/customers"
            className="rounded-xl border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-ink/30 hover:bg-white"
          >
            Back to customers
          </Link>
        </div>
      </article>

      <article className="panel rounded-[2rem] p-4 md:p-6">
        {!isSupabaseEnabled ? (
          <p className="mb-5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Supabase environment variables are missing, so form submission is disabled.
          </p>
        ) : null}
        {isSupabaseEnabled && tenantContext && !canCreateCustomers ? (
          <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your role can review customer data but cannot create new records.
          </p>
        ) : null}
        <CreateCustomerForm disabled={!isSupabaseEnabled || !canCreateCustomers} />
      </article>

      <aside className="panel-strong rounded-[2rem] p-4 md:p-5">
        <Image
          src="/customer-onboarding-visual.svg"
          alt="Customer and verification workflow illustration"
          width={1280}
          height={760}
          className="h-auto w-full rounded-[1.2rem]"
        />
        <div className="mt-4 space-y-3 rounded-[1.2rem] border border-ink/10 bg-white/88 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-ink/54">Checklist</p>
          <p className="flex items-center gap-2 text-sm text-ink/70">
            <UsersIcon className="h-4 w-4 text-ink/55" />
            Verify full legal first and last name.
          </p>
          <p className="flex items-center gap-2 text-sm text-ink/70">
            <GlobeIcon className="h-4 w-4 text-ink/55" />
            Use ISO country code and primary contact details.
          </p>
          <p className="flex items-center gap-2 text-sm text-ink/70">
            <ShieldCheckIcon className="h-4 w-4 text-ink/55" />
            Set baseline risk level before starting verification.
          </p>
          <Link
            href="/verifications/new"
            className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-ink transition hover:text-ink/75"
          >
            Start verification next
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </aside>
    </section>
  );
}
