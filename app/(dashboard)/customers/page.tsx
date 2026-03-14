import Image from "next/image";
import Link from "next/link";
import {
  PlusCircleIcon,
  SearchIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { canManageTenant } from "@/lib/auth-shared";
import { getTenantContext } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { listCustomers } from "@/modules/customers/repository";
import { CUSTOMER_RISK_LEVELS } from "@/modules/customers/types";
import { customerFiltersSchema } from "@/modules/customers/validation";

export const metadata = {
  title: "Customers | SmartCompliance",
};

type CustomersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not provided";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatRiskLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function riskPillClass(riskLevel: string) {
  switch (riskLevel) {
    case "critical":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "high":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "medium":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
}

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const params = searchParams ? await searchParams : {};
  const parsedFilters = customerFiltersSchema.safeParse({
    q: typeof params.q === "string" ? params.q : params.q?.[0],
    risk: typeof params.risk === "string" ? params.risk : params.risk?.[0],
  });

  const filters = parsedFilters.success
    ? {
        query: parsedFilters.data.q,
        risk: parsedFilters.data.risk,
      }
    : {
        query: undefined,
        risk: undefined,
      };

  const isSupabaseEnabled = hasSupabaseEnv();
  const tenantContext = isSupabaseEnabled ? await getTenantContext() : null;
  const canCreateCustomers = tenantContext
    ? canManageTenant(tenantContext.role)
    : false;
  const customers =
    isSupabaseEnabled && tenantContext
      ? await listCustomers(
          {
            supabase: await createClient(),
            tenantId: tenantContext.tenantId,
          },
          filters,
        )
      : [];

  const filteredCount = customers.length;
  const hasActiveFilters = Boolean(filters.query || filters.risk);
  const highRiskCount = customers.filter(
    (item) => item.riskLevel === "high" || item.riskLevel === "critical",
  ).length;

  return (
    <section className="space-y-6">
      <article className="panel relative overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="shine-line absolute inset-x-6 top-0 h-px opacity-80" />
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex rounded-xl bg-ink p-2 text-shell">
                <UsersIcon />
              </span>
              <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Customer data</p>
            </div>
            <h1 className="mt-3 font-[var(--font-display)] text-4xl leading-tight text-ink md:text-5xl">
              Customers
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ink/70">
              Manage tenant-scoped customer records, apply risk filters, and prepare
              profiles for verification workflows.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={canCreateCustomers ? "/customers/new" : "/customers"}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                canCreateCustomers
                  ? "inline-flex items-center gap-2 bg-ink text-shell hover:bg-ink/92"
                  : "cursor-not-allowed border border-ink/15 text-ink/45"
              }`}
              aria-disabled={!canCreateCustomers}
            >
              {canCreateCustomers ? <PlusCircleIcon className="h-4 w-4" /> : null}
              Add customer
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.25rem] border border-ink/10 bg-white/82 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Visible</p>
            <p className="mt-2 font-[var(--font-display)] text-3xl text-ink">
              {filteredCount}
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-ink/10 bg-white/82 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Workspace</p>
            <p className="mt-2 text-base font-semibold text-ink">
              {tenantContext?.tenantName ?? "Preview mode"}
            </p>
            <p className="text-xs text-ink/58">{tenantContext?.tenantSlug ?? "No tenant"}</p>
          </div>
          <div className="rounded-[1.25rem] border border-ink/10 bg-white/82 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-ink/55">Capabilities</p>
            <p className="mt-2 text-sm text-ink/72">
              {canCreateCustomers ? "Create and review customers" : "Review-only access"}
            </p>
            <p className="text-xs text-ink/58">{highRiskCount} high risk profiles</p>
          </div>
        </div>

        <div className="mt-4 rounded-[1.2rem] border border-ink/10 bg-white/82 p-3 md:max-w-md">
          <Image
            src="/customer-onboarding-visual.svg"
            alt="Customer onboarding dashboard visual"
            width={1280}
            height={760}
            className="h-auto w-full rounded-[1rem]"
          />
        </div>
      </article>

      <article className="panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-ink/55">Roster</p>
            <p className="mt-2 text-sm leading-7 text-ink/70">
              Search by name or email and filter by current risk posture.
            </p>
          </div>
          <form className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_170px_auto_auto]">
            <label className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
              <input
                name="q"
                defaultValue={filters.query ?? ""}
                className="w-full rounded-xl border border-ink/15 bg-white py-2.5 pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-ink/35"
                placeholder="Search name or email"
              />
            </label>
            <select
              name="risk"
              defaultValue={filters.risk ?? ""}
              className="rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-ink/35"
            >
              <option value="">All risks</option>
              {CUSTOMER_RISK_LEVELS.map((riskLevel) => (
                <option key={riskLevel} value={riskLevel}>
                  {formatRiskLabel(riskLevel)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-shell transition hover:bg-ink/92"
            >
              Apply
            </button>
            {hasActiveFilters ? (
              <Link
                href="/customers"
                className="rounded-xl border border-ink/15 px-4 py-2.5 text-center text-sm font-semibold text-ink transition hover:border-ink/30 hover:bg-white"
              >
                Reset
              </Link>
            ) : null}
          </form>
        </div>

        {!isSupabaseEnabled ? (
          <p className="mt-5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Supabase environment variables are missing, so customer data is in preview
            mode.
          </p>
        ) : null}

        {isSupabaseEnabled && tenantContext && !canCreateCustomers ? (
          <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You have review-only access. Create and update actions are hidden.
          </p>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-[1.2rem] border border-ink/10 bg-white/88">
          <div className="hidden border-b border-ink/10 bg-shell/70 px-4 py-3 text-xs uppercase tracking-[0.24em] text-ink/52 md:grid md:grid-cols-[2fr_1.4fr_120px_100px_120px_90px]">
            <p>Customer</p>
            <p>Contact</p>
            <p>Risk</p>
            <p>Country</p>
            <p>Created</p>
            <p>Action</p>
          </div>

          {customers.length > 0 ? (
            customers.map((customer) => (
              <article
                key={customer.id}
                className="border-b border-ink/8 px-4 py-4 last:border-b-0 md:grid md:grid-cols-[2fr_1.4fr_120px_100px_120px_90px] md:items-center md:gap-3"
              >
                <div>
                  <p className="font-semibold text-ink">
                    {customer.firstName} {customer.lastName}
                  </p>
                  <p className="mt-1 text-xs text-ink/55">
                    DOB: {formatDate(customer.dateOfBirth)}
                  </p>
                </div>

                <div className="mt-3 text-sm text-ink/68 md:mt-0">
                  <p>{customer.email ?? "No email"}</p>
                  <p className="text-xs text-ink/55">{customer.phone ?? "No phone"}</p>
                </div>

                <div className="mt-3 md:mt-0">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${riskPillClass(
                      customer.riskLevel,
                    )}`}
                  >
                    {formatRiskLabel(customer.riskLevel)}
                  </span>
                </div>

                <p className="mt-3 text-sm text-ink/68 md:mt-0">
                  {customer.countryCode ?? "--"}
                </p>

                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-ink/54 md:mt-0">
                  {formatDate(customer.createdAt)}
                </p>

                <div className="mt-3 md:mt-0">
                  {canCreateCustomers ? (
                    <Link
                      href={`/customers/${customer.id}/edit`}
                      className="inline-flex rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-ink transition hover:border-ink/35 hover:bg-shell"
                    >
                      Edit
                    </Link>
                  ) : (
                    <span className="text-xs uppercase tracking-[0.18em] text-ink/40">
                      View
                    </span>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="px-4 py-8 text-sm text-ink/68">
              <p className="flex items-center gap-2">
                <ShieldCheckIcon className="h-4 w-4 text-ink/55" />
                No customers matched these filters.
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-ink/45">
                Try resetting risk filters or search term.
              </p>
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
